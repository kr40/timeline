import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getVoterId } from '../utils';
import { FUN_POLLS, type FunPollId } from '../data/funPolls';
import { TRAIT_IDS, type Gender, type PollsState, type Side, type SideResult, type TraitId } from '../data/polls';

const emptySide = (): SideResult => ({ mine: null, counts: { aditi: 0, kartik: 0 } });

const initialState = (): PollsState => ({
	loading: true,
	gender: { mine: null, boys: 0, girls: 0 },
	traits: Object.fromEntries(TRAIT_IDS.map(t => [t, emptySide()])) as Record<TraitId, SideResult>,
	fun: Object.fromEntries(FUN_POLLS.map(p => [p.id, emptySide()])) as Record<FunPollId, SideResult>,
});

const isSide = (value: unknown): value is Side => value === 'aditi' || value === 'kartik';

/** Moves this visitor's vote to `side`, adjusting counts. */
const applySide = (result: SideResult, side: Side): SideResult => {
	const counts = { ...result.counts };
	if (result.mine) counts[result.mine] = Math.max(0, counts[result.mine] - 1);
	counts[side]++;
	return { mine: side, counts };
};

/** All ten polls (boy/girl, traits, Aditi vs Kartik) with realtime counts and optimistic voting. */
export function usePolls() {
	const voterId = useRef(getVoterId()).current;
	const [state, setState] = useState<PollsState>(initialState);
	const stateRef = useRef(state);
	stateRef.current = state;
	const mounted = useRef(true);

	const load = useCallback(async () => {
		const [genderRes, traitRes, funRes] = await Promise.all([
			supabase.from('votes').select('choice, voter_id'),
			supabase.from('trait_votes').select('trait, choice, voter_id'),
			supabase.from('fun_poll_votes').select('poll, choice, voter_id'),
		]);
		const next = initialState();
		next.loading = false;
		for (const row of genderRes.data ?? []) {
			if (row.choice === 'boy') next.gender.boys++;
			else if (row.choice === 'girl') next.gender.girls++;
			else continue;
			if (row.voter_id === voterId) next.gender.mine = row.choice as Gender;
		}
		for (const row of traitRes.data ?? []) {
			const result = next.traits[row.trait as TraitId];
			if (!result || !isSide(row.choice)) continue;
			result.counts[row.choice]++;
			if (row.voter_id === voterId) result.mine = row.choice;
		}
		for (const row of funRes.data ?? []) {
			const result = next.fun[row.poll as FunPollId];
			if (!result || !isSide(row.choice)) continue;
			result.counts[row.choice]++;
			if (row.voter_id === voterId) result.mine = row.choice;
		}
		if (!mounted.current) return;
		setState(next);
	}, [voterId]);

	useEffect(() => {
		mounted.current = true;
		return () => { mounted.current = false; };
	}, []);

	useEffect(() => {
		void load();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			clearTimeout(timer);
			timer = setTimeout(() => { void load(); }, 250);
		};
		const channel = supabase
			.channel('polls-realtime')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, refresh)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'trait_votes' }, refresh)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'fun_poll_votes' }, refresh)
			.subscribe();
		return () => {
			clearTimeout(timer);
			void supabase.removeChannel(channel);
		};
	}, [load]);

	/** Boy/girl: one vote per device, never changed. Name is required. */
	const voteGender = useCallback(async (choice: Gender, name: string) => {
		const before = stateRef.current.gender;
		if (before.mine) return;
		setState(prev => ({
			...prev,
			gender: {
				mine: choice,
				boys: prev.gender.boys + (choice === 'boy' ? 1 : 0),
				girls: prev.gender.girls + (choice === 'girl' ? 1 : 0),
			},
		}));
		const { error } = await supabase.from('votes').insert({ voter_id: voterId, choice, voter_name: name });
		if (error) {
			setState(prev => ({ ...prev, gender: before }));
			throw error;
		}
	}, [voterId]);

	const voteTrait = useCallback(async (trait: TraitId, side: Side) => {
		const before = stateRef.current.traits[trait];
		setState(prev => ({ ...prev, traits: { ...prev.traits, [trait]: applySide(prev.traits[trait], side) } }));
		const { error } = await supabase
			.from('trait_votes')
			.upsert({ voter_id: voterId, trait, choice: side }, { onConflict: 'voter_id,trait' });
		if (error) {
			setState(prev => ({ ...prev, traits: { ...prev.traits, [trait]: before } }));
			throw error;
		}
	}, [voterId]);

	const voteFun = useCallback(async (poll: FunPollId, side: Side) => {
		const before = stateRef.current.fun[poll];
		setState(prev => ({ ...prev, fun: { ...prev.fun, [poll]: applySide(prev.fun[poll], side) } }));
		const { error } = await supabase
			.from('fun_poll_votes')
			.upsert({ voter_id: voterId, poll, choice: side }, { onConflict: 'voter_id,poll' });
		if (error) {
			setState(prev => ({ ...prev, fun: { ...prev.fun, [poll]: before } }));
			throw error;
		}
	}, [voterId]);

	return { state, voteGender, voteTrait, voteFun };
}

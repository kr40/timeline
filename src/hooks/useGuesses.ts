import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { FriendlyError, getVoterId } from '../utils';
import { getGuessDateRange } from '../config';
import { Guess } from '../types';

export const GUESS_RANGE = getGuessDateRange();

export const formatGuessDate = (value: string): string =>
	new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const byCreated = (a: Guess, b: Guess) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

/** Guess-the-birthday: everyone's guesses, this visitor's guess, and the unlocked winner reveal. */
export function useGuesses() {
	const voterId = useRef(getVoterId()).current;
	const [guesses, setGuesses] = useState<Guess[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data } = await supabase.from('guesses').select('*').order('created_at', { ascending: true });
			if (cancelled) return;
			setGuesses(data ?? []);
			setLoading(false);
		})();
		return () => { cancelled = true; };
	}, []);

	const submit = useCallback(async (name: string, date: string) => {
		if (date < GUESS_RANGE.min || date > GUESS_RANGE.max) {
			throw new FriendlyError(`Pick a date between ${formatGuessDate(GUESS_RANGE.min)} and ${formatGuessDate(GUESS_RANGE.max)}.`);
		}
		const { data, error } = await supabase
			.from('guesses')
			.upsert({ voter_id: voterId, guesser_name: name, guess_date: date, is_winner: false }, { onConflict: 'voter_id' })
			.select()
			.single();
		if (error) throw error;
		setGuesses(prev => [...prev.filter(g => g.voter_id !== voterId), data as Guess].sort(byCreated));
	}, [voterId]);

	const revealWinner = useCallback(async () => {
		const { data: capsule } = await supabase
			.from('birth_capsule')
			.select('birth_date')
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle();
		if (!capsule?.birth_date) throw new FriendlyError('Fill in the birth date in the Baby Book first.');
		const birthDate = capsule.birth_date as string;
		const { error } = await supabase.from('guesses').update({ is_winner: true }).eq('guess_date', birthDate);
		if (error) throw error;
		setGuesses(prev => prev.map(g => ({ ...g, is_winner: g.guess_date === birthDate })));
	}, []);

	const myGuess = guesses.find(g => g.voter_id === voterId) ?? null;
	const hasWinner = guesses.some(g => g.is_winner);

	return { guesses, loading, myGuess, hasWinner, submit, revealWinner };
}

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Vote } from '../../types';
import { getVoterId } from '../../utils';

type PollState =
	| { status: 'loading' }
	| { status: 'ready'; voterName: string }
	| { status: 'submitting' }
	| { status: 'voted'; choice: 'boy' | 'girl'; boys: number; girls: number }
	| { status: 'error'; message: string };

const fetchCounts = async (): Promise<{ boys: number; girls: number }> => {
	const { data, error } = await supabase.from('votes').select('choice');
	if (error) throw error;
	const rows = (data ?? []) as Pick<Vote, 'choice'>[];
	return {
		boys:  rows.filter(r => r.choice === 'boy').length,
		girls: rows.filter(r => r.choice === 'girl').length,
	};
};

export const PollWidget = () => {
	const voterIdRef = useRef(getVoterId());
	const voterId = voterIdRef.current;
	const [state, setState] = useState<PollState>({ status: 'loading' });

	useEffect(() => {
		const init = async () => {
			try {
				const { data: existing } = await supabase
					.from('votes').select('choice').eq('voter_id', voterId).maybeSingle();
				if (existing) {
					const counts = await fetchCounts();
					setState({ status: 'voted', choice: existing.choice, ...counts });
				} else {
					setState({ status: 'ready', voterName: '' });
				}
			} catch {
				setState({ status: 'ready', voterName: '' });
			}
		};
		void init();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const channel = supabase
			.channel('votes-realtime')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, async () => {
				fetchCounts()
					.then(counts => setState(p => p.status === 'voted' ? { ...p, ...counts } : p))
					.catch(() => {});
			})
			.subscribe();
		return () => { void supabase.removeChannel(channel); };
	}, []);

	const handleVote = async (choice: 'boy' | 'girl') => {
		if (state.status !== 'ready') return;
		const voterName = state.voterName.trim() || null;
		setState({ status: 'submitting' });
		try {
			const { error } = await supabase.from('votes').insert({ voter_id: voterId, choice, voter_name: voterName });
			if (error) throw error;
			const counts = await fetchCounts();
			setState({ status: 'voted', choice, ...counts });
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Vote failed. Try again.';
			setState({ status: 'error', message });
		}
	};

	const total   = state.status === 'voted' ? state.boys + state.girls : 0;
	const boyPct  = total > 0 && state.status === 'voted' ? Math.round((state.boys  / total) * 100) : 50;
	const girlPct = total > 0 && state.status === 'voted' ? Math.round((state.girls / total) * 100) : 50;

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-1'>Boy or Girl? 🤔</h2>
			<p className='text-xs text-[#6B7280] font-semibold mb-4'>Cast your prediction!</p>

			{(state.status === 'loading' || state.status === 'submitting') && (
				<div className='flex justify-center py-6'>
					<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
				</div>
			)}

			{state.status === 'ready' && (
				<>
					<input
						type='text'
						placeholder='Your name (optional)'
						value={state.voterName}
						onChange={e => setState({ status: 'ready', voterName: e.target.value })}
						className='w-full px-4 py-2.5 mb-4 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#6CC9C9] transition-colors'
					/>
					<div className='grid grid-cols-2 gap-3'>
						<button onClick={() => handleVote('boy')}
							className='flex items-center justify-center gap-2 py-4 rounded-2xl font-poppins font-bold text-white bg-[#6BAED6] hover:bg-[#5a9ec6] active:scale-95 transition-all text-lg shadow-md shadow-[#6BAED6]/30'>
							💙 Boy
						</button>
						<button onClick={() => handleVote('girl')}
							className='flex items-center justify-center gap-2 py-4 rounded-2xl font-poppins font-bold text-white bg-[#FF8FAB] hover:bg-[#ff7a9c] active:scale-95 transition-all text-lg shadow-md shadow-[#FF8FAB]/30'>
							🩷 Girl
						</button>
					</div>
				</>
			)}

			{state.status === 'voted' && (
				<>
					<div className='mb-2 flex justify-between text-xs font-bold text-[#6B7280]'>
						<span>💙 {boyPct}% ({state.boys})</span>
						<span>{total} votes</span>
						<span>{girlPct}% ({state.girls}) 🩷</span>
					</div>
					<div className='h-5 rounded-full overflow-hidden bg-[#FF8FAB]'>
						<div className='h-full bg-[#6BAED6] rounded-l-full transition-all duration-700' style={{ width: `${boyPct}%` }} />
					</div>
					<p className='mt-3 text-xs text-center text-[#6B7280] font-semibold'>
						You voted: {state.choice === 'boy' ? '💙 Boy' : '🩷 Girl'}
					</p>
				</>
			)}

			{state.status === 'error' && (
				<div className='text-xs text-red-500 font-semibold text-center bg-red-50 rounded-2xl px-4 py-3'>
					{state.message}
					<button onClick={() => setState({ status: 'ready', voterName: '' })}
						className='block mx-auto mt-1 text-[#FF8C69] underline'>Try again</button>
				</div>
			)}
		</div>
	);
};

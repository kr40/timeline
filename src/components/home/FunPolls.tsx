import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { FUN_POLLS, FunPollChoice, FunPollId } from '../../data/funPolls';

type Counts    = Record<FunPollChoice, number>;
type PollState = { voted: FunPollChoice | null; counts: Counts };

const emptyState = (): PollState => ({ voted: null, counts: { aditi: 0, kartik: 0 } });

const initStates = (): Record<FunPollId, PollState> => ({
	sleep:    emptyState(),
	diaper:   emptyState(),
	inherit:  emptyState(),
	pushover: emptyState(),
	googler:  emptyState(),
});

const CHOICE_COLORS: Record<FunPollChoice, string> = {
	aditi:  '#B39DDB',
	kartik: '#6CC9C9',
};

export const FunPolls = () => {
	const voterId = useRef(getVoterId());
	const [states, setStates] = useState<Record<FunPollId, PollState>>(initStates);

	const fetchAll = async () => {
		const { data } = await supabase.from('fun_poll_votes').select('poll, choice, voter_id');
		if (!data) return;

		const next = initStates();
		for (const def of FUN_POLLS) {
			const rows = data.filter(r => r.poll === def.id);
			const counts: Counts = { aditi: 0, kartik: 0 };
			for (const row of rows) counts[row.choice as FunPollChoice]++;
			const mine = rows.find(r => r.voter_id === voterId.current);
			next[def.id] = { voted: mine ? (mine.choice as FunPollChoice) : null, counts };
		}
		setStates(next);
	};

	useEffect(() => {
		fetchAll();

		const channel = supabase
			.channel('fun_poll_votes_changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'fun_poll_votes' }, () => {
				fetchAll();
			})
			.subscribe();

		return () => { supabase.removeChannel(channel); };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const vote = async (poll: FunPollId, choice: FunPollChoice) => {
		const old = states[poll];
		const counts = { ...old.counts };
		if (old.voted) counts[old.voted] = Math.max(0, counts[old.voted] - 1);
		counts[choice]++;
		setStates(prev => ({ ...prev, [poll]: { voted: choice, counts } }));

		const { error } = await supabase.from('fun_poll_votes').upsert(
			{ voter_id: voterId.current, poll, choice },
			{ onConflict: 'voter_id,poll' },
		);

		if (error) {
			setStates(prev => ({ ...prev, [poll]: old }));
		}
	};

	return (
		<div className='mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-3'>Aditi vs Kartik 🥊</h2>
			<div className='space-y-3'>
				{FUN_POLLS.map(def => {
					const { voted, counts } = states[def.id];
					const total = counts.aditi + counts.kartik;

					return (
						<div key={def.id} className='bg-white rounded-3xl shadow-md p-5'>
							<p className='font-poppins font-bold text-sm text-[#1A1A2E] mb-3'>{def.question}</p>

							{voted === null ? (
								<div className='flex gap-2'>
									<button
										onClick={() => vote(def.id, 'aditi')}
										className='flex-1 rounded-full border-2 border-[#B39DDB]/50 py-2.5 text-xs font-bold text-[#B39DDB] hover:bg-[#B39DDB]/10 transition-colors'>
										{def.aditiLabel}
									</button>
									<button
										onClick={() => vote(def.id, 'kartik')}
										className='flex-1 rounded-full border-2 border-[#6CC9C9]/50 py-2.5 text-xs font-bold text-[#6CC9C9] hover:bg-[#6CC9C9]/10 transition-colors'>
										{def.kartikLabel}
									</button>
								</div>
							) : (
								<div className='space-y-2'>
									{(['aditi', 'kartik'] as const).map(c => {
										const pct  = total > 0 ? Math.round((counts[c] / total) * 100) : 0;
										const isMe = voted === c;
										const label = c === 'aditi' ? def.aditiLabel : def.kartikLabel;
										return (
											<div key={c}>
												<div className='flex justify-between text-[11px] font-bold mb-0.5'>
													<span style={{ color: isMe ? CHOICE_COLORS[c] : '#94A3B8' }}>
														{label}{isMe && ' ✓'}
													</span>
													<span className='text-slate-400'>{pct}%</span>
												</div>
												<div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
													<div
														className='h-full rounded-full transition-all duration-500'
														style={{ width: `${pct}%`, backgroundColor: isMe ? CHOICE_COLORS[c] : '#CBD5E1' }}
													/>
												</div>
											</div>
										);
									})}
									<p className='text-[10px] text-slate-400 text-right mt-1'>
										{total} vote{total !== 1 ? 's' : ''}
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

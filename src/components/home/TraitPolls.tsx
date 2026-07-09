import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';

type Trait  = 'eyes' | 'nose' | 'hair' | 'smile';
type Choice = 'mum' | 'dad' | 'mix';

const TRAITS: { id: Trait; emoji: string; label: string }[] = [
	{ id: 'eyes',  emoji: '👀', label: 'Whose eyes?'  },
	{ id: 'nose',  emoji: '👃', label: 'Whose nose?'  },
	{ id: 'hair',  emoji: '💇', label: 'Whose hair?'  },
	{ id: 'smile', emoji: '😄', label: 'Whose smile?' },
];

const CHOICES: { id: Choice; label: string }[] = [
	{ id: 'mum', label: 'Mum'         },
	{ id: 'dad', label: 'Dad'         },
	{ id: 'mix', label: 'Mix of Both' },
];

type Counts     = Record<Choice, number>;
type TraitState = { voted: Choice | null; counts: Counts };

const emptyState = (): TraitState => ({ voted: null, counts: { mum: 0, dad: 0, mix: 0 } });

const initStates = (): Record<Trait, TraitState> => ({
	eyes:  emptyState(),
	nose:  emptyState(),
	hair:  emptyState(),
	smile: emptyState(),
});

export const TraitPolls = () => {
	const voterId = useRef(getVoterId());
	const [states, setStates] = useState<Record<Trait, TraitState>>(initStates);

	const fetchAll = async () => {
		const { data } = await supabase.from('trait_votes').select('trait, choice, voter_id');
		if (!data) return;

		const next = initStates();
		for (const trait of TRAITS.map(t => t.id)) {
			const rows = data.filter(r => r.trait === trait);
			const counts: Counts = { mum: 0, dad: 0, mix: 0 };
			for (const row of rows) counts[row.choice as Choice]++;
			const mine = rows.find(r => r.voter_id === voterId.current);
			next[trait] = { voted: mine ? (mine.choice as Choice) : null, counts };
		}
		setStates(next);
	};

	useEffect(() => {
		fetchAll();

		const channel = supabase
			.channel('trait_votes_changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'trait_votes' }, () => {
				fetchAll();
			})
			.subscribe();

		return () => { supabase.removeChannel(channel); };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const vote = async (trait: Trait, choice: Choice) => {
		const old = states[trait];
		const counts = { ...old.counts };
		if (old.voted) counts[old.voted] = Math.max(0, counts[old.voted] - 1);
		counts[choice]++;
		setStates(prev => ({ ...prev, [trait]: { voted: choice, counts } }));

		const { error } = await supabase.from('trait_votes').upsert(
			{ voter_id: voterId.current, trait, choice },
			{ onConflict: 'voter_id,trait' },
		);

		if (error) {
			// Roll back optimistic update on failure
			setStates(prev => ({ ...prev, [trait]: old }));
		}
	};

	return (
		<div className='mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-3'>Who will baby look like? 👶</h2>
			<div className='grid grid-cols-2 gap-3'>
				{TRAITS.map(({ id, emoji, label }) => {
					const { voted, counts } = states[id];
					const total = counts.mum + counts.dad + counts.mix;

					return (
						<div key={id} className='bg-white rounded-3xl shadow-md p-4'>
							<p className='font-poppins font-bold text-sm text-[#1A1A2E] mb-3'>
								{emoji} {label}
							</p>

							{voted === null ? (
								<div className='flex flex-col gap-1.5'>
									{CHOICES.map(({ id: c, label: cl }) => (
										<button
											key={c}
											onClick={() => vote(id, c)}
											className='rounded-full border-2 border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:border-[#FF8C69] hover:text-[#FF8C69] transition-colors'>
											{cl}
										</button>
									))}
								</div>
							) : (
								<div className='space-y-1.5'>
									{CHOICES.map(({ id: c, label: cl }) => {
										const pct   = total > 0 ? Math.round((counts[c] / total) * 100) : 0;
										const isMe  = voted === c;
										return (
											<div key={c}>
												<div className='flex justify-between text-[10px] font-bold mb-0.5'>
													<span className={isMe ? 'text-[#FF8C69]' : 'text-slate-400'}>
														{cl}{isMe && ' ✓'}
													</span>
													<span className='text-slate-400'>{pct}%</span>
												</div>
												<div className='h-1.5 rounded-full bg-slate-100 overflow-hidden'>
													<div
														className='h-full rounded-full transition-all duration-500'
														style={{ width: `${pct}%`, backgroundColor: isMe ? '#FF8C69' : '#CBD5E1' }}
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

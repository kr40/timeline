import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';

const EMOJIS = ['❤️', '😂', '🥹', '🎉'] as const;
type Emoji = typeof EMOJIS[number];

const EMPTY: Record<Emoji, number> = { '❤️': 0, '😂': 0, '🥹': 0, '🎉': 0 };

export const ReactionBar = ({ wishId }: { wishId: string }) => {
	const voterId    = useRef(getVoterId());
	const [counts,   setCounts]   = useState<Record<Emoji, number>>({ ...EMPTY });
	const [mine,     setMine]     = useState<Set<Emoji>>(new Set());
	const [toggling, setToggling] = useState<Emoji | null>(null);

	useEffect(() => {
		(async () => {
			const { data } = await supabase
				.from('wish_reactions')
				.select('voter_id, emoji')
				.eq('wish_id', wishId);
			if (!data) return;

			const c: Record<Emoji, number> = { ...EMPTY };
			const m = new Set<Emoji>();
			for (const row of data) {
				c[row.emoji as Emoji] = (c[row.emoji as Emoji] ?? 0) + 1;
				if (row.voter_id === voterId.current) m.add(row.emoji as Emoji);
			}
			setCounts(c);
			setMine(m);
		})();
	}, [wishId]);

	const toggle = async (emoji: Emoji) => {
		if (toggling) return;
		setToggling(emoji);
		const isActive = mine.has(emoji);

		// Optimistic update
		setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? -1 : 1)) }));
		setMine(prev => {
			const next = new Set(prev);
			isActive ? next.delete(emoji) : next.add(emoji);
			return next;
		});

		try {
			if (isActive) {
				await supabase.from('wish_reactions').delete()
					.eq('voter_id', voterId.current)
					.eq('wish_id', wishId)
					.eq('emoji', emoji);
			} else {
				await supabase.from('wish_reactions').insert({
					voter_id: voterId.current,
					wish_id:  wishId,
					emoji,
				});
			}
		} catch {
			// Roll back optimistic update
			setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? 1 : -1)) }));
			setMine(prev => {
				const next = new Set(prev);
				isActive ? next.add(emoji) : next.delete(emoji);
				return next;
			});
		} finally {
			setToggling(null);
		}
	};

	return (
		<div className='flex gap-2 mt-3 pt-3 border-t border-slate-100'>
			{EMOJIS.map(emoji => {
				const count  = counts[emoji];
				const active = mine.has(emoji);
				return (
					<button
						key={emoji}
						onClick={() => toggle(emoji)}
						disabled={toggling !== null}
						className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed ${
							active
								? 'bg-[#FF8C69]/15 border border-[#FF8C69]/40'
								: 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
						}`}>
						<span>{emoji}</span>
						{count > 0 && (
							<span className='text-xs font-bold text-slate-500'>{count}</span>
						)}
					</button>
				);
			})}
		</div>
	);
};

import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { EmojiName } from '../../emoji';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { Emoji } from '../ui/Emoji';

const EMOJIS = ['❤️', '😂', '🥹', '🎉'] as const;
type Reaction = typeof EMOJIS[number];

const PICTURE: Record<Reaction, EmojiName> = {
	'❤️': 'red-heart',
	'😂': 'face-with-tears-of-joy',
	'🥹': 'face-holding-back-tears',
	'🎉': 'party-popper',
};

const EMPTY: Record<Reaction, number> = { '❤️': 0, '😂': 0, '🥹': 0, '🎉': 0 };

export const ReactionBar = ({ wishId }: { wishId: string }) => {
	const voterId = useRef(getVoterId());
	const [counts, setCounts] = useState<Record<Reaction, number>>({ ...EMPTY });
	const [mine, setMine] = useState<Set<Reaction>>(new Set());
	const [toggling, setToggling] = useState<Reaction | null>(null);

	useEffect(() => {
		(async () => {
			const { data } = await supabase.from('wish_reactions').select('voter_id, emoji').eq('wish_id', wishId);
			if (!data) return;
			const c: Record<Reaction, number> = { ...EMPTY };
			const m = new Set<Reaction>();
			for (const row of data) {
				c[row.emoji as Reaction] = (c[row.emoji as Reaction] ?? 0) + 1;
				if (row.voter_id === voterId.current) m.add(row.emoji as Reaction);
			}
			setCounts(c);
			setMine(m);
		})();
	}, [wishId]);

	const toggle = async (emoji: Reaction) => {
		if (toggling) return;
		setToggling(emoji);
		const isActive = mine.has(emoji);

		setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? -1 : 1)) }));
		setMine(prev => {
			const next = new Set(prev);
			isActive ? next.delete(emoji) : next.add(emoji);
			return next;
		});

		try {
			if (isActive) {
				const { error } = await supabase.from('wish_reactions').delete()
					.eq('voter_id', voterId.current)
					.eq('wish_id', wishId)
					.eq('emoji', emoji);
				if (error) throw error;
			} else {
				const { error } = await supabase.from('wish_reactions').insert({ voter_id: voterId.current, wish_id: wishId, emoji });
				if (error) throw error;
			}
		} catch {
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
		<div className='mt-2.5 flex flex-wrap gap-1'>
			{EMOJIS.map(emoji => {
				const count = counts[emoji];
				const active = mine.has(emoji);
				return (
					<motion.button
						key={emoji}
						type='button'
						onClick={() => void toggle(emoji)}
						disabled={toggling !== null}
						whileTap={{ scale: 0.85 }}
						aria-pressed={active}
						aria-label={`React with ${emoji}${count > 0 ? ` (${count})` : ''}`}
						className={`flex min-h-8 items-center gap-0.5 rounded-full border-[1.5px] px-2 py-0.5 transition-colors ${
							active ? 'border-ink bg-white shadow-sticker-xs' : 'border-ink/20 bg-white/60'
						}`}
					>
						<motion.span
							key={active ? 'on' : 'off'}
							className='inline-flex'
							initial={{ scale: active ? 1.7 : 1 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring', stiffness: 500, damping: 12 }}
						>
							<Emoji name={PICTURE[emoji]} size={16} />
						</motion.span>
						{count > 0 && (
							<motion.span
								key={count}
								initial={{ y: -6, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								className='text-[11px] font-extrabold tabular-nums'
							>
								{count}
							</motion.span>
						)}
					</motion.button>
				);
			})}
		</div>
	);
};

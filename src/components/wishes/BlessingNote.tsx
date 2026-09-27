import { motion } from 'motion/react';
import type { Wish } from '../../types';
import { relativeTime } from '../../utils';
import { TONE_BG, type Tone } from '../ui/Card';
import { Emoji } from '../ui/Emoji';
import { ReactionBar } from './ReactionBar';

const BLESSING_TONES: Tone[] = ['lav', 'butter', 'pink'];
const ADVICE_TONES: Tone[] = ['mint', 'sky', 'peach'];

/** Stable across the optimistic → saved swap (the id changes, the text doesn't). */
const hash = (s: string) => {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return Math.abs(h);
};

export const BlessingNote = ({ wish, pending }: { wish: Wish; pending: boolean }) => {
	const seed = hash(wish.author_name + wish.message);
	const tone = (wish.category === 'advice' ? ADVICE_TONES : BLESSING_TONES)[seed % 3];
	const tilt = ((seed % 7) - 3) * 0.5;

	return (
		<motion.article
			initial={{ opacity: 0, scale: 0.8, rotate: tilt * 4, y: 16 }}
			whileInView={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
			viewport={{ once: true, margin: '0px 0px -24px 0px' }}
			transition={{ type: 'spring', stiffness: 260, damping: 20 }}
			className={`relative mb-4 break-inside-avoid rounded-2xl border-2 border-ink px-3.5 pb-3 pt-5 shadow-sticker-sm ${TONE_BG[tone]}`}
		>
			<span aria-hidden className='absolute -top-2.5 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 border border-ink/20 bg-white/70' />
			{wish.category && (
				<Emoji
					name={wish.category === 'blessing' ? 'folded-hands' : 'light-bulb'}
					size={22}
					alt={wish.category === 'blessing' ? 'Blessing' : 'Advice'}
					className='absolute right-2 top-2'
				/>
			)}
			<p className='whitespace-pre-line break-words pr-5 text-[14px] font-bold leading-snug'>{wish.message}</p>
			<p className='mt-2.5 font-display text-[14px] font-extrabold'>— {wish.author_name}</p>
			<p className='text-[11px] font-bold text-ink/55'>{relativeTime(wish.created_at)}</p>
			{!pending && <ReactionBar wishId={wish.id} />}
		</motion.article>
	);
};

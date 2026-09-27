import { motion } from 'motion/react';
import type { EmojiName } from '../emoji';
import { Emoji } from './ui/Emoji';

const ITEMS: { name: EmojiName; className: string; size: number; delay: number }[] = [
	{ name: 'balloon',       className: 'left-[6%] top-[14%]',              size: 72, delay: 0 },
	{ name: 'cloud',         className: 'left-[15%] top-[36%] opacity-60',  size: 56, delay: 0.6 },
	{ name: 'teddy-bear',    className: 'left-[8%] top-[60%]',              size: 84, delay: 1.2 },
	{ name: 'star',          className: 'right-[8%] top-[15%]',             size: 52, delay: 0.9 },
	{ name: 'crescent-moon', className: 'right-[16%] top-[37%] opacity-70', size: 46, delay: 0.3 },
	{ name: 'baby-bottle',   className: 'right-[7%] top-[58%]',             size: 78, delay: 1.8 },
];

/** Decorative floating pictures in the side gutters of wide screens (≥1280px only). */
export const Doodles = () => (
	<div aria-hidden className='pointer-events-none fixed inset-0 z-0 hidden xl:block'>
		{ITEMS.map(item => (
			<motion.div
				key={item.name}
				className={`absolute ${item.className}`}
				animate={{ y: [0, -14, 0], rotate: [-5, 5, -5] }}
				transition={{ duration: 7 + item.delay, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
			>
				<Emoji name={item.name} size={item.size} />
			</motion.div>
		))}
	</div>
);

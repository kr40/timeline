import { motion } from 'motion/react';
import { ReactNode } from 'react';
import type { EmojiName } from '../../emoji';
import { Card } from './Card';
import { Emoji } from './Emoji';

type Props = { emoji: EmojiName; title: string; body?: string; children?: ReactNode };

export const EmptyState = ({ emoji, title, body, children }: Props) => (
	<Card className='flex flex-col items-center px-6 py-10 text-center'>
		<motion.div
			animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }}
			transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
		>
			<Emoji name={emoji} size={68} />
		</motion.div>
		<p className='mt-4 font-display text-display-md font-extrabold'>{title}</p>
		{body && <p className='mt-1.5 max-w-xs text-sm font-semibold text-muted'>{body}</p>}
		{children}
	</Card>
);

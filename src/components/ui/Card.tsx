import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export type Tone = 'white' | 'paper' | 'peach' | 'mint' | 'lav' | 'butter' | 'pink' | 'sky';

export const TONE_BG: Record<Tone, string> = {
	white:  'bg-white',
	paper:  'bg-paper',
	peach:  'bg-peach',
	mint:   'bg-mint',
	lav:    'bg-lav',
	butter: 'bg-butter',
	pink:   'bg-pink',
	sky:    'bg-sky',
};

type Props = HTMLMotionProps<'div'> & {
	tone?: Tone;
	/** Sticker press effect + pointer cursor; with onClick it also becomes keyboard-activatable. */
	interactive?: boolean;
};

/** Sticker card: 2px ink outline + offset ink shadow. */
export const Card = forwardRef<HTMLDivElement, Props>(
	({ tone = 'white', interactive = false, className = '', onClick, onKeyDown, ...rest }, ref) => {
		const keyboard = interactive && onClick
			? {
				role: 'button' as const,
				tabIndex: 0,
				onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
					onKeyDown?.(e);
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.currentTarget.click();
					}
				},
			}
			: { onKeyDown };

		return (
			<motion.div
				ref={ref}
				whileTap={interactive ? { x: 3, y: 3 } : undefined}
				transition={{ type: 'spring', stiffness: 700, damping: 30 }}
				className={`rounded-card border-2 border-ink shadow-sticker ${TONE_BG[tone]} ${
					interactive ? 'cursor-pointer select-none transition-shadow duration-100 active:shadow-sticker-xs' : ''
				} ${className}`}
				{...keyboard}
				{...rest}
				onClick={onClick}
			/>
		);
	},
);
Card.displayName = 'Card';

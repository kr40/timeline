import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { TONE_BG, type Tone } from './Card';

type Size = 'sm' | 'md' | 'lg';

type Props = HTMLMotionProps<'button'> & {
	tone?: Tone;
	size?: Size;
	/** Full width. */
	block?: boolean;
	/** Fully rounded ends. */
	pill?: boolean;
};

const SIZES: Record<Size, string> = {
	sm: 'gap-1.5 px-3 py-1.5 text-xs shadow-sticker-sm',
	md: 'gap-2 px-4 py-2.5 text-sm shadow-sticker-sm',
	lg: 'gap-2 px-5 py-3.5 text-base shadow-sticker',
};

/** Sticker button: lifts on hover, pushes into the page on press. */
export const Button = forwardRef<HTMLButtonElement, Props>(
	({ tone = 'butter', size = 'md', block = false, pill = false, className = '', disabled, type = 'button', ...rest }, ref) => (
		<motion.button
			ref={ref}
			type={type}
			disabled={disabled}
			whileHover={disabled ? undefined : { y: -1 }}
			whileTap={disabled ? undefined : { x: 2, y: 2 }}
			transition={{ type: 'spring', stiffness: 700, damping: 28 }}
			className={`inline-flex items-center justify-center border-2 border-ink text-center font-extrabold leading-tight text-ink ${TONE_BG[tone]} ${SIZES[size]} ${
				pill || size === 'sm' ? 'rounded-full' : 'rounded-2xl'
			} ${block ? 'w-full' : ''} active:shadow-sticker-xs disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
			{...rest}
		/>
	),
);
Button.displayName = 'Button';

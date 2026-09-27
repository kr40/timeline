import type { Transition, Variants } from 'motion/react';

export const springSnappy: Transition = { type: 'spring', stiffness: 520, damping: 32 };
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 24 };
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 18 };

/** Parent variant: staggers children that use `riseIn`. */
export const stagger: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Child variant: rises and settles with a soft spring. */
export const riseIn: Variants = {
	hidden: { opacity: 0, y: 18, scale: 0.98 },
	show: { opacity: 1, y: 0, scale: 1, transition: springSoft },
};

/** Gentle idle float for decorative pictures. Spread onto a motion element. */
export const floatLoop = (duration = 3.2, delay = 0) => ({
	animate: { y: [0, -6, 0], rotate: [-5, 5, -5] },
	transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
});

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';

/** Counts up to `value` on mount and glides between values after that. */
export const AnimatedNumber = ({ value, className = '' }: { value: number; className?: string }) => {
	const reduce = useReducedMotion();
	const count = useMotionValue(reduce ? value : 0);
	const text = useTransform(count, v => Math.round(v).toString());

	useEffect(() => {
		if (reduce) {
			count.set(value);
			return;
		}
		const controls = animate(count, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] });
		return () => controls.stop();
	}, [count, value, reduce]);

	return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
};

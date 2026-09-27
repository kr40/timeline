import { motion } from 'motion/react';

/** Three bouncing butter dots. */
export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
	<div role='status' aria-label={label} className='flex items-center justify-center gap-1.5 py-10'>
		{[0, 1, 2].map(i => (
			<motion.span
				key={i}
				className='block h-3 w-3 rounded-full border-2 border-ink bg-butter'
				animate={{ y: [0, -9, 0] }}
				transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
			/>
		))}
	</div>
);

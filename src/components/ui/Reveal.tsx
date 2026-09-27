import { motion } from 'motion/react';
import { ReactNode } from 'react';

type Props = { children: ReactNode; className?: string; delay?: number; rotate?: number };

/** Springs content in the first time it scrolls into view. */
export const Reveal = ({ children, className = '', delay = 0, rotate = 0 }: Props) => (
	<motion.div
		className={className}
		initial={{ opacity: 0, y: 22, scale: 0.96, rotate: rotate * 3 }}
		whileInView={{ opacity: 1, y: 0, scale: 1, rotate }}
		viewport={{ once: true, margin: '0px 0px -32px 0px' }}
		transition={{ type: 'spring', stiffness: 240, damping: 22, delay }}
	>
		{children}
	</motion.div>
);

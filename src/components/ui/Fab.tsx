import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import type { Tone } from './Card';

type Props = { label: string; onClick: () => void; tone?: Tone; children: ReactNode };

/** Floating action button above the tab bar, aligned to the right edge of the content column. */
export const Fab = ({ label, onClick, tone = 'butter', children }: Props) =>
	createPortal(
		<motion.div
			className='fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-304px))] z-30'
			initial={{ scale: 0, rotate: -15 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 }}
		>
			<Button tone={tone} size='lg' pill aria-label={label} onClick={onClick}>
				{children}
			</Button>
		</motion.div>,
		document.body,
	);

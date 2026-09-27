import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Emoji } from '../ui/Emoji';

/** A "Sealed with love" rubber stamp that slams onto the screen, then fades. */
export const SealStamp = ({ show, onDone }: { show: boolean; onDone: () => void }) => {
	useEffect(() => {
		if (!show) return;
		const timer = setTimeout(onDone, 2000);
		return () => clearTimeout(timer);
	}, [show, onDone]);

	return createPortal(
		<AnimatePresence>
			{show && (
				<motion.div
					key='stamp'
					className='pointer-events-none fixed inset-0 z-[70] grid place-items-center'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						role='status'
						aria-label='Birth capsule sealed'
						initial={{ scale: 2.6, rotate: -24, opacity: 0 }}
						animate={{ scale: 1, rotate: -9, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 380, damping: 16 }}
						className='grid h-44 w-44 place-items-center rounded-full border-[5px] border-double border-danger bg-paper/95 text-center shadow-sticker-lg'
					>
						<div>
							<Emoji name='ribbon' size={44} eager />
							<p className='mt-1 font-display text-xl font-extrabold uppercase leading-tight text-danger'>
								Sealed
								<br />
								with love
							</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
};

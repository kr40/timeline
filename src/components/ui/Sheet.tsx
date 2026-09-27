import { X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';

type Props = {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
};

let lockCount = 0;
let savedOverflow = '';
const lockScroll = () => {
	if (lockCount === 0) {
		savedOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
	}
	lockCount++;
};
const unlockScroll = () => {
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) document.body.style.overflow = savedOverflow;
};

/** Bottom sheet on phones (drag the handle down to dismiss); centred dialog from 640px up. */
export const Sheet = ({ open, onClose, title, children }: Props) => {
	const titleId = useId();
	const dragControls = useDragControls();
	const wide = useMediaQuery('(min-width: 640px)');
	const dialogRef = useRef<HTMLDivElement>(null);
	const previouslyFocused = useRef<HTMLElement | null>(null);
	const wasOpen = useRef(false);
	const holdingLock = useRef(false);

	// Capture the trigger element synchronously on the closed->open transition, before
	// the dialog mounts (and before any child's native autoFocus can steal it).
	if (open && !wasOpen.current) {
		previouslyFocused.current = document.activeElement as HTMLElement | null;
	}
	wasOpen.current = open;

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, onClose]);

	// Acquire the shared scroll lock once per open instance. Released only from
	// AnimatePresence's onExitComplete (or on unmount), never on this effect's cleanup,
	// so the page stays locked through the exit animation.
	useEffect(() => {
		if (!open) return;
		if (!holdingLock.current) {
			lockScroll();
			holdingLock.current = true;
		}
	}, [open]);

	// After the dialog has mounted, focus it — unless focus already landed inside it
	// (e.g. a child input with autoFocus), in which case leave that focus alone.
	useEffect(() => {
		if (!open) return;
		const dialog = dialogRef.current;
		if (dialog && !dialog.contains(document.activeElement)) {
			dialog.focus();
		}
	}, [open]);

	// Safety net: release the lock if the component unmounts while still holding it.
	useEffect(() => {
		return () => {
			if (holdingLock.current) {
				unlockScroll();
				holdingLock.current = false;
			}
		};
	}, []);

	return createPortal(
		<AnimatePresence
			onExitComplete={() => {
				if (holdingLock.current) {
					unlockScroll();
					holdingLock.current = false;
				}
				const el = previouslyFocused.current;
				const otherModalOpen = [...document.querySelectorAll('[aria-modal="true"]')].some(d => d !== dialogRef.current);
				if (el?.isConnected && !otherModalOpen) el.focus({ preventScroll: true });
				previouslyFocused.current = null;
			}}
		>
			{open && (
				<div key='sheet' className='fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6'>
					<motion.div
						aria-hidden
						className='absolute inset-0 bg-ink/45 backdrop-blur-[2px]'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
					/>
					<motion.div
						ref={dialogRef}
						role='dialog'
						aria-modal='true'
						aria-labelledby={titleId}
						tabIndex={-1}
						className='relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border-2 border-b-0 border-ink bg-paper shadow-sticker-lg outline-none sm:max-w-[520px] sm:rounded-card sm:border-b-2'
						initial={wide ? { opacity: 0, scale: 0.94, y: 16 } : { y: '100%' }}
						animate={wide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
						exit={wide ? { opacity: 0, scale: 0.96, y: 10 } : { y: '100%' }}
						transition={{ type: 'spring', stiffness: 420, damping: 38 }}
						drag={wide ? false : 'y'}
						dragControls={dragControls}
						dragListener={false}
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.7 }}
						onDragEnd={(_, info) => {
							if (info.offset.y > 110 || info.velocity.y > 650) onClose();
						}}
					>
						<div
							className='shrink-0 cursor-grab touch-none px-5 pt-2.5 sm:cursor-default sm:pt-5'
							onPointerDown={e => { if (!wide) dragControls.start(e); }}
						>
							<div aria-hidden className='mx-auto mb-2 h-1.5 w-11 rounded-full bg-ink/20 sm:hidden' />
							<div className='flex items-center justify-between gap-3 pb-3'>
								<h2 id={titleId} className='font-display text-display-md font-extrabold'>{title}</h2>
								<button
									type='button'
									aria-label='Close'
									onPointerDown={e => e.stopPropagation()}
									onClick={onClose}
									className='press grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
								>
									<X size={16} weight='bold' />
								</button>
							</div>
						</div>
						<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]'>
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	);
};

import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

type Props = {
	images:       string[];
	initialIndex: number;
	onClose:      () => void;
	title?:       string;
};

const ROUND_BUTTON = 'press grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm';

export const ExpandedImageModal = ({ images, initialIndex, onClose, title }: Props) => {
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const isMulti = images.length > 1;

	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const pinchDist  = useRef<number | null>(null);
	const pinchBase  = useRef(1);
	const touchMode  = useRef<'swipe' | 'pinch' | null>(null);

	useEffect(() => { setIndex(initialIndex); }, [initialIndex]);
	useEffect(() => { setScale(1); }, [index]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				// Capture phase, ahead of Sheet's document-level listener, so Escape closes
				// only this viewer — not the sheet beneath it too.
				e.stopPropagation();
				if (scale > 1) setScale(1); else onClose();
			}
			if (e.key === 'ArrowLeft'  && isMulti && scale <= 1) setIndex(i => (i - 1 + images.length) % images.length);
			if (e.key === 'ArrowRight' && isMulti && scale <= 1) setIndex(i => (i + 1) % images.length);
		};
		window.addEventListener('keydown', handler, true);
		return () => window.removeEventListener('keydown', handler, true);
	}, [onClose, isMulti, images.length, scale]);

	if (!images.length) return null;

	const navigate = (dir: 1 | -1) => {
		if (scale > 1) return;
		setIndex(i => (i + dir + images.length) % images.length);
	};

	const getDist = (touches: React.TouchList) =>
		Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			touchMode.current = 'pinch';
			pinchDist.current = getDist(e.touches);
			pinchBase.current = scale;
		} else {
			touchMode.current  = 'swipe';
			swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 2 && touchMode.current === 'pinch' && pinchDist.current !== null) {
			setScale(Math.max(1, Math.min(5, pinchBase.current * (getDist(e.touches) / pinchDist.current))));
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchMode.current === 'pinch') {
			setScale(s => (s < 1.15 ? 1 : s));
			pinchDist.current = null;
			if (e.touches.length === 0) touchMode.current = null;
			return;
		}
		if (touchMode.current === 'swipe' && swipeStart.current && isMulti && scale <= 1) {
			const dx = e.changedTouches[0].clientX - swipeStart.current.x;
			const dy = e.changedTouches[0].clientY - swipeStart.current.y;
			swipeStart.current = null;
			touchMode.current  = null;
			if (Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
		}
	};

	return (
		<motion.div
			role='dialog'
			aria-modal='true'
			aria-label='Photo viewer'
			className='fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-ink/85 p-4 backdrop-blur-sm'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.18 }}
			onClick={() => (scale > 1 ? setScale(1) : onClose())}
		>
			<motion.div
				className='relative flex max-h-[88vh] max-w-full items-center justify-center'
				style={{ touchAction: 'none' }}
				initial={{ scale: 0.94, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 320, damping: 28 }}
				onClick={e => e.stopPropagation()}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<img
					key={index}
					src={images[index]}
					alt={`${title ?? 'Memory'} — photo ${index + 1} of ${images.length}`}
					style={{ transform: `scale(${scale})`, transition: scale === 1 ? 'transform 0.2s ease' : 'none' }}
					className='max-h-[88vh] max-w-full cursor-auto select-none rounded-2xl border-[3px] border-white object-contain shadow-2xl'
					draggable={false}
				/>

				<button type='button' aria-label='Close' onClick={onClose} className={`${ROUND_BUTTON} absolute -right-3 -top-3 z-10`}>
					<X size={20} weight='bold' />
				</button>

				{isMulti && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:-left-14'>
							<button type='button' aria-label='Previous photo' onClick={() => navigate(-1)} className={ROUND_BUTTON}>
								<CaretLeft size={20} weight='bold' />
							</button>
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:-right-14'>
							<button type='button' aria-label='Next photo' onClick={() => navigate(1)} className={ROUND_BUTTON}>
								<CaretRight size={20} weight='bold' />
							</button>
						</div>
						<div className='pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-extrabold tabular-nums'>
							{index + 1} / {images.length}
						</div>
					</>
				)}
			</motion.div>

			{isMulti && (
				<div className='absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2' onClick={e => e.stopPropagation()}>
					{images.map((_, i) => (
						<button
							key={i}
							type='button'
							onClick={() => setIndex(i)}
							aria-label={`View photo ${i + 1}`}
							className={`h-2.5 rounded-full border-2 border-white transition-all duration-200 ${i === index ? 'w-6 bg-butter' : 'w-2.5 bg-white/40'}`}
						/>
					))}
				</div>
			)}
		</motion.div>
	);
};

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Props = {
	images:       string[];
	initialIndex: number;
	onClose:      () => void;
	title?:       string;
};

export const ExpandedImageModal = ({ images, initialIndex, onClose, title }: Props) => {
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const isMulti = images.length > 1;

	// Touch state
	const swipeStart  = useRef<{ x: number; y: number } | null>(null);
	const pinchDist   = useRef<number | null>(null);
	const pinchBase   = useRef(1);
	const touchMode   = useRef<'swipe' | 'pinch' | null>(null);

	useEffect(() => { setIndex(initialIndex); }, [initialIndex]);
	useEffect(() => { setScale(1); }, [index]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') { if (scale > 1) setScale(1); else onClose(); }
			if (e.key === 'ArrowLeft'  && isMulti && scale <= 1) setIndex(i => (i - 1 + images.length) % images.length);
			if (e.key === 'ArrowRight' && isMulti && scale <= 1) setIndex(i => (i + 1) % images.length);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [onClose, isMulti, images.length, scale]);

	if (!images.length) return null;

	const navigate = (dir: 1 | -1) => {
		if (scale > 1) return;
		setIndex(i => (i + dir + images.length) % images.length);
	};

	const getDist = (touches: React.TouchList) => {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.hypot(dx, dy);
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			touchMode.current  = 'pinch';
			pinchDist.current  = getDist(e.touches);
			pinchBase.current  = scale;
		} else {
			touchMode.current  = 'swipe';
			swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 2 && touchMode.current === 'pinch' && pinchDist.current !== null) {
			const next = Math.max(1, Math.min(5, pinchBase.current * (getDist(e.touches) / pinchDist.current)));
			setScale(next);
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
			if (Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy)) {
				navigate(dx < 0 ? 1 : -1);
			}
		}
	};

	return (
		<div
			role='dialog'
			aria-modal='true'
			aria-label='Image viewer'
			className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] cursor-pointer'
			onClick={() => (scale > 1 ? setScale(1) : onClose())}>

			<div
				className='relative max-w-full max-h-[90vh] flex items-center justify-center'
				style={{ touchAction: 'none' }}
				onClick={e => e.stopPropagation()}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}>

				<img
					key={index}
					src={images[index]}
					alt={`${title ?? 'Memory'} — photo ${index + 1} of ${images.length}`}
					style={{ transform: `scale(${scale})`, transition: scale === 1 ? 'transform 0.2s ease' : 'none' }}
					className='max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-auto select-none carousel-img-enter'
					draggable={false}
				/>

				<button
					onClick={onClose}
					className='absolute z-10 p-2 bg-white rounded-full shadow-xl -top-4 -right-4 text-slate-800 hover:bg-[#FF8C69]/10 hover:text-[#FF8C69] transition-colors'>
					<X className='w-6 h-6' />
				</button>

				{isMulti && (
					<button
						onClick={() => navigate(-1)}
						className='absolute left-2 sm:left-0 sm:-translate-x-full sm:-ml-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-xl text-slate-800 hover:bg-[#FF8C69]/10 hover:text-[#FF8C69] transition-colors'>
						<ChevronLeft className='w-6 h-6' />
					</button>
				)}
				{isMulti && (
					<button
						onClick={() => navigate(1)}
						className='absolute right-2 sm:right-0 sm:translate-x-full sm:mr-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-xl text-slate-800 hover:bg-[#FF8C69]/10 hover:text-[#FF8C69] transition-colors'>
						<ChevronRight className='w-6 h-6' />
					</button>
				)}

				{isMulti && (
					<div className='absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm font-bold rounded-full pointer-events-none'>
						{index + 1} / {images.length}
					</div>
				)}
			</div>

			{isMulti && (
				<div
					className='absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2'
					onClick={e => e.stopPropagation()}>
					{images.map((_, i) => (
						<button
							key={i}
							onClick={() => setIndex(i)}
							className={`rounded-full transition-all duration-200 ${
								i === index ? 'w-5 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
							}`}
							aria-label={`View photo ${i + 1}`}
						/>
					))}
				</div>
			)}
		</div>
	);
};

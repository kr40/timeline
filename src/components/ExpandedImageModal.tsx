import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';

type Props = {
	images:       string[];
	initialIndex: number;
	onClose:      () => void;
};

export const ExpandedImageModal = ({ images, initialIndex, onClose }: Props) => {
	const [index, setIndex] = useState(initialIndex);
	const isMulti = images.length > 1;
	const swipe = useSwipe(
		() => setIndex(i => (i + 1) % images.length),
		() => setIndex(i => (i - 1 + images.length) % images.length),
	);

	useEffect(() => { setIndex(initialIndex); }, [initialIndex]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
			if (e.key === 'ArrowLeft'  && isMulti) setIndex(i => (i - 1 + images.length) % images.length);
			if (e.key === 'ArrowRight' && isMulti) setIndex(i => (i + 1) % images.length);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [onClose, isMulti, images.length]);

	if (!images.length) return null;

	return (
		<div
			className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] cursor-pointer'
			onClick={onClose}>

			<div
				className='relative max-w-full max-h-[90vh] flex items-center justify-center touch-pan-y'
				onClick={e => e.stopPropagation()}
				{...(isMulti ? swipe : {})}>

				<img
					key={index}
					src={images[index]}
					alt={`Photo ${index + 1} of ${images.length}`}
					className='max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-auto select-none carousel-img-enter'
				/>

				<button
					onClick={onClose}
					className='absolute z-10 block p-2 bg-white rounded-full shadow-xl -top-4 -right-4 text-slate-800 hover:bg-pink-50 hover:text-pink-500 transition-colors'>
					<X className='w-6 h-6' />
				</button>

				{isMulti && (
					<button
						onClick={() => setIndex(i => (i - 1 + images.length) % images.length)}
						className='absolute left-0 -translate-x-full -ml-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-xl text-slate-800 hover:bg-pink-50 hover:text-pink-500 transition-colors'>
						<ChevronLeft className='w-6 h-6' />
					</button>
				)}
				{isMulti && (
					<button
						onClick={() => setIndex(i => (i + 1) % images.length)}
						className='absolute right-0 translate-x-full mr-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 rounded-full shadow-xl text-slate-800 hover:bg-pink-50 hover:text-pink-500 transition-colors'>
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

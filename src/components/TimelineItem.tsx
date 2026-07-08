import { Calendar, Pencil } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { Milestone, getImages } from '../types';
import { renderIcon } from '../icons';
import { formatDate } from '../utils';
import { FADE_IN_STEP_S, FADE_IN_MAX_S } from '../constants';

export const TimelineCard = memo(({
	milestone, onImageClick, onEditClick, isUnlocked,
}: {
	milestone:    Milestone;
	onImageClick: (images: string[], index: number) => void;
	onEditClick:  (milestone: Milestone) => void;
	isUnlocked:   boolean;
}) => {
	const images     = getImages(milestone);
	const hasImages  = images.length > 0;
	const isCarousel = images.length > 1;
	const [activeIndex, setActiveIndex] = useState(0);
	const safeIndex = hasImages ? Math.min(activeIndex, images.length - 1) : 0;
	const [imgLoaded, setImgLoaded] = useState(false);

	useEffect(() => { setImgLoaded(false); }, [safeIndex]);

	const prev  = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
	const next  = () => setActiveIndex(i => (i + 1) % images.length);
	const swipe = useSwipe(next, prev);

	return (
		<div className='relative bg-white w-full rounded-3xl p-5 shadow-md border border-slate-100 hover:shadow-lg transition-shadow duration-300 group'>
			{isUnlocked && (
				<button onClick={() => onEditClick(milestone)}
					className='absolute p-2 text-[#FF8C69] opacity-0 group-hover:opacity-100 top-4 right-4 bg-orange-50 hover:bg-orange-100 rounded-full transition-opacity'>
					<Pencil className='w-4 h-4' />
				</button>
			)}

			<div className='inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 text-xs font-bold text-[#FF8C69] bg-[#FF8C69]/10 rounded-full'>
				<Calendar className='w-3.5 h-3.5' />
				<span>{formatDate(milestone.date)}</span>
			</div>

			<h3 className='font-poppins font-extrabold text-xl text-[#1A1A2E] mb-3 pr-8 leading-tight'>
				{milestone.title}
			</h3>

			{hasImages && (
				<div className='mb-4 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer touch-pan-y'
					{...(isCarousel ? swipe : {})}
					onClick={() => onImageClick(images, safeIndex)}>
					<div className='relative w-full aspect-[4/3]'>
						{!imgLoaded && (
							<div className='absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100' />
						)}
						<img
							key={safeIndex}
							src={images[safeIndex]}
							alt={`${milestone.title} – photo ${safeIndex + 1}`}
							loading='lazy'
							onLoad={() => setImgLoaded(true)}
							className={`object-cover w-full h-full carousel-img-enter transition-opacity duration-300 select-none ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
						/>
					</div>
					{isCarousel && (
						<div className='flex justify-center gap-1.5 py-2 bg-white' onClick={e => e.stopPropagation()}>
							{images.map((_, i) => (
								<button key={i} onClick={() => setActiveIndex(i)}
									className={`rounded-full transition-all duration-200 ${i === safeIndex ? 'w-4 h-2 bg-[#FF8C69]' : 'w-2 h-2 bg-slate-200'}`}
									aria-label={`Go to photo ${i + 1}`} />
							))}
						</div>
					)}
				</div>
			)}

			{milestone.description && (
				<p className='text-sm text-[#6B7280] font-semibold leading-relaxed'>{milestone.description}</p>
			)}
		</div>
	);
});

export const TimelineItem = memo(({
	milestone, index, onImageClick, onEditClick, isUnlocked,
}: {
	milestone:    Milestone;
	index:        number;
	onImageClick: (images: string[], index: number) => void;
	onEditClick:  (milestone: Milestone) => void;
	isUnlocked:   boolean;
}) => (
	<div className='relative mb-6 animate-fade-in-up'
		style={{ animationDelay: `${Math.min(index * FADE_IN_STEP_S, FADE_IN_MAX_S)}s` }}>
		<div className='absolute -left-2 top-5 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-[#FF8C69]/30 shadow-sm'>
			{renderIcon(milestone.icon)}
		</div>
		<div className='pl-12'>
			<TimelineCard
				milestone={milestone}
				onImageClick={onImageClick}
				onEditClick={onEditClick}
				isUnlocked={isUnlocked}
			/>
		</div>
	</div>
));

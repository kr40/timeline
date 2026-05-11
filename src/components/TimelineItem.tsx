import { Calendar, Pencil } from 'lucide-react';
import { memo, useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { Milestone, getImages } from '../types';
import { renderIcon } from '../icons';
import { formatDate } from '../utils';

export const TimelineCard = memo(
	({
		milestone,
		onImageClick,
		onEditClick,
	}: {
		milestone:    Milestone;
		onImageClick: (images: string[], index: number) => void;
		onEditClick:  (milestone: Milestone) => void;
	}) => {
		const images = getImages(milestone);
		const hasImages = images.length > 0;
		const isCarousel = images.length > 1;
		const [activeIndex, setActiveIndex] = useState(0);
		const safeIndex = hasImages ? Math.min(activeIndex, images.length - 1) : 0;

		const prev = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
		const next = () => setActiveIndex(i => (i + 1) % images.length);
		const swipe = useSwipe(next, prev);

		return (
			<div className='relative bg-white w-full rounded-3xl p-6 shadow-xl shadow-pink-100 border-4 border-pink-200 transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-200 hover:border-pink-300 group'>
				<button
					onClick={() => onEditClick(milestone)}
					className='absolute p-2 text-pink-400 transition-colors rounded-full shadow-sm opacity-0 top-4 right-4 bg-pink-50 hover:bg-pink-100 hover:text-pink-600 group-hover:opacity-100'>
					<Pencil className='w-5 h-5' />
				</button>

				<div className='inline-flex items-center px-5 py-2 mb-5 space-x-2 text-lg font-extrabold text-purple-800 transition-colors bg-purple-100 rounded-full shadow-sm group-hover:bg-purple-200'>
					<Calendar className='w-5 h-5' />
					<span>{formatDate(milestone.date)}</span>
				</div>

				<h3 className='pr-10 mb-4 text-3xl font-extrabold text-slate-800'>{milestone.title}</h3>

				{hasImages && (
					<div
						className='mb-6 p-3 pb-6 md:p-4 md:pb-8 bg-white rounded-xl shadow-md border border-slate-200 transform transition-all duration-300 group-hover:scale-[1.03] group-hover:-rotate-2 group-hover:shadow-xl group-hover:border-pink-200 cursor-pointer'
						onClick={() => onImageClick(images, safeIndex)}>

						<div
							className='relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-slate-50 border border-slate-100 touch-pan-y'
							{...(isCarousel ? swipe : {})}>
							<img
								key={safeIndex}
								src={images[safeIndex]}
								alt={`${milestone.title} – photo ${safeIndex + 1}`}
								loading='lazy'
								className='object-cover object-center w-full h-full select-none carousel-img-enter'
							/>
						</div>

						{isCarousel && (
							<div
								className='flex justify-center gap-1.5 mt-3'
								onClick={e => e.stopPropagation()}>
								{images.map((_, i) => (
									<button
										key={i}
										onClick={() => setActiveIndex(i)}
										className={`rounded-full transition-all duration-200 ${
											i === safeIndex ? 'w-4 h-2 bg-pink-400' : 'w-2 h-2 bg-slate-300 hover:bg-pink-300'
										}`}
										aria-label={`Go to photo ${i + 1}`}
									/>
								))}
							</div>
						)}
					</div>
				)}

				<p className='text-xl leading-relaxed text-slate-600'>{milestone.description}</p>
			</div>
		);
	},
);

export const TimelineItem = memo(
	({
		milestone,
		index,
		onImageClick,
		onEditClick,
	}: {
		milestone:    Milestone;
		index:        number;
		onImageClick: (images: string[], index: number) => void;
		onEditClick:  (milestone: Milestone) => void;
	}) => (
		<div
			className={`relative mb-12 animate-fade-in-up md:flex md:items-center md:justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
			style={{ animationDelay: `${Math.min(index * 0.15, 1.5)}s` }}>
			<div className='absolute z-10 flex items-center justify-center transition-all duration-300 transform -translate-x-1/2 bg-white border-4 border-pink-100 rounded-full shadow-md left-1/2 w-14 h-14 hover:scale-110 hover:rotate-6'>
				{renderIcon(milestone.icon)}
			</div>
			<div className='w-full pt-20 md:pt-0 md:w-1/2 md:px-12'>
				<TimelineCard milestone={milestone} onImageClick={onImageClick} onEditClick={onEditClick} />
			</div>
			<div className='hidden md:block md:w-1/2'></div>
		</div>
	),
);

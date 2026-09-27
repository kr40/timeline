import { PencilSimple } from '@phosphor-icons/react';
import { memo, useState } from 'react';
import { ikResize } from '../../lib/imagekit';
import { Milestone, getImages } from '../../types';
import { formatDay } from '../../utils';
import { Card } from '../ui/Card';
import { Reveal } from '../ui/Reveal';
import { timelineIcon } from './timelineIcons';

type Props = {
	milestone: Milestone;
	index: number;
	isUnlocked: boolean;
	onOpen: (m: Milestone) => void;
	onEdit: (m: Milestone) => void;
};

export const MemoryCard = memo(({ milestone, index, isUnlocked, onOpen, onEdit }: Props) => {
	const images = getImages(milestone);
	const { Icon, bg } = timelineIcon(milestone.icon);
	const tilt = index % 2 === 0 ? -2.5 : 2.5;
	const [loaded, setLoaded] = useState(false);

	return (
		<Reveal className='relative mb-5'>
			<div aria-hidden className={`absolute -left-[38px] top-3 z-[1] grid h-8 w-8 place-items-center rounded-full border-2 border-ink ${bg}`}>
				<Icon size={17} weight='duotone' />
			</div>
			<Card interactive onClick={() => onOpen(milestone)} aria-label={`Open memory: ${milestone.title}`} className='flex gap-3 p-3.5'>
				<div className='min-w-0 flex-1'>
					<p className='eyebrow text-muted'>{formatDay(milestone.date)}</p>
					<h3 className='mt-1 font-display text-[17px] font-extrabold leading-snug'>{milestone.title}</h3>
					{milestone.description && (
						<p className='mt-1.5 line-clamp-3 text-[13.5px] font-semibold leading-relaxed text-ink/75'>{milestone.description}</p>
					)}
				</div>
				{images.length > 0 && (
					<div
						className='relative w-[104px] shrink-0 self-start rounded-[4px] border border-ink/10 bg-white p-1 pb-3 shadow-[0_6px_14px_-8px_rgba(43,35,64,0.45)] sm:w-[132px]'
						style={{ transform: `rotate(${tilt}deg)` }}
					>
						<div className='relative aspect-square overflow-hidden rounded-[2px] bg-dot/50'>
							{!loaded && <div className='absolute inset-0 animate-pulse bg-dot/70' />}
							<img
								src={ikResize(images[0], 300)}
								alt=''
								loading='lazy'
								decoding='async'
								draggable={false}
								onLoad={() => setLoaded(true)}
								onError={e => { if (e.currentTarget.src !== images[0]) e.currentTarget.src = images[0]; }}
								className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
							/>
						</div>
						{images.length > 1 && (
							<span className='absolute -right-2 -top-2 rounded-full border-2 border-ink bg-butter px-1.5 text-[11px] font-extrabold tabular-nums'>
								+{images.length - 1}
							</span>
						)}
					</div>
				)}
			</Card>
			{isUnlocked && (
				<button
					type='button'
					aria-label={`Edit ${milestone.title}`}
					onClick={() => onEdit(milestone)}
					className='press absolute -bottom-2 right-3 z-[2] grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
				>
					<PencilSimple size={14} weight='bold' />
				</button>
			)}
		</Reveal>
	);
});
MemoryCard.displayName = 'MemoryCard';

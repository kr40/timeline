import { CaretRight } from '@phosphor-icons/react';
import { Milestone, getImages } from '../../types';
import { formatDay, parseDay } from '../../utils';
import { Card } from '../ui/Card';
import { timelineIcon } from '../timeline/timelineIcons';

const DAY_MS = 86_400_000;

const whenLabel = (date: string, days: number) => {
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days > 1 && days < 30) return `${days} days ago`;
	return formatDay(date);
};

/** Compact "what's new" card for returning visitors. */
export const LatestMemoryCard = ({ memory, onOpen }: { memory: Milestone; onOpen: () => void }) => {
	const images = getImages(memory);
	const { Icon, bg } = timelineIcon(memory.icon);
	const age = Math.floor((Date.now() - parseDay(memory.date).getTime()) / DAY_MS);
	const isNew = age >= 0 && age <= 14;

	return (
		<Card interactive onClick={onOpen} aria-label={`Latest memory: ${memory.title}. Open`} className='flex items-center gap-3 p-3'>
			{images.length > 0 ? (
				<div className='w-16 shrink-0 -rotate-3 rounded-[3px] border border-ink/10 bg-white p-1 pb-2.5 shadow-[0_5px_12px_-7px_rgba(43,35,64,0.5)]'>
					<img
						src={images[0]}
						alt=''
						loading='lazy'
						decoding='async'
						draggable={false}
						className='aspect-square w-full rounded-[2px] object-cover'
					/>
				</div>
			) : (
				<div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-ink ${bg}`}>
					<Icon size={26} weight='duotone' />
				</div>
			)}
			<div className='min-w-0 flex-1'>
				<p className='eyebrow flex items-center gap-1.5 text-muted'>
					Latest memory
					{isNew && <span className='rounded-full border-2 border-ink bg-butter px-1.5 py-px text-[10px] tracking-normal text-ink'>New</span>}
				</p>
				<p className='mt-0.5 truncate font-display text-base font-extrabold'>{memory.title}</p>
				<p className='text-xs font-bold text-muted'>{whenLabel(memory.date, age)}</p>
			</div>
			<CaretRight size={18} weight='bold' className='shrink-0' />
		</Card>
	);
};

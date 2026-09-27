import { PencilSimple } from '@phosphor-icons/react';
import { Milestone, getImages } from '../../types';
import { formatDay } from '../../utils';
import { Button } from '../ui/Button';
import { PhotoCarousel } from './PhotoCarousel';
import { timelineIcon } from './timelineIcons';

type Props = {
	milestone: Milestone;
	isUnlocked: boolean;
	onImageClick: (images: string[], index: number) => void;
	onEdit: () => void;
};

/** Full memory: every photo, the whole story. Shown inside a Sheet. */
export const MemoryView = ({ milestone, isUnlocked, onImageClick, onEdit }: Props) => {
	const images = getImages(milestone);
	const { Icon, bg } = timelineIcon(milestone.icon);
	return (
		<div className='space-y-4 pb-2'>
			<div className='flex items-center gap-2'>
				<span className={`grid h-8 w-8 place-items-center rounded-full border-2 border-ink ${bg}`}>
					<Icon size={17} weight='duotone' />
				</span>
				<span className='eyebrow text-muted'>{formatDay(milestone.date, 'long')}</span>
			</div>
			{images.length > 0 && <PhotoCarousel images={images} title={milestone.title} onOpen={i => onImageClick(images, i)} />}
			{milestone.description && (
				<p className='whitespace-pre-line text-[15px] font-semibold leading-relaxed text-ink/85'>{milestone.description}</p>
			)}
			{isUnlocked && (
				<Button tone='white' onClick={onEdit}>
					<PencilSimple size={16} weight='bold' />
					Edit memory
				</Button>
			)}
		</div>
	);
};

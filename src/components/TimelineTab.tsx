import { Milestone } from '../types';

type Props = {
	milestones: Milestone[]; isLoading: boolean; error: string | null;
	hasMore: boolean; isUnlocked: boolean;
	onLoadMore: () => void;
	onImageClick: (images: string[], idx: number, title: string) => void;
	onEditClick: (m: Milestone) => void;
	onAddClick: () => void;
};

export const TimelineTab = (_props: Props) => (
	<div className='py-8 text-center text-slate-400 font-bold'>Timeline coming soon</div>
);

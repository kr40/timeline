import { Plus } from 'lucide-react';
import { Milestone } from '../types';
import { TimelineItem } from './TimelineItem';

type Props = {
	milestones:   Milestone[];
	isLoading:    boolean;
	error:        string | null;
	hasMore:      boolean;
	isUnlocked:   boolean;
	onLoadMore:   () => void;
	onImageClick: (images: string[], idx: number, title: string) => void;
	onEditClick:  (m: Milestone) => void;
	onAddClick:   () => void;
};

export const TimelineTab = ({
	milestones, isLoading, error, hasMore, isUnlocked,
	onLoadMore, onImageClick, onEditClick, onAddClick,
}: Props) => (
	<div className='relative pb-4'>
		<div className='absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF8C69]/40 via-[#6CC9C9]/40 to-[#B39DDB]/40' />

		{isLoading && (
			<div className='flex justify-center py-16'>
				<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
			</div>
		)}
		{error && (
			<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center mt-4'>
				{error}
			</div>
		)}
		{!isLoading && !error && milestones.length === 0 && (
			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center mt-4'>
				<div className='text-4xl mb-3'>📖</div>
				<p className='font-poppins font-bold text-[#1A1A2E]'>No memories yet</p>
				{isUnlocked && <p className='text-xs text-[#6B7280] font-semibold mt-1'>Tap + to add the first memory!</p>}
			</div>
		)}

		{milestones.map((milestone, index) => (
			<TimelineItem
				key={milestone.id}
				milestone={milestone}
				index={index}
				onImageClick={(images, idx) => onImageClick(images, idx, milestone.title)}
				onEditClick={onEditClick}
				isUnlocked={isUnlocked}
			/>
		))}

		{hasMore && !isLoading && (
			<div className='flex justify-center mt-4'>
				<button onClick={onLoadMore}
					className='px-6 py-2.5 font-bold text-[#FF8C69] bg-orange-50 border-2 border-[#FF8C69]/20 rounded-full hover:bg-orange-100 transition-colors text-sm'>
					Load more memories
				</button>
			</div>
		)}

		{isUnlocked && (
			<button onClick={onAddClick}
				className='fixed z-40 bottom-20 right-4 w-14 h-14 bg-[#FF8C69] text-white rounded-full shadow-lg shadow-[#FF8C69]/40 hover:bg-[#e87a57] active:scale-95 transition-all flex items-center justify-center'>
				<Plus className='w-7 h-7' strokeWidth={2.5} />
				<span className='sr-only'>Add Memory</span>
			</button>
		)}
	</div>
);

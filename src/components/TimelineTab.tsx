import { CalendarBlank, Plus } from '@phosphor-icons/react';
import { useCallback, useMemo, useState } from 'react';
import { Milestone } from '../types';
import { parseDay } from '../utils';
import { MemoryCard } from './timeline/MemoryCard';
import { MemoryView } from './timeline/MemoryView';
import { Button } from './ui/Button';
import { Emoji } from './ui/Emoji';
import { EmptyState } from './ui/EmptyState';
import { ErrorNote } from './ui/ErrorNote';
import { Fab } from './ui/Fab';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';

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
}: Props) => {
	const [viewing, setViewing] = useState<Milestone | null>(null);
	const [viewOpen, setViewOpen] = useState(false);
	const closeView = useCallback(() => setViewOpen(false), []);
	const openView = useCallback((m: Milestone) => { setViewing(m); setViewOpen(true); }, []);

	const groups = useMemo(() => {
		const out: { key: string; label: string; items: { milestone: Milestone; index: number }[] }[] = [];
		milestones.forEach((milestone, index) => {
			const d = parseDay(milestone.date);
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			const last = out[out.length - 1];
			if (last && last.key === key) last.items.push({ milestone, index });
			else out.push({ key, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), items: [{ milestone, index }] });
		});
		return out;
	}, [milestones]);

	return (
		<div className='pb-4'>
			<div className='mb-2 px-1'>
				<h2 className='flex items-center gap-2 font-display text-display-lg font-extrabold'>
					Our story <Emoji name='open-book' size={30} eager />
				</h2>
				{milestones.length > 0 && (
					<p className='text-sm font-semibold text-muted'>
						{milestones.length === 1 ? '1 memory' : `${milestones.length} memories`} so far
					</p>
				)}
			</div>

			{isLoading && milestones.length === 0 && <Spinner label='Loading memories' />}
			{error && <ErrorNote>{error}</ErrorNote>}
			{!isLoading && !error && milestones.length === 0 && (
				<EmptyState
					emoji='open-book'
					title='No memories yet'
					body={isUnlocked ? 'Tap “Memory” to add the first one.' : 'Check back soon for the first chapter.'}
				/>
			)}

			{groups.map(group => (
				<section key={group.key} aria-label={group.label}>
					<div className='sticky top-[62px] z-20 py-2'>
						<span className='inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3 py-1 text-xs font-extrabold shadow-sticker-sm'>
							<CalendarBlank size={14} weight='bold' />
							{group.label}
						</span>
					</div>
					<div className='relative pl-[46px]'>
						<div aria-hidden className='absolute bottom-3 left-[16px] top-1 border-l-[2.5px] border-dashed border-ink/25' />
						{group.items.map(({ milestone, index }) => (
							<MemoryCard
								key={milestone.id}
								milestone={milestone}
								index={index}
								isUnlocked={isUnlocked}
								onOpen={openView}
								onEdit={onEditClick}
							/>
						))}
					</div>
				</section>
			))}

			{hasMore && !isLoading && (
				<div className='mt-2 flex justify-center'>
					<Button tone='white' onClick={onLoadMore}>Load more memories</Button>
				</div>
			)}

			{isUnlocked && (
				<Fab label='Add a memory' onClick={onAddClick}>
					<Plus size={18} weight='bold' />
					Memory
				</Fab>
			)}

			<Sheet open={viewOpen} onClose={closeView} title={viewing?.title ?? ''}>
				{viewing && (
					<MemoryView
						milestone={viewing}
						isUnlocked={isUnlocked}
						onImageClick={(images, idx) => onImageClick(images, idx, viewing.title)}
						onEdit={() => { setViewOpen(false); onEditClick(viewing); }}
					/>
				)}
			</Sheet>
		</div>
	);
};

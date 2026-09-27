import { Plus } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmojiName } from '../emoji';
import { celebrate } from '../lib/celebrate';
import { supabase } from '../supabaseClient';
import { Wish } from '../types';
import { errorMessage } from '../utils';
import { Emoji } from './ui/Emoji';
import { EmptyState } from './ui/EmptyState';
import { ErrorNote } from './ui/ErrorNote';
import { Fab } from './ui/Fab';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';
import { BlessingNote } from './wishes/BlessingNote';
import { ComposeBlessing, type BlessingDraft } from './wishes/ComposeBlessing';

type Filter = 'all' | 'blessing' | 'advice';

const FILTERS: { id: Filter; label: string; emoji?: EmojiName }[] = [
	{ id: 'all',      label: 'All' },
	{ id: 'blessing', label: 'Blessings', emoji: 'folded-hands' },
	{ id: 'advice',   label: 'Advice',    emoji: 'light-bulb' },
];

export const WishesTab = () => {
	const [wishes, setWishes] = useState<Wish[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [filter, setFilter] = useState<Filter>('all');
	const [composing, setComposing] = useState(false);
	const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
	// Keeps a note's React key stable when its optimistic id is swapped for the saved id.
	const stableKeys = useRef(new Map<string, string>());

	useEffect(() => {
		(async () => {
			try {
				const { data, error } = await supabase.from('wishes').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setWishes(data ?? []);
			} catch (err: unknown) {
				setLoadError(errorMessage(err, "Couldn't load the blessings. Try again in a moment."));
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const closeCompose = useCallback(() => setComposing(false), []);

	const handleSend = async ({ name, message, category }: BlessingDraft) => {
		const optimistic: Wish = {
			id: crypto.randomUUID(),
			author_name: name,
			message,
			category,
			created_at: new Date().toISOString(),
		};
		setWishes(prev => [optimistic, ...prev]);
		setPendingIds(prev => new Set(prev).add(optimistic.id));
		try {
			const { data, error } = await supabase
				.from('wishes')
				.insert({ author_name: name, message, category })
				.select()
				.single();
			if (error) throw error;
			stableKeys.current.set(data.id, optimistic.id);
			setWishes(prev => prev.map(w => (w.id === optimistic.id ? data : w)));
			setFilter('all');
			setComposing(false);
			celebrate();
		} catch (err: unknown) {
			setWishes(prev => prev.filter(w => w.id !== optimistic.id));
			throw err;
		} finally {
			setPendingIds(prev => {
				const next = new Set(prev);
				next.delete(optimistic.id);
				return next;
			});
		}
	};

	const visible = wishes.filter(w => filter === 'all' || w.category === filter);

	return (
		<div className='pb-4'>
			<div className='mb-3 flex items-center gap-3 px-1'>
				<Emoji name='folded-hands' size={44} eager />
				<div>
					<h2 className='font-display text-display-lg font-extrabold'>Blessings &amp; advice</h2>
					<p className='text-sm font-semibold text-muted'>Ashirwad and wisdom for the little one</p>
				</div>
			</div>

			<div className='sticky top-[62px] z-20 -mx-4 mb-3 flex gap-2 px-4 py-2'>
				{FILTERS.map(f => {
					const active = filter === f.id;
					return (
						<button
							key={f.id}
							type='button'
							onClick={() => setFilter(f.id)}
							aria-pressed={active}
							className='relative inline-flex items-center rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-[13px] font-extrabold shadow-sticker-xs'
						>
							{active && (
								<motion.span
									layoutId='filter-pill'
									className='absolute inset-0 rounded-full bg-ink'
									transition={{ type: 'spring', stiffness: 520, damping: 34 }}
								/>
							)}
							<span className={`relative flex items-center gap-1.5 ${active ? 'text-white' : ''}`}>
								{f.emoji && <Emoji name={f.emoji} size={16} />}
								{f.label}
							</span>
						</button>
					);
				})}
			</div>

			{isLoading && <Spinner label='Loading blessings' />}
			{loadError && <ErrorNote>{loadError}</ErrorNote>}
			{!isLoading && !loadError && visible.length === 0 && (
				<EmptyState
					emoji='folded-hands'
					title={filter === 'all' ? 'No blessings yet' : 'Nothing here yet'}
					body='Be the first to bless the little one.'
				/>
			)}

			<div className='columns-2 gap-3.5 sm:gap-4'>
				{visible.map(w => (
					<BlessingNote key={stableKeys.current.get(w.id) ?? w.id} wish={w} pending={pendingIds.has(w.id)} />
				))}
			</div>

			<Fab label='Write a blessing' onClick={() => setComposing(true)}>
				<Plus size={18} weight='bold' />
				Bless
			</Fab>

			<Sheet
				open={composing}
				onClose={closeCompose}
				title={<span className='flex items-center gap-2'>Send a blessing <Emoji name='love-letter' size={26} /></span>}
			>
				<ComposeBlessing onSend={handleSend} />
			</Sheet>
		</div>
	);
};

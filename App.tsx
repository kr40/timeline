import { Key, LockSimple } from '@phosphor-icons/react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate, PasswordForm } from './src/components/AuthGate';
import { BabyBookTab } from './src/components/BabyBookTab';
import { Doodles } from './src/components/Doodles';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { HomeTab } from './src/components/HomeTab';
import { MemoryForm } from './src/components/timeline/MemoryForm';
import { TABS, TabBar, type TabId } from './src/components/TabBar';
import { TimelineTab } from './src/components/TimelineTab';
import { WishesTab } from './src/components/WishesTab';
import { Button } from './src/components/ui/Button';
import { Emoji } from './src/components/ui/Emoji';
import { Sheet } from './src/components/ui/Sheet';
import { celebrate } from './src/lib/celebrate';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';
import { PAGE_SIZE } from './src/constants';
import { APP_TITLE, getDaysUntilEDD } from './src/config';

const AUTH_STORAGE_KEY = 'timeline_auth';
type AuthState = 'unlocked' | 'view-only' | null;

const pageVariants = {
	enter:  (dir: number) => ({ opacity: 0, x: dir * 28 }),
	center: { opacity: 1, x: 0 },
	exit:   (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

const App = () => {
	const [milestones, setMilestones]   = useState<Milestone[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [error, setError]             = useState<string | null>(null);
	const [page, setPage]               = useState(0);
	const [hasMore, setHasMore]         = useState(true);
	const [activeTab, setActiveTab]     = useState<TabId>('home');
	const [direction, setDirection]     = useState(1);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showUnlock, setShowUnlock]   = useState(false);
	const [expandedGallery, setExpandedGallery] = useState<{ images: string[]; index: number; title: string } | null>(null);

	const [editingMilestoneState, setEditingMilestoneState] = useState<Milestone | null>(null);
	const editingMilestoneRef = useRef<Milestone | null>(null);
	const setEditingMilestone = (m: Milestone | null) => {
		editingMilestoneRef.current = m;
		setEditingMilestoneState(m);
	};

	const [authState, setAuthState] = useState<AuthState>(() => {
		try {
			const stored = localStorage.getItem(AUTH_STORAGE_KEY);
			if (stored === 'unlocked' || stored === 'view-only') return stored;
		} catch { /* localStorage unavailable */ }
		return null;
	});
	const isUnlocked = authState === 'unlocked';

	useEffect(() => {
		// Printed shower QR codes point at /#shower. That tab is gone, so tidy the URL and stay on Home.
		if (window.location.hash === '#shower') {
			try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
		}
	}, []);

	const changeTab = (next: TabId) => {
		if (next === activeTab) return;
		const order = TABS.map(t => t.id);
		setDirection(order.indexOf(next) > order.indexOf(activeTab) ? 1 : -1);
		setActiveTab(next);
		window.scrollTo({ top: 0 });
	};

	const handleAuth = (state: 'unlocked' | 'view-only') => {
		setAuthState(state);
		if (state === 'unlocked') celebrate();
	};
	const handleLock = () => {
		try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
		setAuthState(null);
	};
	const closeUnlock = useCallback(() => setShowUnlock(false), []);
	const closeMemoryForm = useCallback(() => setIsModalOpen(false), []);

	const fetchMilestones = useCallback(async (pageNum: number, replace: boolean) => {
		try {
			if (replace) setIsLoading(true);
			setError(null);
			const from = pageNum * PAGE_SIZE;
			const { data, error: supaError } = await supabase
				.from('milestones')
				.select('*')
				.order('date', { ascending: true })
				.order('id',   { ascending: true })
				.range(from, from + PAGE_SIZE - 1);
			if (supaError) throw supaError;
			if (data) {
				setMilestones(prev => replace ? data : [...prev, ...data]);
				setHasMore(data.length === PAGE_SIZE);
			}
		} catch (err: unknown) {
			console.error(err);
			setError("Couldn't load the memories. Check your connection and try again.");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (authState === null) return;
		fetchMilestones(0, true);
	}, [fetchMilestones, authState]);

	const handleLoadMore = useCallback(() => {
		const next = page + 1;
		setPage(next);
		fetchMilestones(next, false);
	}, [page, fetchMilestones]);

	const handleSaveMilestone = useCallback(async (eventData: NewEvent) => {
		const editing = editingMilestoneRef.current;
		const eventToSave: NewEvent = { ...eventData, image: eventData.images[0] ?? null };
		if (editing) {
			const { error } = await supabase.from('milestones').update(eventToSave).eq('id', editing.id);
			if (error) throw error;
			if (!hasMore) {
				setMilestones(prev =>
					prev
						.map(m => (m.id === editing.id ? { ...eventToSave, id: editing.id } : m))
						.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id),
				);
			} else {
				setPage(0); fetchMilestones(0, true);
			}
		} else {
			const { data, error } = await supabase.from('milestones').insert([eventToSave]).select();
			if (error) throw error;
			celebrate();
			if (data) {
				if (!hasMore) {
					setMilestones(prev =>
						[...prev, data[0]].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id,
						),
					);
				} else {
					setPage(0); fetchMilestones(0, true);
				}
			}
		}
		setIsModalOpen(false);
	}, [hasMore, fetchMilestones]);

	const handleDeleteMilestone = useCallback(async (id: number) => {
		const { error } = await supabase.from('milestones').delete().eq('id', id);
		if (error) throw error;
		setMilestones(prev => prev.filter(m => m.id !== id));
		setIsModalOpen(false);
	}, []);

	const daysLeft = getDaysUntilEDD();

	if (authState === null) {
		return (
			<MotionConfig reducedMotion='user'>
				<AuthGate onAuth={handleAuth} />
			</MotionConfig>
		);
	}

	return (
		<MotionConfig reducedMotion='user'>
			<div className='min-h-screen'>
				<Doodles />

				<header className='sticky top-0 z-30 border-b-2 border-ink/10 bg-paper/85 backdrop-blur-md'>
					<div className='mx-auto flex h-[60px] max-w-[640px] items-center justify-between gap-3 px-4'>
						<button
							type='button'
							onClick={() => changeTab('home')}
							className='flex items-center gap-1.5 font-display text-[22px] font-extrabold tracking-tight'
						>
							{APP_TITLE}
							<motion.span
								className='inline-flex'
								animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.15, 1] }}
								transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3.5 }}
							>
								<Emoji name='sparkles' size={24} eager />
							</motion.span>
						</button>
						<div className='flex items-center gap-2'>
							{daysLeft > 0 && (
								<span className='hidden items-center rounded-full border-2 border-ink bg-peach px-3 py-1 text-xs font-extrabold tabular-nums sm:inline-flex'>
									{daysLeft} days to go
								</span>
							)}
							{isUnlocked ? (
								<Button size='sm' tone='white' onClick={handleLock}>
									<LockSimple size={14} weight='bold' />
									Lock
								</Button>
							) : (
								<Button size='sm' tone='white' onClick={() => setShowUnlock(true)}>
									<Key size={14} weight='bold' />
									Unlock
								</Button>
							)}
						</div>
					</div>
				</header>

				<main className='relative z-10 mx-auto max-w-[640px] px-4 pb-40 pt-4'>
					<AnimatePresence mode='wait' initial={false} custom={direction}>
						<motion.div
							key={activeTab}
							custom={direction}
							variants={pageVariants}
							initial='enter'
							animate='center'
							exit='exit'
							transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
						>
							{activeTab === 'home' && <HomeTab isUnlocked={isUnlocked} />}
							{activeTab === 'timeline' && (
								<TimelineTab
									milestones={milestones}
									isLoading={isLoading}
									error={error}
									hasMore={hasMore}
									isUnlocked={isUnlocked}
									onLoadMore={handleLoadMore}
									onImageClick={(images, idx, title) => setExpandedGallery({ images, index: idx, title })}
									onEditClick={m => { setEditingMilestone(m); setIsModalOpen(true); }}
									onAddClick={() => { setEditingMilestone(null); setIsModalOpen(true); }}
								/>
							)}
							{activeTab === 'wishes' && <WishesTab />}
							{activeTab === 'babybook' && <BabyBookTab isUnlocked={isUnlocked} />}
						</motion.div>
					</AnimatePresence>
				</main>

				<TabBar activeTab={activeTab} onTabChange={changeTab} />

				<Sheet open={isModalOpen} onClose={closeMemoryForm} title={editingMilestoneState ? 'Edit memory' : 'New memory'}>
					<MemoryForm
						editingMilestone={editingMilestoneState}
						onSave={handleSaveMilestone}
						onDelete={handleDeleteMilestone}
					/>
				</Sheet>
				{expandedGallery && (
					<ExpandedImageModal
						images={expandedGallery.images}
						initialIndex={expandedGallery.index}
						title={expandedGallery.title}
						onClose={() => setExpandedGallery(null)}
					/>
				)}
				<Sheet open={showUnlock} onClose={closeUnlock} title='Unlock editing'>
					<PasswordForm
						showViewOnly={false}
						onAuth={state => { handleAuth(state); setShowUnlock(false); }}
					/>
				</Sheet>
			</div>
		</MotionConfig>
	);
};

export default App;

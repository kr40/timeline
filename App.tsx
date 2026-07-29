import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate } from './src/components/AuthGate';
import { BabyBookTab } from './src/components/BabyBookTab';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { HomeTab } from './src/components/HomeTab';
import { MemoryModal } from './src/components/MemoryModal';
import { QATab } from './src/components/QATab';
import { ShowerTab } from './src/components/ShowerTab';
import { TabBar, TabId } from './src/components/TabBar';
import { TimelineTab } from './src/components/TimelineTab';
import { WishesTab } from './src/components/WishesTab';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';
import { PAGE_SIZE } from './src/constants';
import { APP_TITLE, getDaysUntilEDD, isPreShowerMode } from './src/config';

const AUTH_STORAGE_KEY = 'timeline_auth';
type AuthState = 'unlocked' | 'view-only' | null;

const App = () => {
	const [milestones, setMilestones]   = useState<Milestone[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [error, setError]             = useState<string | null>(null);
	const [page, setPage]               = useState(0);
	const [hasMore, setHasMore]         = useState(true);
	const [activeTab, setActiveTab]     = useState<TabId>(() => {
		if (window.location.hash === '#shower') {
			try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
			return 'shower';
		}
		return 'home';
	});
	const [isModalOpen, setIsModalOpen] = useState(false);
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

	const [showUnlockModal, setShowUnlockModal] = useState(false);
	const isUnlocked = authState === 'unlocked';

	const preShower = isPreShowerMode() && !isUnlocked;
	const visibleTabs: TabId[] = preShower
		? ['home', 'wishes', 'qa', 'shower']
		: ['home', 'timeline', 'wishes', 'qa', 'shower', 'babybook'];

	const titleTaps = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
	const handleTitleTap = () => {
		if (!preShower) return;
		const t = titleTaps.current;
		t.count += 1;
		if (t.timer) clearTimeout(t.timer);
		if (t.count >= 5) {
			t.count = 0;
			setShowUnlockModal(true);
		} else {
			t.timer = setTimeout(() => { t.count = 0; }, 3000);
		}
	};

	const handleAuth  = (state: 'unlocked' | 'view-only') => setAuthState(state);
	const handleLock  = () => {
		try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
		setAuthState(null);
	};

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
		} catch (err: any) {
			setError(err.message || 'Failed to connect to the database.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (authState === null) return;
		fetchMilestones(0, true);
	}, [fetchMilestones, authState]);

	useEffect(() => {
		if (!visibleTabs.includes(activeTab)) setActiveTab('home');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preShower, activeTab]);

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
		setEditingMilestone(null);
	}, [hasMore, fetchMilestones]);

	const handleDeleteMilestone = useCallback(async (id: number) => {
		const { error } = await supabase.from('milestones').delete().eq('id', id);
		if (error) throw error;
		setMilestones(prev => prev.filter(m => m.id !== id));
		setIsModalOpen(false);
		setEditingMilestone(null);
	}, []);

	const daysLeft = getDaysUntilEDD();

	if (authState === null && !isPreShowerMode()) return <AuthGate onAuth={handleAuth} />;

	return (
		<div className='min-h-screen bg-[#FAFAFA] font-nunito text-[#1A1A2E] pb-24'>
			<header className='sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100'>
				<div className='max-w-[600px] mx-auto flex items-center justify-between px-4 py-3'>
					<h1 onClick={handleTitleTap} className='font-poppins font-extrabold text-lg select-none'>{APP_TITLE}</h1>
					<div className='flex items-center gap-2'>
						{daysLeft > 0 && (
							<span className='hidden sm:inline-flex items-center gap-1 bg-[#FF8C69]/10 text-[#FF8C69] text-xs font-bold px-3 py-1 rounded-full'>
								{daysLeft} days to go
							</span>
						)}
						{!preShower && (
							isUnlocked ? (
								<button onClick={handleLock}
									className='text-xs font-bold text-[#FF8C69] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors'>
									🔒 Lock
								</button>
							) : (
								<button onClick={() => setShowUnlockModal(true)}
									className='text-xs font-bold text-[#FF8C69] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors'>
									🔑 Unlock
								</button>
							)
						)}
					</div>
				</div>
			</header>

			<main className='max-w-[600px] mx-auto px-4 pt-4'>
				{activeTab === 'home'     && <HomeTab isUnlocked={isUnlocked} />}
				{activeTab === 'timeline' && !preShower && (
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
				{activeTab === 'wishes'   && <WishesTab />}
				{activeTab === 'qa'       && <QATab isUnlocked={isUnlocked} />}
				{activeTab === 'shower' && (
					<ShowerTab onImageClick={url => setExpandedGallery({ images: [url], index: 0, title: 'Baby Shower' })} />
				)}
				{activeTab === 'babybook' && !preShower && <BabyBookTab isUnlocked={isUnlocked} />}
			</main>

			<TabBar activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs} />

			{isModalOpen && (
				<MemoryModal
					editingMilestone={editingMilestoneState}
					onClose={() => setIsModalOpen(false)}
					onSave={handleSaveMilestone}
					onDelete={handleDeleteMilestone}
				/>
			)}
			{expandedGallery && (
				<ExpandedImageModal
					images={expandedGallery.images}
					initialIndex={expandedGallery.index}
					title={expandedGallery.title}
					onClose={() => setExpandedGallery(null)}
				/>
			)}
			{showUnlockModal && (
				<AuthGate
					isModal={true}
					onAuth={state => { handleAuth(state); setShowUnlockModal(false); }}
					onClose={() => setShowUnlockModal(false)}
				/>
			)}
		</div>
	);
};

export default App;

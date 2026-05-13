import { Baby, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate } from './src/components/AuthGate';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { FloatingBackground } from './src/components/FloatingBackground';
import { MemoryModal } from './src/components/MemoryModal';
import { TimelineItem } from './src/components/TimelineItem';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';
import { PAGE_SIZE } from './src/constants';

type AuthState = 'unlocked' | 'view-only' | null;

const App = () => {
	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

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
			const stored = localStorage.getItem('timeline_auth');
			if (stored === 'unlocked' || stored === 'view-only') return stored;
		} catch { /* localStorage unavailable */ }
		return null;
	});

	const [showUnlockModal, setShowUnlockModal] = useState(false);

	const isUnlocked = authState === 'unlocked';

	const handleAuth = (state: 'unlocked' | 'view-only') => {
		setAuthState(state);
	};

	const handleLock = () => {
		try { localStorage.removeItem('timeline_auth'); } catch { /* ignore */ }
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
				.order('id', { ascending: true })
				.range(from, from + PAGE_SIZE - 1);
			if (supaError) throw supaError;
			if (data) {
				setMilestones(prev => replace ? data : [...prev, ...data]);
				setHasMore(data.length === PAGE_SIZE);
			}
		} catch (err: any) {
			console.error('Error fetching milestones:', err);
			setError(err.message || 'Failed to connect to the database.');
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

	const handleSaveMilestone = useCallback(
		async (eventData: NewEvent) => {
			const editing = editingMilestoneRef.current;
			const eventToSave: NewEvent = {
				...eventData,
				image: eventData.images[0] ?? null,
			};

			if (editing) {
				const { error } = await supabase.from('milestones').update(eventToSave).eq('id', editing.id);
				if (error) throw error;
				// If the entire dataset is loaded, update locally to avoid a round-trip.
				if (!hasMore) {
					setMilestones(prev =>
						prev
							.map(m => (m.id === editing.id ? { ...eventToSave, id: editing.id } : m))
							.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id),
					);
				} else {
					setPage(0);
					fetchMilestones(0, true);
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
						setPage(0);
						fetchMilestones(0, true);
					}
				}
			}
			setIsModalOpen(false);
			setEditingMilestone(null);
		},
		[hasMore, fetchMilestones],
	);

	const handleDeleteMilestone = useCallback(async (id: number) => {
		const { error } = await supabase.from('milestones').delete().eq('id', id);
		if (error) {
			console.error('Error deleting milestone:', error);
			throw error;
		}
		setMilestones(prev => prev.filter(m => m.id !== id));
		setIsModalOpen(false);
		setEditingMilestone(null);
	}, []);

	const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
	const handleCloseExpandedGallery = useCallback(() => setExpandedGallery(null), []);

	if (authState === null) {
		return <AuthGate onAuth={handleAuth} />;
	}

	return (
		<div className='relative min-h-screen overflow-x-hidden selection:bg-pink-200 text-slate-800 font-nunito bg-cream'>
			<FloatingBackground />

			<header className='bg-white/80 backdrop-blur-md rounded-b-[3rem] shadow-sm p-8 mb-12 relative z-10 border-b border-pink-50'>
				<div className='relative z-10 max-w-5xl mx-auto text-center'>
					<div className='inline-flex items-center justify-center p-4 mb-4 transition-transform duration-300 bg-pink-100 rounded-full hover:scale-110'>
						<Baby className='w-12 h-12 text-pink-500' />
					</div>
					<h1 className='mb-2 text-4xl font-extrabold tracking-tight md:text-5xl text-slate-800'>Our Baby Journey</h1>
					<p className='text-lg font-medium text-slate-500'>From a tiny seed to our little miracle 🌱</p>
				</div>
				<div className='absolute top-4 right-4 md:top-6 md:right-8 z-20'>
					{isUnlocked ? (
						<button
							onClick={handleLock}
							className='flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-pink-500 bg-pink-50 border-2 border-pink-200 rounded-full hover:bg-pink-100 transition-colors'>
							🔒 Lock
						</button>
					) : (
						<button
							onClick={() => setShowUnlockModal(true)}
							className='flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-pink-500 bg-pink-50 border-2 border-pink-200 rounded-full hover:bg-pink-100 transition-colors'>
							🔑 Unlock
						</button>
					)}
				</div>
			</header>

			<main className='relative z-10 max-w-5xl px-4 pb-24 mx-auto'>
				{isLoading ? (
					<div className='flex items-center justify-center py-20'>
						<div className='w-12 h-12 border-b-2 border-pink-500 rounded-full animate-spin'></div>
					</div>
				) : error ? (
					<div className='max-w-lg p-6 mx-auto font-bold text-center text-red-500 border border-red-100 bg-red-50 rounded-2xl'>
						{error}
					</div>
				) : milestones.length === 0 ? (
					<div className='py-20 text-xl font-bold text-center text-slate-400'>
						No memories yet. Click the + button below to add one!
					</div>
				) : (
					<div className='relative'>
						<div className='absolute left-1/2 top-0 bottom-0 w-1.5 bg-pink-200 border-x-2 border-dashed border-pink-100 transform -translate-x-1/2 rounded-full'></div>
						{milestones.map((milestone, index) => (
							<TimelineItem
								key={milestone.id}
								milestone={milestone}
								index={index}
								onImageClick={(images, idx) => setExpandedGallery({ images, index: idx, title: milestone.title })}
								onEditClick={m => {
									setEditingMilestone(m);
									setIsModalOpen(true);
								}}
								isUnlocked={isUnlocked}
							/>
						))}
						{hasMore && !isLoading && (
							<div className='flex justify-center mt-8'>
								<button
									onClick={handleLoadMore}
									className='px-8 py-3 font-bold text-pink-600 bg-pink-50 border-2 border-pink-200 rounded-full hover:bg-pink-100 transition-colors'>
									Load more memories
								</button>
							</div>
						)}
					</div>
				)}
			</main>

			{isUnlocked && (
				<button
					onClick={() => {
						setEditingMilestone(null);
						setIsModalOpen(true);
					}}
					className='fixed z-40 flex items-center justify-center p-4 text-yellow-900 transition-transform transform bg-yellow-400 rounded-full shadow-lg bottom-8 right-8 hover:bg-yellow-300 shadow-yellow-200 hover:scale-110 group'>
					<Plus className='w-8 h-8' strokeWidth={3} />
					<span className='overflow-hidden text-lg font-bold transition-all duration-300 ease-in-out max-w-0 whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 group-hover:mr-2'>
						Add Memory
					</span>
				</button>
			)}

			{isModalOpen && (
				<MemoryModal
					editingMilestone={editingMilestoneState}
					onClose={handleCloseModal}
					onSave={handleSaveMilestone}
					onDelete={handleDeleteMilestone}
				/>
			)}

			{expandedGallery && (
				<ExpandedImageModal
					images={expandedGallery.images}
					initialIndex={expandedGallery.index}
					title={expandedGallery.title}
					onClose={handleCloseExpandedGallery}
				/>
			)}

			{showUnlockModal && (
				<AuthGate
					isModal={true}
					onAuth={state => {
						handleAuth(state);
						setShowUnlockModal(false);
					}}
					onClose={() => setShowUnlockModal(false)}
				/>
			)}
		</div>
	);
};

export default App;

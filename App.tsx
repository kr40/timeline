import { Baby, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { FloatingBackground } from './src/components/FloatingBackground';
import { MemoryModal } from './src/components/MemoryModal';
import { TimelineItem } from './src/components/TimelineItem';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';

const App = () => {
	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [expandedImage, setExpandedImage] = useState<string | null>(null);
	const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

	useEffect(() => {
		const fetchMilestones = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const { data, error: supaError } = await supabase
					.from('milestones')
					.select('*')
					.order('date', { ascending: true });
				if (supaError) throw supaError;
				if (data) setMilestones(data);
			} catch (err: any) {
				console.error('Error fetching milestones:', err);
				setError(err.message || 'Failed to connect to the database.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchMilestones();
	}, []);

	const uploadToImageKit = async (file: File): Promise<string> => {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('fileName', file.name || 'uploaded_image.jpg');

		const authRes = await fetch('/.netlify/functions/auth');
		if (!authRes.ok) {
			const errorData = await authRes.json();
			throw new Error(errorData.error || 'Failed to fetch upload signature');
		}
		const authData = await authRes.json();

		// Ensure strictly utilizing the ENV variable for security, rather than a hardcoded default public key
		const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
		if (!publicKey) throw new Error('Missing ImageKit public key in environment configuration.');

		formData.append('publicKey', publicKey);
		formData.append('signature', authData.signature);
		formData.append('expire', authData.expire.toString());
		formData.append('token', authData.token);

		const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'Image upload failed');
		}

		const data = await response.json();
		return data.url;
	};

	const handleSaveMilestone = useCallback(
		async (eventData: NewEvent, file: File | null) => {
			try {
				let finalImage = eventData.image;
				// Deferred upload mechanism - only upload when saving
				if (file) {
					finalImage = await uploadToImageKit(file);
				}

				const eventToSave = { ...eventData, image: finalImage };

				if (editingMilestone) {
					const { error } = await supabase.from('milestones').update(eventToSave).eq('id', editingMilestone.id);
					if (error) throw error;
					setMilestones((prev) =>
						prev
							.map((m) => (m.id === editingMilestone.id ? { ...eventToSave, id: editingMilestone.id } : m))
							.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
					);
				} else {
					const { data, error } = await supabase.from('milestones').insert([eventToSave]).select();
					if (error) throw error;
					if (data) {
						setMilestones((prev) =>
							[...prev, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
						);
					}
				}
				setIsModalOpen(false);
				setEditingMilestone(null);
			} catch (err: any) {
				console.error('Save error:', err);
				alert('Failed to save memory: ' + (err.message || 'Unknown error'));
			}
		},
		[editingMilestone],
	);

	const handleDeleteMilestone = useCallback(async (id: number) => {
		const confirmed = window.confirm("Are you sure you want to delete this memory? It can't be undone.");
		if (!confirmed) return;

		const { error } = await supabase.from('milestones').delete().eq('id', id);
		if (!error) {
			setMilestones((prev) => prev.filter((m) => m.id !== id));
			setIsModalOpen(false);
			setEditingMilestone(null);
		} else {
			console.error('Error deleting milestone:', error);
			alert('Failed to delete memory. Please try again.');
		}
	}, []);

	return (
		<div
			className='relative min-h-screen overflow-x-hidden selection:bg-pink-200 text-slate-800'
			style={{ fontFamily: "'Nunito', sans-serif", backgroundColor: '#fcf8f7' }}>
			<FloatingBackground />

			<header className='bg-white/80 backdrop-blur-md rounded-b-[3rem] shadow-sm p-8 mb-12 relative z-10 border-b border-pink-50'>
				<div className='relative z-10 max-w-5xl mx-auto text-center'>
					<div className='inline-flex items-center justify-center p-4 mb-4 transition-transform duration-300 bg-pink-100 rounded-full hover:scale-110'>
						<Baby className='w-12 h-12 text-pink-500' />
					</div>
					<h1 className='mb-2 text-4xl font-extrabold tracking-tight md:text-5xl text-slate-800'>Our Baby Journey</h1>
					<p className='text-lg font-medium text-slate-500'>From a tiny seed to our little miracle 🌱</p>
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
								onImageClick={setExpandedImage}
								onEditClick={(m) => {
									setEditingMilestone(m);
									setIsModalOpen(true);
								}}
							/>
						))}
					</div>
				)}
			</main>

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

			{isModalOpen && (
				<MemoryModal
					editingMilestone={editingMilestone}
					onClose={() => setIsModalOpen(false)}
					onSave={handleSaveMilestone}
					onDelete={handleDeleteMilestone}
				/>
			)}

			{expandedImage && <ExpandedImageModal image={expandedImage} onClose={() => setExpandedImage(null)} />}
		</div>
	);
};

export default App;

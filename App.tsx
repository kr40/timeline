import {
	Baby,
	Calendar,
	Camera,
	Footprints,
	Gift,
	Heart,
	Image as ImageIcon,
	Moon,
	Music,
	Pencil,
	Plus,
	Smile,
	Sparkles,
	Star,
	X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from './src/supabaseClient';

type IconType = 'camera' | 'heart' | 'baby' | 'star' | 'smile' | 'gift' | 'moon' | 'music' | 'footprints';

type Milestone = {
	id: number;
	title: string;
	date: string;
	description: string;
	image: string | null;
	icon: IconType;
};

type NewEvent = Omit<Milestone, 'id'>;

const ICON_OPTIONS: IconType[] = ['camera', 'heart', 'baby', 'star', 'smile', 'gift', 'moon', 'music', 'footprints'];

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
	year: 'numeric',
	month: 'long',
	day: 'numeric',
});

const formatDate = (dateString: string) => DATE_FORMATTER.format(new Date(dateString));

const renderIcon = (iconType: IconType) => {
	switch (iconType) {
		case 'heart':
			return <Heart className='w-6 h-6 text-pink-500 fill-pink-100' />;
		case 'baby':
			return <Baby className='w-6 h-6 text-blue-500 fill-blue-100' />;
		case 'star':
			return <Star className='w-6 h-6 text-yellow-500 fill-yellow-100' />;
		case 'smile':
			return <Smile className='w-6 h-6 text-orange-500 fill-orange-100' />;
		case 'gift':
			return <Gift className='w-6 h-6 text-teal-500 fill-teal-100' />;
		case 'moon':
			return <Moon className='w-6 h-6 text-indigo-500 fill-indigo-100' />;
		case 'music':
			return <Music className='w-6 h-6 text-rose-500' />;
		case 'footprints':
			return <Footprints className='w-6 h-6 text-stone-500 fill-stone-100' />;
		default:
			return <Camera className='w-6 h-6 text-purple-500 fill-purple-100' />;
	}
};

const TimelineCard = memo(
	({
		milestone,
		onImageClick,
		onEditClick,
	}: {
		milestone: Milestone;
		onImageClick: (image: string) => void;
		onEditClick: (milestone: Milestone) => void;
	}) => (
		<div className='relative bg-white w-full rounded-3xl p-6 shadow-xl shadow-pink-100 border-4 border-pink-200 transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-200 hover:border-pink-300 group'>
			<button
				onClick={() => onEditClick(milestone)}
				className='absolute p-2 text-pink-400 transition-colors rounded-full shadow-sm opacity-0 top-4 right-4 bg-pink-50 hover:bg-pink-100 hover:text-pink-600 group-hover:opacity-100'>
				<Pencil className='w-5 h-5' />
			</button>
			<div className='inline-flex items-center px-5 py-2 mb-5 space-x-2 text-lg font-extrabold text-purple-800 transition-colors bg-purple-100 rounded-full shadow-sm group-hover:bg-purple-200'>
				<Calendar className='w-5 h-5' />
				<span>{formatDate(milestone.date)}</span>
			</div>

			<h3 className='pr-10 mb-4 text-3xl font-extrabold text-slate-800'>{milestone.title}</h3>

			{milestone.image && (
				<div
					className='mb-6 p-3 pb-6 md:p-4 md:pb-8 bg-white rounded-xl shadow-md border border-slate-200 transform transition-all duration-300 group-hover:scale-[1.03] group-hover:-rotate-2 group-hover:shadow-xl group-hover:border-pink-200 cursor-pointer'
					onClick={() => onImageClick(milestone.image!)}>
					<div className='w-full aspect-[3/4] overflow-hidden rounded-lg bg-slate-50 border border-slate-100'>
						<img src={milestone.image} alt={milestone.title} className='object-cover object-center w-full h-full' />
					</div>
				</div>
			)}

			<p className='text-xl leading-relaxed text-slate-600'>{milestone.description}</p>
		</div>
	),
);

const TimelineItem = memo(
	({
		milestone,
		index,
		onImageClick,
		onEditClick,
	}: {
		milestone: Milestone;
		index: number;
		onImageClick: (image: string) => void;
		onEditClick: (milestone: Milestone) => void;
	}) => (
		<div
			className={`relative mb-12 animate-fade-in-up md:flex md:items-center md:justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
			style={{ animationDelay: `${index * 0.15}s` }}>
			<div className='absolute z-10 flex items-center justify-center transition-all duration-300 transform -translate-x-1/2 bg-white border-4 border-pink-100 rounded-full shadow-md left-1/2 w-14 h-14 hover:scale-110 hover:rotate-6'>
				{renderIcon(milestone.icon)}
			</div>

			<div className='w-full pt-20 md:pt-0 md:w-1/2 md:px-12'>
				<TimelineCard milestone={milestone} onImageClick={onImageClick} onEditClick={onEditClick} />
			</div>

			<div className='hidden md:block md:w-1/2'></div>
		</div>
	),
);

const App = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [expandedImage, setExpandedImage] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<number | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const [milestones, setMilestones] = useState<Milestone[]>([]);

	const [newEvent, setNewEvent] = useState<NewEvent>({
		title: '',
		date: '',
		description: '',
		image: null,
		icon: 'camera',
	});
	const [isUploading, setIsUploading] = useState(false);

	// Fetch data from Supabase on component mount
	useEffect(() => {
		const fetchMilestones = async () => {
			const { data, error } = await supabase.from('milestones').select('*').order('date', { ascending: true });

			if (error) {
				console.error('Error fetching milestones:', error);
			} else if (data) {
				setMilestones(data);
			}
		};
		fetchMilestones();
	}, []);

	// Close modal on Escape key press
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setIsModalOpen(false);
				setEditingId(null);
				setExpandedImage(null);
			}
		};
		if (isModalOpen || expandedImage) {
			window.addEventListener('keydown', handleKeyDown);
		}
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isModalOpen, expandedImage]);

	const handleEditClick = useCallback((milestone: Milestone) => {
		setNewEvent({
			title: milestone.title,
			date: milestone.date,
			description: milestone.description,
			image: milestone.image,
			icon: milestone.icon,
		});
		setEditingId(milestone.id);
		setIsModalOpen(true);
	}, []);

	const openAddModal = useCallback(() => {
		setNewEvent({ title: '', date: '', description: '', image: null, icon: 'camera' });
		setEditingId(null);
		setIsModalOpen(true);
	}, []);

	const handleImageChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// 1. Show immediate local preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setNewEvent((prev) => ({ ...prev, image: String(reader.result) }));
		};
		reader.readAsDataURL(file);

		// 2. Upload to ImageKit
		setIsUploading(true);
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('fileName', file.name || 'uploaded_image.jpg');

			// GET SECURE SIGNATURE FROM OUR OWN BACKEND FUNCTION
			const authRes = await fetch('/.netlify/functions/auth');
			if (!authRes.ok) {
				const errorData = await authRes.json();
				throw new Error(errorData.error || 'Failed to fetch upload signature');
			}
			const authData = await authRes.json();

			// APPEND THE TOKENS FOR CLIENT-SIDE AUTH
			formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || 'public_R9pi6oh628Cjn2sSuuaKwhHBJW0=');
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
			// Replace the temporary base64 image string with the hosted URL from ImageKit
			setNewEvent((prev) => ({ ...prev, image: data.url }));
		} catch (error) {
			console.error('Error uploading to ImageKit:', error);
			// Revert or show alert on fail
			alert('Failed to upload image to ImageKit. Using local preview only.');
		} finally {
			setIsUploading(false);
		}
	}, []);

	const handleSaveMilestone = useCallback(
		async (e: FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			if (!newEvent.title || !newEvent.date) return;

			if (editingId) {
				// UPDATE existing milestone in Supabase
				const { error } = await supabase.from('milestones').update(newEvent).eq('id', editingId);

				if (!error) {
					setMilestones((prev) =>
						prev
							.map((m) => (m.id === editingId ? { ...newEvent, id: editingId } : m))
							.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
					);
				} else {
					console.error('Error updating milestone:', error);
				}
			} else {
				// INSERT new milestone into Supabase
				const { data, error } = await supabase.from('milestones').insert([newEvent]).select(); // Ask supabase to return the inserted row

				if (!error && data) {
					setMilestones((prev) =>
						[...prev, data[0]].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
					);
				} else {
					console.error('Error inserting milestone:', error);
				}
			}

			setNewEvent({ title: '', date: '', description: '', image: null, icon: 'camera' });
			setEditingId(null);
			setIsModalOpen(false);
		},
		[newEvent, editingId],
	);

	return (
		<div
			className='relative min-h-screen overflow-x-hidden selection:bg-pink-200 text-slate-800'
			style={{
				fontFamily: "'Nunito', sans-serif",
				backgroundColor: '#fcf8f7',
			}}>
			{/* Floating Background Elements */}
			<div className='fixed inset-0 z-0 overflow-hidden pointer-events-none'>
				<Sparkles className='absolute top-[8%] left-[6%] text-amber-400 opacity-70 animate-float' size={56} />
				<Star
					className='absolute top-[25%] right-[12%] text-amber-400 opacity-60 animate-float-delayed'
					size={40}
					fill='currentColor'
				/>
				<Heart
					className='absolute top-[60%] left-[8%] text-pink-300 opacity-60 animate-float'
					size={48}
					fill='currentColor'
				/>
				<Moon
					className='absolute top-[15%] right-[20%] text-indigo-300 opacity-50 animate-float-delayed'
					size={50}
					fill='currentColor'
				/>
				<Sparkles className='absolute bottom-[20%] right-[10%] text-amber-400 opacity-70 animate-float' size={44} />
				<Baby className='absolute top-[80%] left-[12%] text-blue-300 opacity-50 animate-float-delayed' size={40} />

				{/* New additional floating icons */}
				<Smile className='absolute top-[40%] left-[18%] text-orange-300 opacity-50 animate-float' size={38} />
				<Gift className='absolute top-[75%] right-[25%] text-teal-300 opacity-50 animate-float-delayed' size={46} />
				<Music className='absolute top-[35%] right-[30%] text-rose-300 opacity-40 animate-float' size={36} />
				<Footprints
					className='absolute bottom-[25%] left-[25%] text-stone-300 opacity-50 animate-float-delayed'
					size={40}
					fill='currentColor'
				/>
				<Heart
					className='absolute top-[5%] right-[40%] text-pink-300 opacity-50 animate-float'
					size={32}
					fill='currentColor'
				/>
				<Star
					className='absolute bottom-[5%] left-[35%] text-amber-300 opacity-60 animate-float-delayed'
					size={30}
					fill='currentColor'
				/>
				<Sparkles className='absolute top-[50%] right-[5%] text-amber-400 opacity-60 animate-float' size={38} />
				<Baby className='absolute top-[90%] right-[40%] text-blue-300 opacity-40 animate-float' size={36} />
			</div>

			{/* Playful Header */}
			<header className='bg-white/80 backdrop-blur-md rounded-b-[3rem] shadow-sm p-8 mb-12 relative z-10 border-b border-pink-50'>
				<div className='relative z-10 max-w-5xl mx-auto text-center'>
					<div className='inline-flex items-center justify-center p-4 mb-4 transition-transform duration-300 bg-pink-100 rounded-full hover:scale-110'>
						<Baby className='w-12 h-12 text-pink-500' />
					</div>
					<h1 className='mb-2 text-4xl font-extrabold tracking-tight md:text-5xl text-slate-800'>Our Baby Journey</h1>
					<p className='text-lg font-medium text-slate-500'>From a tiny seed to our little miracle 🌱</p>
				</div>
			</header>

			{/* Main Timeline Content */}
			<main className='relative z-10 max-w-5xl px-4 pb-24 mx-auto'>
				<div className='relative'>
					{/* Vertical dashed timeline line */}
					<div className='absolute left-1/2 top-0 bottom-0 w-1.5 bg-pink-200 border-x-2 border-dashed border-pink-100 transform -translate-x-1/2 rounded-full'></div>

					{milestones.map((milestone, index) => (
						<TimelineItem
							key={milestone.id}
							milestone={milestone}
							index={index}
							onImageClick={setExpandedImage}
							onEditClick={handleEditClick}
						/>
					))}
				</div>
			</main>

			{/* Floating Add Button */}
			<button
				onClick={openAddModal}
				className='fixed z-40 flex items-center justify-center p-4 text-yellow-900 transition-transform transform bg-yellow-400 rounded-full shadow-lg bottom-8 right-8 hover:bg-yellow-300 shadow-yellow-200 hover:scale-110 group'>
				<Plus className='w-8 h-8' strokeWidth={3} />
				<span className='overflow-hidden text-lg font-bold transition-all duration-300 ease-in-out max-w-0 whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 group-hover:mr-2'>
					Add Memory
				</span>
			</button>

			{/* Add Milestone Modal */}
			{isModalOpen && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-sm'
					onClick={() => {
						setIsModalOpen(false);
						setEditingId(null);
					}}>
					<div
						className='bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-pink-100 transform transition-all my-8'
						onClick={(e) => e.stopPropagation()}>
						{/* Modal Header */}
						<div className='flex items-center justify-between px-8 py-6 border-b-2 border-pink-100 bg-pink-50 shrink-0'>
							<h2 className='flex items-center gap-2 text-2xl font-bold text-slate-800'>
								<Sparkles className='w-6 h-6 text-yellow-400' />
								{editingId ? 'Edit Memory' : 'New Memory'}
							</h2>
							<button
								onClick={() => {
									setIsModalOpen(false);
									setEditingId(null);
								}}
								className='p-2 transition-colors bg-white rounded-full text-slate-400 hover:text-pink-500 hover:bg-pink-100'>
								<X className='w-6 h-6' />
							</button>
						</div>

						{/* Modal Form */}
						<form onSubmit={handleSaveMilestone} className='p-8 space-y-6 overflow-y-auto'>
							<div>
								<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
									What happened? (Title) <span className='text-pink-500'>*</span>
								</label>
								<input
									type='text'
									required
									placeholder='e.g. First Kicks!'
									value={newEvent.title}
									onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
									className='w-full px-6 py-3 text-lg transition-colors border-2 rounded-full bg-slate-50 border-slate-100 focus:outline-none focus:border-pink-300 focus:bg-white'
								/>
							</div>

							<div>
								<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
									When did it happen? <span className='text-pink-500'>*</span>
								</label>
								<input
									type='date'
									required
									value={newEvent.date}
									onChange={(e) => setNewEvent((prev) => ({ ...prev, date: e.target.value }))}
									className='w-full px-6 py-3 text-lg transition-colors border-2 rounded-full bg-slate-50 border-slate-100 focus:outline-none focus:border-pink-300 focus:bg-white text-slate-600'
								/>
							</div>

							<div>
								<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Tell the story...</label>
								<textarea
									placeholder='It felt like little butterflies...'
									value={newEvent.description}
									onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
									className='w-full h-32 px-6 py-4 text-lg transition-colors border-2 resize-none bg-slate-50 border-slate-100 rounded-3xl focus:outline-none focus:border-pink-300 focus:bg-white'></textarea>
							</div>

							{/* Icon Selection */}
							<div>
								<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Choose an Icon</label>
								<div className='flex flex-wrap gap-3 px-4'>
									{ICON_OPTIONS.map((iconName) => (
										<button
											key={iconName}
											type='button'
											onClick={() => setNewEvent((prev) => ({ ...prev, icon: iconName }))}
											className={`p-3 rounded-full border-2 transition-all duration-300 ${
												newEvent.icon === iconName
													? 'border-pink-400 bg-pink-50 scale-110 shadow-md rotate-6'
													: 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:scale-105'
											}`}>
											{renderIcon(iconName)}
										</button>
									))}
								</div>
							</div>

							{/* Photo Upload Area */}
							<div>
								<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Add a Photo</label>

								<input
									type='file'
									accept='image/*'
									ref={fileInputRef}
									onChange={handleImageChange}
									className='hidden'
								/>

								{!newEvent.image ? (
									<button
										type='button'
										disabled={isUploading}
										onClick={() => fileInputRef.current?.click()}
										className={`flex flex-col items-center justify-center w-full p-8 transition-all border-4 border-dashed rounded-3xl group ${
											isUploading
												? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
												: 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-pink-200 hover:text-pink-400'
										}`}>
										<div className='p-4 mb-3 transition-transform bg-white rounded-full shadow-sm group-hover:scale-110'>
											<ImageIcon className={`w-8 h-8 ${isUploading ? 'animate-pulse' : ''}`} />
										</div>
										<span className='font-medium'>
											{isUploading ? 'Uploading to ImageKit...' : 'Click to choose a cute photo'}
										</span>
									</button>
								) : (
									<div className='relative max-w-xs p-3 pb-8 mx-auto transform bg-white border shadow-md rounded-xl border-slate-200 group rotate-1'>
										<div
											className={`w-full aspect-[3/4] overflow-hidden rounded-lg bg-slate-50 border border-slate-100 ${isUploading ? 'opacity-50' : ''}`}>
											<img src={newEvent.image} alt='Preview' className='object-cover object-center w-full h-full' />
										</div>
										<div className='absolute inset-0 z-10 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100 rounded-xl'>
											<button
												type='button'
												disabled={isUploading}
												onClick={() => fileInputRef.current?.click()}
												className='px-6 py-2 font-bold transition-transform transform bg-white rounded-full shadow-lg text-slate-800 hover:bg-pink-50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'>
												{isUploading ? 'Uploading...' : 'Change Photo'}
											</button>
										</div>
										{isUploading && (
											<div className='absolute inset-0 z-20 flex items-center justify-center bg-white/50 rounded-xl'>
												<span className='px-4 py-2 font-bold text-pink-600 bg-pink-100 rounded-full shadow-sm animate-pulse'>
													Uploading...
												</span>
											</div>
										)}
									</div>
								)}
							</div>

							<div className='pt-4'>
								<button
									type='submit'
									className='w-full py-4 text-xl font-bold text-white transition transform bg-pink-400 rounded-full shadow-lg hover:bg-pink-500 shadow-pink-200 active:scale-95'>
									Save this Memory 💖
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Expanded Image Modal */}
			{expandedImage && (
				<div
					className='fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] cursor-pointer'
					onClick={() => setExpandedImage(null)}>
					<div className='relative max-w-full max-h-[90vh]'>
						<img
							src={expandedImage}
							alt='Expanded Memory'
							className='max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl scale-100 transition-transform cursor-auto'
							onClick={(e) => e.stopPropagation()}
						/>
						<button
							onClick={() => setExpandedImage(null)}
							className='absolute z-10 hidden p-2 transition-colors bg-white rounded-full shadow-xl -top-4 -right-4 text-slate-800 hover:bg-pink-50 hover:text-pink-500 md:block'>
							<X className='w-6 h-6' />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default App;

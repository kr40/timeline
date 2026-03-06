import { Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Milestone, NewEvent } from '../types';
import { ICON_OPTIONS, renderIcon } from '../utils';

type Props = {
	editingMilestone: Milestone | null;
	onClose: () => void;
	onSave: (event: NewEvent, file: File | null) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
};

export const MemoryModal = ({ editingMilestone, onClose, onSave, onDelete }: Props) => {
	const [localEvent, setLocalEvent] = useState<NewEvent>({
		title: '',
		date: '',
		description: '',
		image: null,
		icon: 'camera',
	});
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (editingMilestone) {
			setLocalEvent({
				title: editingMilestone.title,
				date: editingMilestone.date,
				description: editingMilestone.description,
				image: editingMilestone.image,
				icon: editingMilestone.icon,
			});
			setPreviewUrl(editingMilestone.image);
		}
	}, [editingMilestone]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	useEffect(() => {
		// Cleanup object URL to prevent memory leaks
		return () => {
			if (previewUrl && previewUrl.startsWith('blob:')) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const url = URL.createObjectURL(file);
		setPreviewUrl(url);
		setSelectedFile(file);
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			await onSave(localEvent, selectedFile);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-sm'
			onClick={onClose}>
			<div
				className='bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-pink-100 transform transition-all my-8'
				onClick={(e) => e.stopPropagation()}>
				<div className='flex items-center justify-between px-8 py-6 border-b-2 border-pink-100 bg-pink-50 shrink-0'>
					<h2 className='flex items-center gap-2 text-2xl font-bold text-slate-800'>
						<Sparkles className='w-6 h-6 text-yellow-400' />
						{editingMilestone ? 'Edit Memory' : 'New Memory'}
					</h2>
					<div className='flex items-center gap-2'>
						{editingMilestone && (
							<button
								type='button'
								onClick={() => onDelete(editingMilestone.id)}
								className='p-2 transition-colors bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50'
								title='Delete Memory'>
								<Trash2 className='w-6 h-6' />
							</button>
						)}
						<button
							type='button'
							onClick={onClose}
							className='p-2 transition-colors bg-white rounded-full text-slate-400 hover:text-pink-500 hover:bg-pink-100'
							title='Close'>
							<X className='w-6 h-6' />
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='p-8 space-y-6 overflow-y-auto'>
					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
							What happened? (Title) <span className='text-pink-500'>*</span>
						</label>
						<input
							type='text'
							required
							placeholder='e.g. First Kicks!'
							value={localEvent.title}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, title: e.target.value }))}
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
							value={localEvent.date}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, date: e.target.value }))}
							className='w-full px-6 py-3 text-lg transition-colors border-2 rounded-full bg-slate-50 border-slate-100 focus:outline-none focus:border-pink-300 focus:bg-white text-slate-600'
						/>
					</div>

					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Tell the story...</label>
						<textarea
							placeholder='It felt like little butterflies...'
							value={localEvent.description}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, description: e.target.value }))}
							className='w-full h-32 px-6 py-4 text-lg transition-colors border-2 resize-none bg-slate-50 border-slate-100 rounded-3xl focus:outline-none focus:border-pink-300 focus:bg-white'></textarea>
					</div>

					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Choose an Icon</label>
						<div className='flex flex-wrap gap-3 px-4'>
							{ICON_OPTIONS.map((iconName) => (
								<button
									key={iconName}
									type='button'
									onClick={() => setLocalEvent((prev) => ({ ...prev, icon: iconName }))}
									className={`p-3 rounded-full border-2 transition-all duration-300 ${
										localEvent.icon === iconName
											? 'border-pink-400 bg-pink-50 scale-110 shadow-md rotate-6'
											: 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:scale-105'
									}`}>
									{renderIcon(iconName)}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Add a Photo</label>
						<input type='file' accept='image/*' ref={fileInputRef} onChange={handleImageChange} className='hidden' />

						{!previewUrl ? (
							<button
								type='button'
								disabled={isSaving}
								onClick={() => fileInputRef.current?.click()}
								className={`flex flex-col items-center justify-center w-full p-8 transition-all border-4 border-dashed rounded-3xl group ${
									isSaving
										? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
										: 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-pink-200 hover:text-pink-400'
								}`}>
								<div className='p-4 mb-3 transition-transform bg-white rounded-full shadow-sm group-hover:scale-110'>
									<ImageIcon className='w-8 h-8' />
								</div>
								<span className='font-medium'>Click to choose a cute photo</span>
							</button>
						) : (
							<div className='relative max-w-xs p-3 pb-8 mx-auto transform bg-white border shadow-md rounded-xl border-slate-200 group rotate-1'>
								<div
									className={`w-full aspect-[3/4] overflow-hidden rounded-lg bg-slate-50 border border-slate-100 ${isSaving ? 'opacity-50' : ''}`}>
									<img src={previewUrl} alt='Preview' className='object-cover object-center w-full h-full' />
								</div>
								<div className='absolute inset-0 z-10 flex items-center justify-center transition-opacity opacity-0 bg-black/40 group-hover:opacity-100 rounded-xl'>
									<button
										type='button'
										disabled={isSaving}
										onClick={() => fileInputRef.current?.click()}
										className='px-6 py-2 font-bold transition-transform transform bg-white rounded-full shadow-lg text-slate-800 hover:bg-pink-50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'>
										Change Photo
									</button>
								</div>
							</div>
						)}
					</div>

					<div className='pt-4'>
						<button
							type='submit'
							disabled={isSaving}
							className='w-full py-4 text-xl font-bold text-white transition transform flex justify-center items-center gap-2 bg-pink-400 rounded-full shadow-lg hover:bg-pink-500 shadow-pink-200 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed'>
							{isSaving ? 'Saving...' : 'Save this Memory 💖'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

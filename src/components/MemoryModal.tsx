import { Image as ImageIcon, Sparkles, Trash2, X } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { uploadToImageKit } from '../imagekit';
import { Milestone, NewEvent, getImages } from '../types';
import { ICON_OPTIONS } from '../utils';
import { renderIcon } from '../icons';
import { MAX_IMAGES } from '../constants';

type Props = {
	editingMilestone: Milestone | null;
	onClose:  () => void;
	onSave:   (event: NewEvent) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
};

export const MemoryModal = ({ editingMilestone, onClose, onSave, onDelete }: Props) => {
	const [localEvent, setLocalEvent] = useState<NewEvent>({
		title: '',
		date: '',
		description: '',
		image: null,
		images: [],
		icon: 'camera',
	});

	// URLs already saved in DB (from editingMilestone)
	const [existingImages, setExistingImages] = useState<string[]>([]);
	// Files selected in this session, not yet uploaded
	const [newFiles, setNewFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);

	const [isSaving, setIsSaving] = useState(false);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const [deleteConfirming, setDeleteConfirming] = useState(false);
	const [operationError, setOperationError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const totalCount = existingImages.length + newFiles.length;
	const canAddMore  = totalCount < MAX_IMAGES;

	// Initialise / reset when the target milestone changes
	useEffect(() => {
		setDeleteConfirming(false);
		setOperationError(null);
		setExistingImages(editingMilestone ? getImages(editingMilestone) : []);
		setNewFiles([]);
		setLocalEvent(
			editingMilestone
				? {
					title:       editingMilestone.title,
					date:        editingMilestone.date,
					description: editingMilestone.description,
					image:       editingMilestone.image,
					images:      [],  // handleSubmit re-merges existingImages + uploadedUrls
					icon:        editingMilestone.icon,
				}
				: { title: '', date: '', description: '', image: null, images: [], icon: 'camera' },
		);
	}, [editingMilestone]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [onClose]);

	// Revoke all blob URLs when the session ends (milestone changes or unmount).
	// Intentionally depends on editingMilestone NOT newFiles to avoid
	// revoking URLs that are still displayed in the current session.
	useEffect(() => {
		return () => {
			newFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
		};
	}, [editingMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (!files.length) return;
		const toAdd = files.slice(0, MAX_IMAGES - totalCount);
		setNewFiles(prev => [
			...prev,
			...toAdd.map(file => ({ file, previewUrl: URL.createObjectURL(file) })),
		]);
		e.target.value = '';  // reset so same file can be re-selected
	};

	const handleRemoveExisting = (i: number) =>
		setExistingImages(prev => prev.filter((_, idx) => idx !== i));

	const handleRemoveNewFile = (i: number) =>
		setNewFiles(prev => {
			URL.revokeObjectURL(prev[i].previewUrl);
			return prev.filter((_, idx) => idx !== i);
		});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setOperationError(null);
		try {
			// Upload new files sequentially, collecting failures by 1-based index.
			// On success, promote uploaded URLs into existingImages so a DB-save retry
			// never re-uploads the same files.
			let allImages = existingImages;
			if (newFiles.length > 0) {
				const uploadedUrls: string[] = [];
				const failures: number[] = [];
				for (let i = 0; i < newFiles.length; i++) {
					setUploadingIndex(i);
					try {
						uploadedUrls.push(await uploadToImageKit(newFiles[i].file));
					} catch {
						failures.push(i + 1);
					}
				}
				setUploadingIndex(null);
				if (failures.length > 0) {
					throw new Error(
						`Photo${failures.length > 1 ? 's' : ''} ${failures.join(', ')} failed to upload. Remove them and try again.`,
					);
				}
				newFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
				allImages = [...existingImages, ...uploadedUrls];
				setExistingImages(allImages);
				setNewFiles([]);
			}
			await onSave({ ...localEvent, images: allImages });
		} catch (err: any) {
			setOperationError(err.message || 'Failed to save memory. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#1A1A2E]/40 backdrop-blur-sm'
			aria-label='Close dialog'
			onClick={onClose}>
			<div
				role='dialog'
				aria-modal='true'
				aria-labelledby='memory-modal-title'
				className='bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-xl overflow-hidden transform transition-all my-8'
				onClick={(e) => e.stopPropagation()}>

				{/* Header */}
				<div className='flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-[#FF8C69]/5 shrink-0'>
					<h2 id='memory-modal-title' className='flex items-center gap-2 text-2xl font-poppins font-bold text-[#1A1A2E]'>
						<Sparkles className='w-6 h-6 text-yellow-400' />
						{editingMilestone ? 'Edit Memory' : 'New Memory'}
					</h2>
					<div className='flex items-center gap-2'>
						{editingMilestone && (
							deleteConfirming ? (
								<div className='flex items-center gap-2'>
									<span className='text-sm font-semibold text-red-500'>Delete?</span>
									<button
										type='button'
										onClick={async () => {
											setOperationError(null);
											try {
												await onDelete(editingMilestone.id);
											} catch (err: any) {
												setDeleteConfirming(false);
												setOperationError(err.message || 'Failed to delete memory. Please try again.');
											}
										}}
										className='px-3 py-1 text-sm font-bold text-white bg-[#B39DDB] rounded-full hover:opacity-90 transition-opacity'>
										Yes, delete
									</button>
									<button
										type='button'
										onClick={() => setDeleteConfirming(false)}
										className='px-3 py-1 text-sm font-bold text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors'>
										Cancel
									</button>
								</div>
							) : (
								<button
									type='button'
									onClick={() => setDeleteConfirming(true)}
									className='p-2 transition-colors bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50'
									title='Delete Memory'>
									<Trash2 className='w-6 h-6' />
								</button>
							)
						)}
						<button
							type='button'
							onClick={onClose}
							className='p-2 transition-colors bg-white rounded-full text-slate-400 hover:text-[#FF8C69] hover:bg-[#FF8C69]/10'
							title='Close'>
							<X className='w-6 h-6' />
						</button>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className='p-8 space-y-6 overflow-y-auto'>
					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
							What happened? (Title) <span className='text-[#FF8C69]'>*</span>
						</label>
						<input
							type='text'
							required
							placeholder='e.g. First Kicks!'
							value={localEvent.title}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, title: e.target.value }))}
							className='w-full px-6 py-3 text-lg transition-colors border-2 rounded-full bg-white border-slate-200 focus:outline-none focus:border-[#FF8C69] focus:bg-white'
						/>
					</div>

					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
							When did it happen? <span className='text-[#FF8C69]'>*</span>
						</label>
						<input
							type='date'
							required
							value={localEvent.date}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, date: e.target.value }))}
							className='w-full px-6 py-3 text-lg transition-colors border-2 rounded-full bg-white border-slate-200 focus:outline-none focus:border-[#FF8C69] focus:bg-white text-slate-600'
						/>
					</div>

					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>Tell the story...</label>
						<textarea
							placeholder='It felt like little butterflies...'
							value={localEvent.description}
							onChange={(e) => setLocalEvent((prev) => ({ ...prev, description: e.target.value }))}
							className='w-full h-32 px-6 py-4 text-lg transition-colors border-2 resize-none bg-white border-slate-200 rounded-3xl focus:outline-none focus:border-[#FF8C69] focus:bg-white'
						/>
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
											? 'border-[#FF8C69] bg-[#FF8C69]/10 scale-110 shadow-md rotate-6'
											: 'border-slate-100 bg-slate-50 hover:bg-slate-100 hover:scale-105'
									}`}>
									{renderIcon(iconName)}
								</button>
							))}
						</div>
					</div>

					{/* Multi-photo section */}
					<div>
						<label className='block pl-4 mb-2 text-sm font-bold text-slate-700'>
							Photos
							{totalCount > 0 && (
								<span className='ml-1 text-xs font-normal text-slate-400'>
									({totalCount}/{MAX_IMAGES})
								</span>
							)}
						</label>

						<input
							type='file'
							accept='image/*'
							multiple
							ref={fileInputRef}
							onChange={handleImageChange}
							className='hidden'
						/>

						{/* Thumbnail grid */}
						{totalCount > 0 && (
							<div className='grid grid-cols-3 gap-3 mb-3'>
								{existingImages.map((url, i) => (
									<div
										key={`existing-${i}`}
										className='relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50'>
										<img
											src={url}
											alt={`Photo ${i + 1}`}
											className='object-cover w-full h-full'
										/>
										<button
											type='button'
											disabled={isSaving}
											onClick={() => handleRemoveExisting(i)}
											className='absolute top-1 right-1 p-0.5 bg-white/80 rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-colors shadow-sm disabled:opacity-50'>
											<X className='w-4 h-4' />
										</button>
									</div>
								))}

								{newFiles.map(({ previewUrl }, i) => (
									<div
										key={`new-${i}`}
										className='relative aspect-square rounded-xl overflow-hidden border-2 border-[#FF8C69]/30 bg-slate-50'>
										<img
											src={previewUrl}
											alt={`New photo ${i + 1}`}
											className='object-cover w-full h-full'
										/>
										{isSaving && uploadingIndex === i ? (
											<div className='absolute inset-0 bg-black/30 flex items-center justify-center'>
												<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
											</div>
										) : !isSaving ? (
											<button
												type='button'
												onClick={() => handleRemoveNewFile(i)}
												className='absolute top-1 right-1 p-0.5 bg-white/80 rounded-full text-slate-600 hover:text-red-500 hover:bg-white transition-colors shadow-sm'>
												<X className='w-4 h-4' />
											</button>
										) : null}
									</div>
								))}
							</div>
						)}

						{/* Add photos button */}
						{canAddMore && (
							<button
								type='button'
								disabled={isSaving}
								onClick={() => fileInputRef.current?.click()}
								className={`flex items-center justify-center gap-2 w-full p-6 transition-all border-4 border-dashed rounded-3xl group ${
									isSaving
										? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
										: 'border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-[#FF8C69] hover:text-[#FF8C69]'
								}`}>
								<div className='p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform'>
									<ImageIcon className='w-6 h-6' />
								</div>
								<span className='font-medium'>
									{totalCount === 0 ? 'Click to choose photos' : 'Add more photos'}
								</span>
							</button>
						)}
					</div>

					<div className='pt-4'>
						<button
							type='submit'
							disabled={isSaving}
							className='w-full py-4 text-xl font-bold text-white transition transform flex justify-center items-center gap-2 bg-[#FF8C69] rounded-full shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed'>
							{isSaving ? 'Saving...' : 'Save this Memory 💖'}
						</button>
					</div>

					{operationError && (
						<div className='px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-2xl'>
							{operationError}
						</div>
					)}
				</form>
			</div>
		</div>
	);
};

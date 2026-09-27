import { CameraPlus, Trash, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { uploadToImageKit } from '../../imagekit';
import { fallbackTo, ikResize } from '../../lib/imagekit';
import { Milestone, NewEvent, getImages } from '../../types';
import { ICON_OPTIONS, errorMessage } from '../../utils';
import { MAX_IMAGES } from '../../constants';
import { Button } from '../ui/Button';
import { ErrorNote } from '../ui/ErrorNote';
import { timelineIcon } from './timelineIcons';

type Props = {
	editingMilestone: Milestone | null;
	onSave:   (event: NewEvent) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
};

const REMOVE = 'absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-white disabled:opacity-50';

export const MemoryForm = ({ editingMilestone, onSave, onDelete }: Props) => {
	const [localEvent, setLocalEvent] = useState<NewEvent>({
		title: '', date: '', description: '', image: null, images: [], icon: 'camera',
	});
	// URLs already saved in the DB
	const [existingImages, setExistingImages] = useState<string[]>([]);
	// Files picked in this session, not yet uploaded
	const [newFiles, setNewFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const [deleteConfirming, setDeleteConfirming] = useState(false);
	const [operationError, setOperationError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const totalCount = existingImages.length + newFiles.length;
	const canAddMore = totalCount < MAX_IMAGES;

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
					images:      [],  // handleSubmit re-merges existingImages + uploaded URLs
					icon:        editingMilestone.icon,
				}
				: { title: '', date: '', description: '', image: null, images: [], icon: 'camera' },
		);
	}, [editingMilestone]);

	// Revoke blob URLs when the session ends. Depends on editingMilestone, not newFiles,
	// so URLs still on screen are never revoked early.
	useEffect(() => {
		return () => {
			newFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
		};
	}, [editingMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (!files.length) return;
		const toAdd = files.slice(0, MAX_IMAGES - totalCount);
		setNewFiles(prev => [...prev, ...toAdd.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))]);
		e.target.value = '';
	};

	const handleRemoveExisting = (i: number) => setExistingImages(prev => prev.filter((_, idx) => idx !== i));

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
					setOperationError(
						`Photo${failures.length > 1 ? 's' : ''} ${failures.join(', ')} failed to upload. Remove ${failures.length > 1 ? 'them' : 'it'} and try again.`,
					);
					return;
				}
				newFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
				allImages = [...existingImages, ...uploadedUrls];
				setExistingImages(allImages);
				setNewFiles([]);
			}
			await onSave({ ...localEvent, images: allImages });
		} catch (err: unknown) {
			setOperationError(errorMessage(err, "Couldn't save this memory. Try again?"));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!editingMilestone) return;
		setOperationError(null);
		try {
			await onDelete(editingMilestone.id);
		} catch (err: unknown) {
			setDeleteConfirming(false);
			setOperationError(errorMessage(err, "Couldn't delete this memory. Try again?"));
		}
	};

	return (
		<form onSubmit={e => void handleSubmit(e)} className='space-y-5 pb-2'>
			<div>
				<label className='field-label' htmlFor='memory-title'>What happened?</label>
				<input
					id='memory-title'
					className='field'
					required
					placeholder='First kicks!'
					value={localEvent.title}
					onChange={e => setLocalEvent(prev => ({ ...prev, title: e.target.value }))}
				/>
			</div>
			<div>
				<label className='field-label' htmlFor='memory-date'>When</label>
				<input
					id='memory-date'
					type='date'
					className='field'
					required
					value={localEvent.date}
					onChange={e => setLocalEvent(prev => ({ ...prev, date: e.target.value }))}
				/>
			</div>
			<div>
				<label className='field-label' htmlFor='memory-story'>The story</label>
				<textarea
					id='memory-story'
					className='field min-h-[120px] resize-none'
					placeholder='It felt like little butterflies…'
					value={localEvent.description}
					onChange={e => setLocalEvent(prev => ({ ...prev, description: e.target.value }))}
				/>
			</div>

			<fieldset>
				<legend className='field-label'>Icon</legend>
				<div className='flex flex-wrap gap-2'>
					{ICON_OPTIONS.map(name => {
						const { Icon, bg } = timelineIcon(name);
						const selected = localEvent.icon === name;
						return (
							<motion.button
								key={name}
								type='button'
								aria-label={name}
								aria-pressed={selected}
								onClick={() => setLocalEvent(prev => ({ ...prev, icon: name }))}
								whileTap={{ scale: 0.9 }}
								animate={{ scale: selected ? 1.1 : 1, rotate: selected ? 6 : 0 }}
								transition={{ type: 'spring', stiffness: 500, damping: 20 }}
								className={`grid h-11 w-11 place-items-center rounded-full border-2 ${selected ? `border-ink ${bg} shadow-sticker-sm` : 'border-ink/20 bg-white'}`}
							>
								<Icon size={20} weight='duotone' />
							</motion.button>
						);
					})}
				</div>
			</fieldset>

			<div>
				<p className='field-label'>Photos {totalCount > 0 && <span className='normal-case tracking-normal'>({totalCount}/{MAX_IMAGES})</span>}</p>
				<input type='file' accept='image/*' multiple ref={fileInputRef} onChange={handleImageChange} className='hidden' />
				{totalCount > 0 && (
					<div className='mb-3 grid grid-cols-3 gap-2.5'>
						{existingImages.map((url, i) => (
							<div key={`existing-${i}`} className='relative aspect-square overflow-hidden rounded-xl border-2 border-ink bg-white'>
								<img
									src={ikResize(url, 240)}
									alt={`Photo ${i + 1}`}
									onError={fallbackTo(url)}
									className='h-full w-full object-cover'
								/>
								<button type='button' aria-label={`Remove photo ${i + 1}`} disabled={isSaving} onClick={() => handleRemoveExisting(i)} className={REMOVE}>
									<X size={12} weight='bold' />
								</button>
							</div>
						))}
						{newFiles.map(({ previewUrl }, i) => (
							<div key={`new-${i}`} className='relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-ink bg-white'>
								<img src={previewUrl} alt={`New photo ${i + 1}`} className='h-full w-full object-cover' />
								{isSaving && uploadingIndex === i ? (
									<div className='absolute inset-0 grid place-items-center bg-ink/30'>
										<div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
									</div>
								) : !isSaving ? (
									<button type='button' aria-label={`Remove new photo ${i + 1}`} onClick={() => handleRemoveNewFile(i)} className={REMOVE}>
										<X size={12} weight='bold' />
									</button>
								) : null}
							</div>
						))}
					</div>
				)}
				{canAddMore && (
					<button
						type='button'
						disabled={isSaving}
						onClick={() => fileInputRef.current?.click()}
						className='flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/40 bg-white/60 py-5 text-sm font-extrabold transition-colors hover:bg-white disabled:opacity-50'
					>
						<CameraPlus size={26} weight='duotone' />
						{totalCount === 0 ? 'Add photos' : 'Add more photos'}
					</button>
				)}
			</div>

			{operationError && <ErrorNote>{operationError}</ErrorNote>}

			<Button type='submit' tone='butter' size='lg' block disabled={isSaving}>
				{isSaving ? 'Saving…' : 'Save memory'}
			</Button>

			{editingMilestone && (
				deleteConfirming ? (
					<div className='flex items-center justify-between gap-2 rounded-2xl border-2 border-danger bg-white p-3'>
						<span className='text-sm font-bold text-danger'>Delete this memory for good?</span>
						<div className='flex gap-2'>
							<Button size='sm' tone='white' onClick={() => setDeleteConfirming(false)}>Keep</Button>
							<Button size='sm' tone='pink' onClick={() => void handleDelete()}>Delete</Button>
						</div>
					</div>
				) : (
					<button
						type='button'
						onClick={() => setDeleteConfirming(true)}
						className='mx-auto flex items-center gap-1.5 text-sm font-bold text-danger'
					>
						<Trash size={16} weight='bold' />
						Delete memory
					</button>
				)
			)}
		</form>
	);
};

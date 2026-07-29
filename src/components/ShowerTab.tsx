import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { uploadToImageKit } from '../imagekit';
import { ShowerPost } from '../types';

const COLORS = [
	'bg-[#FF8C69]/10 border-[#FF8C69]/20',
	'bg-[#6CC9C9]/10 border-[#6CC9C9]/20',
	'bg-[#B39DDB]/10 border-[#B39DDB]/20',
	'bg-[#FF8FAB]/10 border-[#FF8FAB]/20',
];

function relativeTime(iso: string): string {
	const diff  = Date.now() - new Date(iso).getTime();
	const mins  = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days  = Math.floor(diff / 86400000);
	if (mins  < 1)  return 'just now';
	if (mins  < 60) return `${mins}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days  < 7)  return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}

export const ShowerTab = ({ onImageClick }: { onImageClick: (url: string) => void }) => {
	const [posts, setPosts]             = useState<ShowerPost[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [loadError, setLoadError]     = useState<string | null>(null);
	const [authorName, setAuthorName]   = useState('');
	const [message, setMessage]         = useState('');
	const [photo, setPhoto]             = useState<{ file: File; previewUrl: string } | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const { data, error } = await supabase
					.from('shower_posts').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setPosts(data ?? []);
			} catch (err: unknown) {
				setLoadError(err instanceof Error ? err.message : 'Failed to load shower posts.');
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		return () => { if (photo) URL.revokeObjectURL(photo.previewUrl); };
	}, [photo]);

	const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (photo) URL.revokeObjectURL(photo.previewUrl);
		setPhoto({ file, previewUrl: URL.createObjectURL(file) });
		e.target.value = '';
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const name = authorName.trim();
		const msg  = message.trim();
		if (!name || !msg) return;
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			let imageUrl: string | null = null;
			if (photo) imageUrl = await uploadToImageKit(photo.file);

			const { data, error } = await supabase
				.from('shower_posts')
				.insert({ author_name: name, message: msg, image_url: imageUrl })
				.select()
				.single();
			if (error) throw error;

			setPosts(prev => [data, ...prev]);
			setAuthorName('');
			setMessage('');
			if (photo) { URL.revokeObjectURL(photo.previewUrl); setPhoto(null); }
		} catch (err: unknown) {
			setSubmitError(err instanceof Error ? err.message : 'Failed to post. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 pb-4'>
			<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white shadow-lg shadow-[#FF8C69]/30 text-center'>
				<div className='text-4xl mb-2'>🎉</div>
				<h2 className='font-poppins font-extrabold text-xl'>Baby Shower Memories</h2>
				<p className='text-white/80 text-sm font-semibold mt-1'>Share a photo and a message from the celebration!</p>
			</div>

			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
				<form onSubmit={handleSubmit} className='space-y-3'>
					<input type='text' placeholder='Your name' required value={authorName}
						onChange={e => setAuthorName(e.target.value)}
						className='w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#FF8C69] transition-colors' />
					<textarea placeholder='Your message for the family...' required rows={3} value={message}
						onChange={e => setMessage(e.target.value)}
						className='w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-3xl bg-slate-50 focus:outline-none focus:border-[#FF8C69] resize-none transition-colors' />

					<input type='file' accept='image/*' ref={fileInputRef} onChange={handlePhotoChange} className='hidden' />

					{photo ? (
						<div className='relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#FF8C69]/30'>
							<img src={photo.previewUrl} alt='Selected' className='object-cover w-full h-full' />
							{!isSubmitting && (
								<button type='button'
									onClick={() => { URL.revokeObjectURL(photo.previewUrl); setPhoto(null); }}
									className='absolute top-1 right-1 p-0.5 bg-white/80 rounded-full text-slate-600 hover:text-red-500 transition-colors'>
									<X className='w-4 h-4' />
								</button>
							)}
						</div>
					) : (
						<button type='button' disabled={isSubmitting}
							onClick={() => fileInputRef.current?.click()}
							className='flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#FF8C69]/50 hover:text-[#FF8C69] transition-colors text-sm font-semibold'>
							<ImageIcon className='w-4 h-4' /> Add a photo (optional)
						</button>
					)}

					{submitError && <p className='text-xs text-red-500 font-semibold px-2'>{submitError}</p>}
					<button type='submit' disabled={isSubmitting}
						className='w-full py-3 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all disabled:opacity-60'>
						{isSubmitting ? 'Sharing...' : 'Share the Moment 🎉'}
					</button>
				</form>
			</div>

			{isLoading && (
				<div className='flex justify-center py-8'>
					<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
				</div>
			)}
			{loadError && (
				<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center'>
					{loadError}
				</div>
			)}
			{!isLoading && !loadError && posts.length === 0 && (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-4xl mb-3'>📸</div>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No memories yet</p>
					<p className='text-xs text-[#6B7280] font-semibold mt-1'>Be the first to share a moment from the shower!</p>
				</div>
			)}
			{posts.map((post, i) => (
				<div key={post.id} className={`rounded-3xl border p-5 ${COLORS[i % COLORS.length]}`}>
					{post.image_url && (
						<button type='button' onClick={() => onImageClick(post.image_url as string)}
							className='block w-full mb-3 rounded-2xl overflow-hidden'>
							<img src={post.image_url} alt={`Photo from ${post.author_name}`} loading='lazy'
								className='w-full max-h-80 object-cover' />
						</button>
					)}
					<div className='flex items-center justify-between mb-2'>
						<span className='font-poppins font-bold text-[#1A1A2E] text-sm'>{post.author_name}</span>
						<span className='text-[10px] text-[#6B7280] font-semibold'>{relativeTime(post.created_at)}</span>
					</div>
					<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed'>{post.message}</p>
				</div>
			))}
		</div>
	);
};

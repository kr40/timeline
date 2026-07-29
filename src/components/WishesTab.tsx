import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wish } from '../types';
import { ReactionBar } from './wishes/ReactionBar';

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

export const WishesTab = () => {
	const [wishes, setWishes]           = useState<Wish[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [loadError, setLoadError]     = useState<string | null>(null);
	const [authorName, setAuthorName]   = useState('');
	const [message, setMessage]         = useState('');
	const [category, setCategory]       = useState<'blessing' | 'advice'>('blessing');
	const [filter, setFilter]           = useState<'all' | 'blessing' | 'advice'>('all');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [pendingIds, setPendingIds]   = useState<Set<string>>(new Set());

	useEffect(() => {
		const load = async () => {
			try {
				const { data, error } = await supabase
					.from('wishes').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setWishes(data ?? []);
			} catch (err: unknown) {
				setLoadError(err instanceof Error ? err.message : 'Failed to load wishes.');
			} finally {
				setIsLoading(false);
			}
		};
		void load();
	}, []);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const name = authorName.trim();
		const msg  = message.trim();
		if (!name || !msg) return;
		setIsSubmitting(true);
		setSubmitError(null);

		const optimistic: Wish = {
			id: crypto.randomUUID(), author_name: name, message: msg,
			category,
			created_at: new Date().toISOString(),
		};
		setWishes(prev => [optimistic, ...prev]);
		setPendingIds(prev => new Set(prev).add(optimistic.id));
		setAuthorName('');
		setMessage('');

		try {
			const { data, error } = await supabase
				.from('wishes').insert({ author_name: name, message: msg, category }).select().single();
			if (error) throw error;
			setWishes(prev => prev.map(w => w.id === optimistic.id ? data : w));
		} catch (err: unknown) {
			setWishes(prev => prev.filter(w => w.id !== optimistic.id));
			setSubmitError(err instanceof Error ? err.message : 'Failed to post wish. Please try again.');
		} finally {
			setPendingIds(prev => {
				const next = new Set(prev);
				next.delete(optimistic.id);
				return next;
			});
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 pb-4'>
			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
				<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-1'>Blessings & Advice Corner 🙏</h2>
				<p className='text-xs text-[#6B7280] font-semibold mb-4'>Shower baby with your ashirwad, or share your best advice for the new parents</p>
				<form onSubmit={handleSubmit} className='space-y-3'>
					<div className='flex gap-2'>
						<button type='button' onClick={() => setCategory('blessing')}
							className={`flex-1 py-2 rounded-full text-xs font-bold border-2 transition-colors ${
								category === 'blessing'
									? 'bg-[#B39DDB] border-[#B39DDB] text-white'
									: 'border-slate-200 text-slate-500 hover:border-[#B39DDB]/50'
							}`}>
							🙏 Blessing
						</button>
						<button type='button' onClick={() => setCategory('advice')}
							className={`flex-1 py-2 rounded-full text-xs font-bold border-2 transition-colors ${
								category === 'advice'
									? 'bg-[#6CC9C9] border-[#6CC9C9] text-white'
									: 'border-slate-200 text-slate-500 hover:border-[#6CC9C9]/50'
							}`}>
							💡 Advice
						</button>
					</div>
					<input type='text' placeholder='Your name' required value={authorName}
						onChange={e => setAuthorName(e.target.value)}
						className='w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#B39DDB] transition-colors' />
					<textarea placeholder='Write your blessing or advice for baby...' required rows={3} value={message}
						onChange={e => setMessage(e.target.value)}
						className='w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-3xl bg-slate-50 focus:outline-none focus:border-[#B39DDB] resize-none transition-colors' />
					{submitError && <p className='text-xs text-red-500 font-semibold px-2'>{submitError}</p>}
					<button type='submit' disabled={isSubmitting}
						className='w-full py-3 rounded-full font-poppins font-bold text-white bg-[#B39DDB] hover:bg-[#a48dcb] active:scale-95 transition-all disabled:opacity-60'>
						{isSubmitting ? 'Sending...' : 'Send with Love 🙏'}
					</button>
				</form>
			</div>

			<div className='flex gap-2'>
				{([['all', 'All'], ['blessing', '🙏 Blessings'], ['advice', '💡 Advice']] as const).map(([id, label]) => (
					<button key={id} onClick={() => setFilter(id)}
						className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
							filter === id
								? 'bg-[#1A1A2E] border-[#1A1A2E] text-white'
								: 'bg-white border-slate-200 text-slate-500'
						}`}>
						{label}
					</button>
				))}
			</div>

			{isLoading && (
				<div className='flex justify-center py-8'>
					<div className='w-8 h-8 border-2 border-[#B39DDB] border-t-transparent rounded-full animate-spin' />
				</div>
			)}
			{loadError && (
				<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center'>
					{loadError}
				</div>
			)}
			{!isLoading && !loadError && wishes.length === 0 && (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-4xl mb-3'>🙏</div>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No blessings yet</p>
					<p className='text-xs text-[#6B7280] font-semibold mt-1'>Be the first to bless the little one!</p>
				</div>
			)}
			{wishes
				.filter(w => filter === 'all' || w.category === filter)
				.map((wish, i) => (
				<div key={wish.id} className={`rounded-3xl border p-5 ${COLORS[i % COLORS.length]}`}>
					<div className='flex items-center justify-between mb-2'>
						<span className='font-poppins font-bold text-[#1A1A2E] text-sm'>{wish.author_name}</span>
						<div className='flex items-center gap-2'>
							{wish.category && (
								<span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#6B7280]'>
									{wish.category === 'blessing' ? '🙏 Blessing' : '💡 Advice'}
								</span>
							)}
							<span className='text-[10px] text-[#6B7280] font-semibold'>{relativeTime(wish.created_at)}</span>
						</div>
					</div>
					<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed'>{wish.message}</p>
					{!pendingIds.has(wish.id) && <ReactionBar wishId={wish.id} />}
				</div>
			))}
		</div>
	);
};

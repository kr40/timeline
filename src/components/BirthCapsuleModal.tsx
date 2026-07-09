import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';

type Props = {
	onClose: () => void;
	onSaved: (capsule: BirthCapsule) => void;
};

export const BirthCapsuleModal = ({ onClose, onSaved }: Props) => {
	const [form, setForm] = useState({
		birth_date:       '',
		birth_time:       '',
		weight_kg:        '',
		length_cm:        '',
		location:         '',
		baby_name:        '',
		name_meaning:     '',
		nicknames:        '',
		letter_to_baby:   '',
		visitors:         '',
		headlines:        '',
		sports_results:   '',
		top_song:         '',
		top_movie:        '',
		famous_birthdays: '',
		weather:          '',
		notes:            '',
	});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		window.addEventListener('keydown', h);
		return () => window.removeEventListener('keydown', h);
	}, [onClose]);

	const lines = (text: string): string[] =>
		text.split('\n').map(l => l.trim()).filter(Boolean);

	const set = (key: keyof typeof form) => (
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm(prev => ({ ...prev, [key]: e.target.value }))
	);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setSaveError(null);
		try {
			const payload = {
				birth_date:       form.birth_date     || null,
				birth_time:       form.birth_time     || null,
				weight_kg:        form.weight_kg      ? parseFloat(form.weight_kg) : null,
				length_cm:        form.length_cm      ? parseFloat(form.length_cm) : null,
				location:         form.location       || null,
				baby_name:        form.baby_name      || null,
				name_meaning:     form.name_meaning   || null,
				nicknames:        lines(form.nicknames),
				letter_to_baby:   form.letter_to_baby || null,
				visitors:         lines(form.visitors),
				headlines:        lines(form.headlines),
				sports_results:   lines(form.sports_results),
				top_song:         form.top_song       || null,
				top_movie:        form.top_movie      || null,
				famous_birthdays: lines(form.famous_birthdays),
				weather:          form.weather        || null,
				notes:            form.notes          || null,
			};
			const { data, error } = await supabase.from('birth_capsule').insert(payload).select().single();
			if (error) throw error;
			onSaved(data);
		} catch (err: unknown) {
			setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const inputCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#FF8C69] transition-colors';
	const textareaCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:border-[#FF8C69] resize-none transition-colors';
	const labelCls = 'block text-xs font-bold text-[#6B7280] mb-1.5 pl-1';
	const sectionLabelCls = 'font-poppins font-bold text-sm text-[#1A1A2E] pt-2';

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm'
			onClick={onClose}>
			<div role='dialog' aria-modal='true' aria-labelledby='capsule-title'
				className='bg-white w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden'
				onClick={e => e.stopPropagation()}>
				<div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0'>
					<h2 id='capsule-title' className='font-poppins font-extrabold text-lg text-[#1A1A2E]'>Birth Capsule 🌟</h2>
					<button onClick={onClose} className='p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors'>
						<X className='w-5 h-5' />
					</button>
				</div>
				<form onSubmit={handleSubmit} className='p-6 space-y-4 overflow-y-auto'>
					<p className='text-xs font-bold text-[#FF8C69] bg-[#FF8C69]/10 rounded-2xl px-4 py-2.5'>
						⚠️ This can only be filled in once — it will be permanently sealed after saving.
					</p>

					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Birth Date</label><input className={inputCls} value={form.birth_date} onChange={set('birth_date')} placeholder='2026-11-09' /></div>
						<div><label className={labelCls}>Birth Time</label><input className={inputCls} value={form.birth_time} onChange={set('birth_time')} placeholder='3:42 AM' /></div>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Weight (kg)</label><input className={inputCls} value={form.weight_kg} onChange={set('weight_kg')} placeholder='3.4' /></div>
						<div><label className={labelCls}>Length (cm)</label><input className={inputCls} value={form.length_cm} onChange={set('length_cm')} placeholder='50' /></div>
					</div>
					<div><label className={labelCls}>Location</label><input className={inputCls} value={form.location} onChange={set('location')} placeholder='Dubai Hospital' /></div>

					<p className={sectionLabelCls}>Baby's Identity 👶</p>
					<div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.baby_name} onChange={set('baby_name')} placeholder='Baby full name' /></div>
					<div><label className={labelCls}>Name Meaning</label><input className={inputCls} value={form.name_meaning} onChange={set('name_meaning')} placeholder='What the name means...' /></div>
					<div><label className={labelCls}>Nicknames (one per line)</label><textarea className={textareaCls} rows={2} value={form.nicknames} onChange={set('nicknames')} placeholder={'Bug\nMunchkin'} /></div>
					<div><label className={labelCls}>Letter to Baby</label><textarea className={textareaCls} rows={4} value={form.letter_to_baby} onChange={set('letter_to_baby')} placeholder='Dear baby...' /></div>
					<div><label className={labelCls}>Who Was There (one per line)</label><textarea className={textareaCls} rows={3} value={form.visitors} onChange={set('visitors')} placeholder={'Grandma\nGrandpa\nFamily dog Max'} /></div>

					<p className={sectionLabelCls}>The World That Day 🌍</p>
					<div><label className={labelCls}>World Headlines (one per line)</label><textarea className={textareaCls} rows={3} value={form.headlines} onChange={set('headlines')} placeholder={'Headline 1\nHeadline 2'} /></div>
					<div><label className={labelCls}>Sports Results (one per line)</label><textarea className={textareaCls} rows={3} value={form.sports_results} onChange={set('sports_results')} placeholder={'Team A won...'} /></div>
					<div><label className={labelCls}>#1 Song</label><input className={inputCls} value={form.top_song} onChange={set('top_song')} placeholder='Song – Artist' /></div>
					<div><label className={labelCls}>#1 Movie</label><input className={inputCls} value={form.top_movie} onChange={set('top_movie')} placeholder='Movie title' /></div>
					<div><label className={labelCls}>Famous Birthdays — same date (one per line)</label><textarea className={textareaCls} rows={3} value={form.famous_birthdays} onChange={set('famous_birthdays')} placeholder={'Name (born year)'} /></div>
					<div><label className={labelCls}>Weather</label><input className={inputCls} value={form.weather} onChange={set('weather')} placeholder='Sunny, 28°C in Dubai' /></div>
					<div><label className={labelCls}>Notes</label><textarea className={textareaCls} rows={3} value={form.notes} onChange={set('notes')} placeholder='Anything else...' /></div>

					{saveError && <p className='text-xs text-red-500 font-semibold px-2'>{saveError}</p>}
					<button type='submit' disabled={isSaving}
						className='w-full py-3.5 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all disabled:opacity-60'>
						{isSaving ? 'Saving...' : 'Seal Birth Capsule 🌟'}
					</button>
				</form>
			</div>
		</div>
	);
};

import { FormEvent, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BirthCapsule } from '../../types';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';

type Props = { onSaved: (capsule: BirthCapsule) => void };

export const BirthCapsuleForm = ({ onSaved }: Props) => {
	const [form, setForm] = useState({
		birth_date: '', birth_time: '', weight_kg: '', length_cm: '', location: '',
		baby_name: '', name_meaning: '', nicknames: '', letter_to_baby: '', visitors: '',
		headlines: '', sports_results: '', top_song: '', top_movie: '', famous_birthdays: '',
		weather: '', notes: '',
	});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const lines = (text: string): string[] => text.split('\n').map(l => l.trim()).filter(Boolean);

	const set = (key: keyof typeof form) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));

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
			setSaveError(errorMessage(err, "Couldn't seal the capsule. Try again?"));
		} finally {
			setIsSaving(false);
		}
	};

	const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
		<div>
			<label className='field-label' htmlFor={`capsule-${key}`}>{label}</label>
			<input id={`capsule-${key}`} className='field' value={form[key]} onChange={set(key)} {...props} />
		</div>
	);

	const area = (key: keyof typeof form, label: string, placeholder: string, rows = 3) => (
		<div>
			<label className='field-label' htmlFor={`capsule-${key}`}>{label}</label>
			<textarea id={`capsule-${key}`} className='field resize-none' rows={rows} placeholder={placeholder} value={form[key]} onChange={set(key)} />
		</div>
	);

	const heading = (emoji: Parameters<typeof Emoji>[0]['name'], text: string) => (
		<h3 className='flex items-center gap-2 pt-2 font-display text-[17px] font-extrabold'>
			<Emoji name={emoji} size={24} />
			{text}
		</h3>
	);

	return (
		<form onSubmit={e => void handleSubmit(e)} className='space-y-4 pb-2'>
			<p className='rounded-2xl border-2 border-ink bg-butter px-4 py-3 text-sm font-bold'>
				This can only be filled in once. It's sealed for good after you save.
			</p>

			{heading('baby', 'The big day')}
			<div className='grid grid-cols-2 gap-3'>
				{field('birth_date', 'Birth date', { type: 'date' })}
				{field('birth_time', 'Birth time', { placeholder: '3:42 AM' })}
			</div>
			<div className='grid grid-cols-2 gap-3'>
				{field('weight_kg', 'Weight (kg)', { inputMode: 'decimal', placeholder: '3.4' })}
				{field('length_cm', 'Length (cm)', { inputMode: 'decimal', placeholder: '50' })}
			</div>
			{field('location', 'Where', { placeholder: 'Hospital, city' })}

			{heading('ribbon', "Baby's identity")}
			{field('baby_name', 'Full name', { placeholder: "Baby's full name" })}
			{field('name_meaning', 'What the name means', { placeholder: 'The story behind it…' })}
			{area('nicknames', 'Nicknames (one per line)', 'Bug\nMunchkin', 2)}
			{area('letter_to_baby', 'Letter to baby', 'Dear little one…', 5)}
			{area('visitors', 'Who was there (one per line)', 'Nani\nDadaji')}

			{heading('newspaper', 'The world that day')}
			{area('headlines', 'World headlines (one per line)', 'Headline one\nHeadline two')}
			{area('sports_results', 'Sports results (one per line)', 'India won…')}
			{field('top_song', '#1 song', { placeholder: 'Song – Artist' })}
			{field('top_movie', '#1 movie', { placeholder: 'Movie title' })}
			{area('famous_birthdays', 'Famous birthdays — same date (one per line)', 'Name (born year)')}
			{field('weather', 'Weather', { placeholder: 'Sunny, 28°C' })}
			{area('notes', 'Anything else', 'Notes for the future…')}

			{saveError && <ErrorNote>{saveError}</ErrorNote>}
			<Button type='submit' tone='butter' size='lg' block disabled={isSaving}>
				<Emoji name='ribbon' size={22} />
				{isSaving ? 'Sealing…' : 'Seal the birth capsule'}
			</Button>
		</form>
	);
};

import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { saveGuestName, useGuestName } from '../../hooks/useGuestName';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';

export type BlessingDraft = { name: string; message: string; category: 'blessing' | 'advice' };

const OPTIONS = [
	{ id: 'blessing', label: 'Blessing', emoji: 'folded-hands', bg: 'bg-lav' },
	{ id: 'advice',   label: 'Advice',   emoji: 'light-bulb',   bg: 'bg-mint' },
] as const;

/** The blessing form, shown inside a Sheet. `onSend` resolves when saved and throws on failure. */
export const ComposeBlessing = ({ onSend }: { onSend: (draft: BlessingDraft) => Promise<void> }) => {
	const remembered = useGuestName();
	const [category, setCategory] = useState<'blessing' | 'advice'>('blessing');
	const [name, setName] = useState(remembered);
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		const n = name.trim();
		const m = message.trim();
		if (!n || !m) return;
		setBusy(true);
		setError(null);
		try {
			await onSend({ name: n, message: m, category });
			saveGuestName(n);
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't send your blessing. Try again?"));
			setBusy(false);
		}
	};

	return (
		<form onSubmit={e => void submit(e)} className='space-y-4 pb-2'>
			<div role='radiogroup' aria-label='Type' className='grid grid-cols-2 gap-2.5'>
				{OPTIONS.map(option => {
					const active = category === option.id;
					return (
						<motion.button
							key={option.id}
							type='button'
							role='radio'
							aria-checked={active}
							onClick={() => setCategory(option.id)}
							whileTap={{ scale: 0.96 }}
							className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-ink px-3 py-3 text-sm font-extrabold transition-colors ${
								active ? `${option.bg} shadow-sticker-sm` : 'bg-white text-muted'
							}`}
						>
							<Emoji name={option.emoji} size={22} />
							{option.label}
						</motion.button>
					);
				})}
			</div>
			<div>
				<label className='field-label' htmlFor='blessing-name'>Your name</label>
				<input id='blessing-name' className='field' autoComplete='name' required value={name} onChange={e => setName(e.target.value)} />
			</div>
			<div>
				<label className='field-label' htmlFor='blessing-message'>{category === 'blessing' ? 'Your blessing' : 'Your advice'}</label>
				<textarea
					id='blessing-message'
					className='field min-h-[130px] resize-none'
					required
					placeholder={category === 'blessing' ? 'May you always be surrounded by love…' : 'Sleep when the baby sleeps…'}
					value={message}
					onChange={e => setMessage(e.target.value)}
				/>
			</div>
			{error && <ErrorNote>{error}</ErrorNote>}
			<Button type='submit' tone='butter' size='lg' block disabled={busy || !name.trim() || !message.trim()}>
				<Emoji name='love-letter' size={22} />
				{busy ? 'Sending…' : 'Send with love'}
			</Button>
		</form>
	);
};

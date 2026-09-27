import { PencilSimple } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { EDD } from '../../config';
import { GUESS_RANGE, formatGuessDate, type useGuesses } from '../../hooks/useGuesses';
import { saveGuestName, useGuestName } from '../../hooks/useGuestName';
import { burstFrom, celebrate } from '../../lib/celebrate';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';
import { Spinner } from '../ui/Spinner';

type Props = { data: ReturnType<typeof useGuesses>; isUnlocked: boolean };

export const GuessPanel = ({ data, isUnlocked }: Props) => {
	const { guesses, loading, myGuess, hasWinner, submit, revealWinner } = data;
	const remembered = useGuestName();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(myGuess?.guesser_name ?? remembered);
	const [date, setDate] = useState(myGuess?.guess_date ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (loading) return <Spinner label='Loading guesses' />;

	const showForm = !myGuess || editing;
	const due = new Date(`${EDD}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name.trim() || !date) return;
		const submitButton = e.currentTarget.querySelector('button[type=submit]');
		setBusy(true);
		setError(null);
		try {
			await submit(name.trim(), date);
			saveGuestName(name);
			burstFrom(submitButton);
			setEditing(false);
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't save your guess. Try again?"));
		} finally {
			setBusy(false);
		}
	};

	const onReveal = async () => {
		setError(null);
		try {
			await revealWinner();
			celebrate();
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't reveal the winner. Try again?"));
		}
	};

	return (
		<div className='space-y-4'>
			<p className='text-sm font-semibold text-muted'>Pick the day you think baby arrives. The due date is {due}.</p>

			{showForm ? (
				<form onSubmit={e => void onSubmit(e)} className='space-y-3'>
					<div>
						<label className='field-label' htmlFor='guess-name'>Your name</label>
						<input id='guess-name' className='field' autoComplete='name' required value={name} onChange={e => setName(e.target.value)} />
					</div>
					<div>
						<label className='field-label' htmlFor='guess-date'>Your guess</label>
						<input
							id='guess-date'
							type='date'
							className='field'
							required
							min={GUESS_RANGE.min}
							max={GUESS_RANGE.max}
							value={date}
							onChange={e => setDate(e.target.value)}
						/>
					</div>
					<div className='flex gap-2.5'>
						{editing && (
							<Button tone='white' size='lg' onClick={() => { setEditing(false); setError(null); }}>
								Cancel
							</Button>
						)}
						<Button type='submit' tone='butter' size='lg' className='flex-1' disabled={busy || !name.trim() || !date}>
							<Emoji name='bullseye' size={22} />
							{busy ? 'Saving…' : 'Place my guess'}
						</Button>
					</div>
				</form>
			) : myGuess && (
				<div className='flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-butter px-4 py-3 shadow-sticker-sm'>
					<div>
						<p className='eyebrow text-ink/60'>Your guess</p>
						<p className='font-display text-display-md font-extrabold'>{formatGuessDate(myGuess.guess_date)}</p>
					</div>
					<Button
						size='sm'
						tone='white'
						onClick={() => { setName(myGuess.guesser_name); setDate(myGuess.guess_date); setEditing(true); }}
					>
						<PencilSimple size={14} weight='bold' />
						Edit
					</Button>
				</div>
			)}

			{isUnlocked && !hasWinner && guesses.length > 0 && (
				<Button tone='pink' block onClick={() => void onReveal()}>
					<Emoji name='party-popper' size={20} />
					Reveal the winner
				</Button>
			)}

			{error && <ErrorNote>{error}</ErrorNote>}

			<section aria-label='All guesses'>
				<p className='field-label'>{guesses.length === 1 ? '1 guess' : `${guesses.length} guesses`}</p>
				{guesses.length === 0 ? (
					<p className='rounded-2xl border-2 border-dashed border-ink/25 px-4 py-6 text-center text-sm font-bold text-muted'>
						No guesses yet. Be the first!
					</p>
				) : (
					<ul className='space-y-2'>
						{guesses.map((g, i) => (
							<motion.li
								key={g.id}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: Math.min(i * 0.03, 0.4) }}
								className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 ${
									g.is_winner ? 'border-ink bg-butter shadow-sticker-sm' : 'border-ink/15 bg-white'
								}`}
							>
								<div className='min-w-0'>
									<p className='truncate text-xs font-bold text-muted'>{g.guesser_name}</p>
									<p className='font-display text-base font-extrabold'>{formatGuessDate(g.guess_date)}</p>
								</div>
								{g.is_winner && <Emoji name='crown' size={28} alt='Winner' />}
							</motion.li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { Guess } from '../../types';

type GameState = 'loading' | 'form' | 'voted';

const fmtDate = (d: string) =>
	new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const GuessingGame = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const voterId  = useRef(getVoterId());
	const [gameState, setGameState] = useState<GameState>('loading');
	const [guesses,   setGuesses]   = useState<Guess[]>([]);
	const [myGuess,   setMyGuess]   = useState<Guess | null>(null);
	const [name,      setName]      = useState('');
	const [date,      setDate]      = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error,     setError]     = useState<string | null>(null);

	const hasWinner = guesses.some(g => g.is_winner);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('guesses')
					.select('*')
					.order('created_at', { ascending: true });
				const rows = data ?? [];
				setGuesses(rows);
				const mine = rows.find(g => g.voter_id === voterId.current);
				if (mine) { setMyGuess(mine); setGameState('voted'); }
				else setGameState('form');
			} catch {
				setGameState('form');
			}
		})();
	}, []);

	const submit = async () => {
		if (!name.trim() || !date) return;
		setSubmitting(true);
		setError(null);
		try {
			const { data, error: err } = await supabase
				.from('guesses')
				.upsert(
					{ voter_id: voterId.current, guesser_name: name.trim(), guess_date: date, is_winner: false },
					{ onConflict: 'voter_id' },
				)
				.select()
				.single();
			if (err) throw err;
			setMyGuess(data);
			setGuesses(prev => {
				const without = prev.filter(g => g.voter_id !== voterId.current);
				return [...without, data].sort(
					(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
				);
			});
			setGameState('voted');
			setIsEditing(false);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to save guess');
		} finally {
			setSubmitting(false);
		}
	};

	const revealWinner = async () => {
		const { data: capsule } = await supabase
			.from('birth_capsule')
			.select('birth_date')
			.limit(1)
			.maybeSingle();
		if (!capsule?.birth_date) {
			setError('No birth date found in Baby Book. Fill it in first.');
			return;
		}
		const birthDate = capsule.birth_date as string;
		await supabase.from('guesses').update({ is_winner: true }).eq('guess_date', birthDate);
		setGuesses(prev => prev.map(g => ({ ...g, is_winner: g.guess_date === birthDate })));
	};

	if (gameState === 'loading') return null;

	return (
		<div className='bg-white rounded-3xl shadow-md p-5 mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-1'>Guess the Birthday 🎯</h2>
			<p className='text-sm text-slate-400 mb-4'>When do you think baby will arrive?</p>

			{/* Form — shown when no guess yet, or when editing */}
			{(gameState === 'form' || isEditing) && (
				<div className='space-y-3 mb-5'>
					<input
						type='text'
						placeholder='Your name'
						value={name}
						onChange={e => setName(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69]'
					/>
					<input
						type='date'
						value={date}
						onChange={e => setDate(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69]'
					/>
					{error && <p className='text-xs text-red-500 px-2'>{error}</p>}
					<button
						onClick={submit}
						disabled={submitting || !name.trim() || !date}
						className='w-full rounded-full bg-[#FF8C69] text-white font-bold py-3 text-sm disabled:opacity-50 transition-opacity'>
						{submitting ? 'Saving…' : 'Place My Guess 🎯'}
					</button>
					{isEditing && (
						<button
							onClick={() => { setIsEditing(false); setError(null); }}
							className='w-full rounded-full border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-500'>
							Cancel
						</button>
					)}
				</div>
			)}

			{/* My guess pill — shown after voting (not editing) */}
			{gameState === 'voted' && !isEditing && myGuess && (
				<div className='flex items-center justify-between bg-[#FF8C69]/10 rounded-2xl px-4 py-3 mb-4'>
					<div>
						<p className='text-xs text-slate-400 font-nunito'>Your guess</p>
						<p className='font-poppins font-bold text-[#FF8C69]'>{fmtDate(myGuess.guess_date)}</p>
					</div>
					<button
						onClick={() => { setName(myGuess.guesser_name); setDate(myGuess.guess_date); setIsEditing(true); }}
						className='text-xs text-slate-400 hover:text-[#FF8C69] transition-colors'>
						✏️ Edit
					</button>
				</div>
			)}

			{/* Reveal winner button — unlocked only, no winner yet */}
			{isUnlocked && !hasWinner && gameState === 'voted' && !isEditing && (
				<button
					onClick={revealWinner}
					className='w-full rounded-full border-2 border-[#FF8C69] text-[#FF8C69] font-bold py-2.5 text-sm mb-4 hover:bg-[#FF8C69]/5 transition-colors'>
					Reveal Winner 🎉
				</button>
			)}

			{/* Guesses leaderboard */}
			{guesses.length > 0 && (
				<div>
					<p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>
						{guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
					</p>
					<div className='space-y-2 max-h-48 overflow-y-auto'>
						{guesses.map(g => (
							<div
								key={g.id}
								className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${
									g.is_winner ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-50'
								}`}>
								<div>
									<span className='text-sm font-bold text-[#1A1A2E]'>{g.guesser_name}</span>
									<span className='text-xs text-slate-400 ml-2'>{fmtDate(g.guess_date)}</span>
								</div>
								{g.is_winner && <span className='text-lg'>🏆</span>}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

import { motion } from 'motion/react';
import type { FunPollId } from '../../data/funPolls';
import { scoreFun, type SideResult } from '../../data/polls';
import { formatGuessDate } from '../../hooks/useGuesses';
import type { Guess } from '../../types';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';

export const GuessTile = ({ count, myGuess, onOpen }: { count: number; myGuess: Guess | null; onOpen: () => void }) => (
	<Card tone='butter' interactive onClick={onOpen} aria-label='Open guess the day' style={{ rotate: -1.2 }} className='p-3.5'>
		<Emoji name='tear-off-calendar' size={38} />
		<p className='mt-2 font-display text-[17px] font-extrabold leading-tight'>Guess the day</p>
		<p className='mt-0.5 text-xs font-bold text-ink/65'>
			{myGuess ? `You picked ${formatGuessDate(myGuess.guess_date)}` : count === 1 ? '1 guess so far' : `${count} guesses so far`}
		</p>
	</Card>
);

export const ScoreTile = ({ fun, onOpen }: { fun: Record<FunPollId, SideResult>; onOpen: () => void }) => {
	const { aditi, kartik, started } = scoreFun(fun);
	const hasLeader = aditi !== kartik;
	return (
		<Card tone='lav' interactive onClick={onOpen} aria-label='Open Aditi vs Kartik scores' style={{ rotate: 1.2 }} className='p-3.5'>
			<motion.div
				className='inline-block'
				animate={hasLeader ? { rotate: [0, -12, 10, 0], y: [0, -3, 0] } : { rotate: 0, y: 0 }}
				transition={{ duration: 1, repeat: hasLeader ? Infinity : 0, repeatDelay: 2.5 }}
			>
				<Emoji name='crown' size={38} />
			</motion.div>
			<p className='mt-2 font-display text-[17px] font-extrabold leading-tight tabular-nums'>
				{started ? `${aditi} – ${kartik}` : 'Who wins?'}
			</p>
			<p className='mt-0.5 text-xs font-bold text-ink/65'>Aditi vs Kartik</p>
		</Card>
	);
};

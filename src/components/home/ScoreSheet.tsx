import { motion } from 'motion/react';
import { FUN_POLLS, type FunPollId } from '../../data/funPolls';
import { scoreFun, type SideResult } from '../../data/polls';
import { BAR } from '../../lib/palette';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Emoji } from '../ui/Emoji';
import { ResultBar } from '../ui/ResultBar';

const SideScore = ({ name, score, bg, leading }: { name: string; score: number; bg: string; leading: boolean }) => (
	<div className='flex flex-col items-center'>
		<div className='h-9'>
			{leading && (
				<motion.div
					initial={{ y: -12, opacity: 0, rotate: -20 }}
					animate={{ y: 0, opacity: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 400, damping: 14 }}
				>
					<Emoji name='crown' size={32} />
				</motion.div>
			)}
		</div>
		<div className={`grid h-16 w-16 place-items-center rounded-full border-2 border-ink shadow-sticker-sm ${bg}`}>
			<AnimatedNumber value={score} className='font-display text-3xl font-extrabold' />
		</div>
		<p className='mt-2 font-display text-base font-extrabold'>{name}</p>
	</div>
);

export const ScoreSheet = ({ fun }: { fun: Record<FunPollId, SideResult> }) => {
	const { aditi, kartik } = scoreFun(fun);
	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-card border-2 border-ink bg-white p-4 text-center shadow-sticker-sm'>
				<SideScore name='Aditi' score={aditi} bg='bg-lav' leading={aditi > kartik} />
				<span className='font-display text-lg font-extrabold text-muted'>vs</span>
				<SideScore name='Kartik' score={kartik} bg='bg-mint' leading={kartik > aditi} />
			</div>
			<p className='text-center text-xs font-bold text-muted'>Each poll is a point for whoever's leading it.</p>
			{FUN_POLLS.map(poll => {
				const { counts, mine } = fun[poll.id];
				const total = counts.aditi + counts.kartik;
				return (
					<div key={poll.id} className='rounded-2xl border-2 border-ink bg-white p-3.5'>
						<div className='mb-3 flex items-center gap-2.5'>
							<Emoji name={poll.emoji} size={30} />
							<p className='font-display text-base font-extrabold leading-snug'>{poll.question}</p>
						</div>
						<div className='space-y-2'>
							<ResultBar label={poll.aditiLabel} count={counts.aditi} total={total} color={BAR.aditi} mine={mine === 'aditi'} />
							<ResultBar label={poll.kartikLabel} count={counts.kartik} total={total} color={BAR.kartik} mine={mine === 'kartik'} />
						</div>
						<p className='mt-1.5 text-right text-[11px] font-bold text-muted'>{total === 1 ? '1 vote' : `${total} votes`}</p>
					</div>
				);
			})}
		</div>
	);
};

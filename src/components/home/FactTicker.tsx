import { CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { getCurrentWeek } from '../../config';
import { getFactsForWeek } from '../../data/weeklyFacts';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';

/** One of this week's three facts; tap to cycle. */
export const FactTicker = () => {
	const { facts } = getFactsForWeek(getCurrentWeek());
	const [index, setIndex] = useState(0);

	return (
		<Card
			interactive
			onClick={() => setIndex(i => (i + 1) % facts.length)}
			aria-label={`Fact ${index + 1} of ${facts.length}: ${facts[index]}. Next fact`}
			className='flex items-center gap-3 px-3.5 py-3'
		>
			<div className='grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-mint'>
				<Emoji name='light-bulb' size={24} eager />
			</div>
			<div className='relative flex min-h-[40px] flex-1 items-center overflow-hidden'>
				<AnimatePresence mode='wait' initial={false}>
					<motion.p
						key={index}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.2 }}
						className='text-[13.5px] font-bold leading-snug'
					>
						{facts[index]}
					</motion.p>
				</AnimatePresence>
			</div>
			<span className='flex shrink-0 items-center gap-0.5 text-xs font-extrabold tabular-nums text-muted'>
				{index + 1}/{facts.length}
				<CaretRight size={12} weight='bold' />
			</span>
		</Card>
	);
};

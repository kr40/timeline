import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { useGuesses } from '../hooks/useGuesses';
import { useLatestMemory } from '../hooks/useLatestMemory';
import { usePolls } from '../hooks/usePolls';
import { riseIn, stagger } from '../lib/motion';
import { Milestone } from '../types';
import { FactTicker } from './home/FactTicker';
import { GuessPanel } from './home/GuessPanel';
import { GuessTile, ScoreTile } from './home/HomeTiles';
import { HeroCard } from './home/HeroCard';
import { LatestMemoryCard } from './home/LatestMemoryCard';
import { PollDeck } from './home/PollDeck';
import { ScoreSheet } from './home/ScoreSheet';
import { MemoryView } from './timeline/MemoryView';
import { Button } from './ui/Button';
import { Emoji } from './ui/Emoji';
import { Sheet } from './ui/Sheet';

type Props = {
	isUnlocked: boolean;
	onImageClick: (images: string[], index: number, title: string) => void;
	onEditMemory: (m: Milestone) => void;
	onOpenTimeline: () => void;
};

export const HomeTab = ({ isUnlocked, onImageClick, onEditMemory, onOpenTimeline }: Props) => {
	const polls = usePolls();
	const guesses = useGuesses();
	const latest = useLatestMemory();
	const [sheet, setSheet] = useState<'guess' | 'score' | 'memory' | null>(null);
	const closeSheet = useCallback(() => setSheet(null), []);

	return (
		<>
			<motion.div variants={stagger} initial='hidden' animate='show' className='space-y-5'>
				<motion.div variants={riseIn}><HeroCard /></motion.div>
				<motion.div variants={riseIn}><FactTicker /></motion.div>
				{latest && (
					<motion.div variants={riseIn}>
						<LatestMemoryCard memory={latest} onOpen={() => setSheet('memory')} />
					</motion.div>
				)}
				<motion.div variants={riseIn}><PollDeck polls={polls} /></motion.div>
				<motion.div variants={riseIn} className='grid grid-cols-2 gap-3.5 pt-1'>
					<GuessTile count={guesses.guesses.length} myGuess={guesses.myGuess} onOpen={() => setSheet('guess')} />
					<ScoreTile fun={polls.state.fun} onOpen={() => setSheet('score')} />
				</motion.div>
			</motion.div>

			<Sheet
				open={sheet === 'guess'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Guess the day <Emoji name='tear-off-calendar' size={26} /></span>}
			>
				<GuessPanel data={guesses} isUnlocked={isUnlocked} />
			</Sheet>
			<Sheet
				open={sheet === 'score'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Aditi vs Kartik <Emoji name='crown' size={26} /></span>}
			>
				<ScoreSheet fun={polls.state.fun} />
			</Sheet>
			<Sheet open={sheet === 'memory'} onClose={closeSheet} title={latest?.title ?? ''}>
				{latest && (
					<div className='space-y-4'>
						<MemoryView
							milestone={latest}
							isUnlocked={isUnlocked}
							onImageClick={(images, index) => onImageClick(images, index, latest.title)}
							onEdit={() => { setSheet(null); onEditMemory(latest); }}
						/>
						<Button tone='white' block onClick={() => { setSheet(null); onOpenTimeline(); }}>
							See the whole story
							<ArrowRight size={16} weight='bold' />
						</Button>
					</div>
				)}
			</Sheet>
		</>
	);
};

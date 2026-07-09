import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { GuessingGame } from './home/GuessingGame';
import { PollWidget } from './home/PollWidget';
import { TraitPolls } from './home/TraitPolls';
import { WeeklyFacts } from './home/WeeklyFacts';

export const HomeTab = ({ isUnlocked }: { isUnlocked: boolean }) => (
	<div className='space-y-4 pb-4'>
		<CountdownHero />
		<FruitTracker />
		<WeeklyFacts />
		<PollWidget />
		<TraitPolls />
		<GuessingGame isUnlocked={isUnlocked} />
	</div>
);

import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { PollWidget } from './home/PollWidget';
import { TraitPolls } from './home/TraitPolls';
import { WeeklyFacts } from './home/WeeklyFacts';

export const HomeTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	// isUnlocked will be passed to GuessingGame in Task 3
	void isUnlocked;
	return (
		<div className='space-y-4 pb-4'>
			<CountdownHero />
			<FruitTracker />
			<PollWidget />
			<TraitPolls />
			{/* GuessingGame added in Task 3 */}
			<WeeklyFacts />
		</div>
	);
};

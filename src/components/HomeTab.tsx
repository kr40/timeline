import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { WeeklyFacts } from './home/WeeklyFacts';

export const HomeTab = () => (
	<div className='space-y-4 pb-4'>
		<CountdownHero />
		<FruitTracker />
		<WeeklyFacts />
		{/* PollWidget added in Task 5 */}
	</div>
);

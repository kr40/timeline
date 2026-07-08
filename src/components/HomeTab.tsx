import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { PollWidget } from './home/PollWidget';
import { WeeklyFacts } from './home/WeeklyFacts';

export const HomeTab = () => (
	<div className='space-y-4 pb-4'>
		<CountdownHero />
		<FruitTracker />
		<PollWidget />
		<WeeklyFacts />
	</div>
);

import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { FunPolls } from './home/FunPolls';
import { GamesHero } from './home/GamesHero';
import { GuessingGame } from './home/GuessingGame';
import { PollWidget } from './home/PollWidget';
import { TraitPolls } from './home/TraitPolls';
import { WeeklyFacts } from './home/WeeklyFacts';

type Props = { isUnlocked: boolean; preShower: boolean };

export const HomeTab = ({ isUnlocked, preShower }: Props) => (
	<div className='space-y-4 pb-4'>
		{preShower ? (
			<GamesHero />
		) : (
			<>
				<CountdownHero />
				<FruitTracker />
				<WeeklyFacts />
			</>
		)}
		<PollWidget />
		<TraitPolls />
		<FunPolls />
		<GuessingGame isUnlocked={isUnlocked} />
	</div>
);

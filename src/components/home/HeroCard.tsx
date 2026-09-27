import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';
import { EDD, getCurrentWeek, getDaysUntilEDD } from '../../config';
import { getFruitForWeek } from '../../data/fruitData';
import { fruitImage } from '../../data/fruitImages';
import { getBirthstone, getZodiacSign } from '../../data/zodiacData';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';

const headlineFor = (week: number) =>
	week <= 12 ? 'Tiny but mighty' :
	week <= 26 ? 'Growing every day' :
	week <= 36 ? 'Almost here!' :
	'Any day now!';

const withArticle = (name: string) => `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name.toLowerCase()}`;

const formatWeight = (grams: number) => (grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${grams} g`);

const CHIP = 'inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-extrabold';

const ProgressRing = ({ progress, children }: { progress: number; children: ReactNode }) => {
	const reduce = useReducedMotion();
	const size = 104;
	const stroke = 9;
	const r = (size - stroke) / 2;
	return (
		<div className='relative grid h-[104px] w-[104px] shrink-0 place-items-center'>
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className='absolute inset-0 -rotate-90' aria-hidden>
				<circle cx={size / 2} cy={size / 2} r={r} fill='#fff' stroke='#F3C4B2' strokeWidth={stroke} />
				<motion.circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill='none'
					stroke='#2B2340'
					strokeWidth={stroke}
					strokeLinecap='round'
					initial={{ pathLength: reduce ? progress : 0 }}
					animate={{ pathLength: progress }}
					transition={{ duration: 1.4, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
				/>
			</svg>
			<div className='relative flex flex-col items-center'>{children}</div>
		</div>
	);
};

/** Countdown ring + week + fruit of the week, in one card. */
export const HeroCard = () => {
	const days = getDaysUntilEDD();
	const week = getCurrentWeek();
	const fruit = getFruitForWeek(week);

	if (days <= 0) {
		return (
			<Card tone='peach' className='flex items-center gap-4 p-5'>
				<motion.div
					animate={{ rotate: [-6, 6, -6], y: [0, -4, 0] }}
					transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
				>
					<Emoji name='baby' size={76} eager />
				</motion.div>
				<div>
					<p className='eyebrow text-ink/60'>Welcome to the world</p>
					<p className='mt-1 font-display text-display-xl font-extrabold'>Baby is here!</p>
				</div>
			</Card>
		);
	}

	const due = new Date(`${EDD}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	const zodiac = getZodiacSign(EDD);
	const stone = getBirthstone(EDD);
	const weekday = new Date(`${EDD}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });

	return (
		<Card tone='peach' className='p-4 sm:p-5'>
			<div className='flex items-center gap-4 sm:gap-5'>
				<ProgressRing progress={Math.min(1, Math.max(0.03, week / 40))}>
					<AnimatedNumber value={days} className='font-display text-[32px] font-extrabold leading-none' />
					<span className='mt-0.5 text-[10px] font-extrabold tracking-wide'>{days === 1 ? 'day to go' : 'days to go'}</span>
				</ProgressRing>
				<div className='min-w-0'>
					<p className='eyebrow text-ink/60'>Week {week} of 40 · Due {due}</p>
					<p className='mt-1 font-display text-display-lg font-extrabold'>{headlineFor(week)}</p>
					<div className='mt-2.5 flex items-center gap-2.5'>
						<motion.div
							className='grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-white'
							animate={{ y: [0, -3, 0], rotate: [-6, 6, -6] }}
							transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
						>
							<Emoji name={fruitImage(fruit)} size={32} eager />
						</motion.div>
						<p className='min-w-0 text-[13px] font-extrabold leading-tight'>
							Size of {withArticle(fruit.fruit)}
							<span className='block text-xs font-bold text-ink/60'>
								{fruit.lengthCm} cm{fruit.weightG > 0 ? ` · ~${formatWeight(fruit.weightG)}` : ''}
							</span>
						</p>
					</div>
				</div>
			</div>
			<div className='mt-3.5 border-t-2 border-dashed border-ink/15 pt-3'>
				<p className='eyebrow text-ink/60'>If baby arrives right on time</p>
				<div className='mt-1.5 flex flex-wrap gap-1.5'>
					<span className={CHIP}><Emoji name='tear-off-calendar' size={16} />{weekday}</span>
					{/* U+FE0E keeps the zodiac glyph as text instead of a coloured emoji tile on iOS. */}
					<span className={CHIP}><span aria-hidden>{zodiac.emoji}{'\uFE0E'}</span>{zodiac.name}</span>
					<span className={CHIP}><Emoji name='gem-stone' size={16} />{stone.name}</span>
				</div>
			</div>
		</Card>
	);
};

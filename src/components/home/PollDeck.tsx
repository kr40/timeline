import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { POLL_ITEMS, type Gender, type PollItem, type PollsState, type Side } from '../../data/polls';
import { saveGuestName, useGuestName } from '../../hooks/useGuestName';
import type { usePolls } from '../../hooks/usePolls';
import { burstFrom } from '../../lib/celebrate';
import { BAR } from '../../lib/palette';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';
import { ResultBar } from '../ui/ResultBar';
import { Spinner } from '../ui/Spinner';

type Polls = ReturnType<typeof usePolls>;
type ClickEvent = React.MouseEvent<HTMLButtonElement>;

const cardVariants = {
	enter:  (dir: number) => ({ x: dir * 80, opacity: 0, rotate: dir * 5, scale: 0.95 }),
	center: { x: 0, opacity: 1, rotate: 0, scale: 1 },
	exit:   (dir: number) => ({ x: dir * -260, opacity: 0, rotate: dir * -12, transition: { duration: 0.28 } }),
};

const mineFor = (state: PollsState, item: PollItem): string | null =>
	item.kind === 'gender' ? state.gender.mine
		: item.kind === 'trait' ? state.traits[item.id].mine
		: state.fun[item.id].mine;

const GenderOptions = ({ onVote }: { onVote: (e: ClickEvent, choice: Gender, name: string) => void }) => {
	const remembered = useGuestName();
	const [name, setName] = useState(remembered);
	const ready = name.trim().length > 0;
	return (
		<div className='space-y-2.5'>
			<input
				className='field py-2.5'
				placeholder='Your name'
				aria-label='Your name'
				autoComplete='name'
				value={name}
				onChange={e => setName(e.target.value)}
			/>
			<div className='grid grid-cols-2 gap-2.5'>
				<Button tone='sky' disabled={!ready} onClick={e => onVote(e, 'boy', name.trim())}>
					<Emoji name='blue-heart' size={20} />
					Boy
				</Button>
				<Button tone='pink' disabled={!ready} onClick={e => onVote(e, 'girl', name.trim())}>
					<Emoji name='pink-heart' size={20} />
					Girl
				</Button>
			</div>
			{!ready && <p className='text-center text-xs font-bold text-muted'>Add your name to vote</p>}
		</div>
	);
};

const Results = ({ item, state }: { item: PollItem; state: PollsState }) => {
	if (item.kind === 'gender') {
		const { boys, girls, mine } = state.gender;
		const total = boys + girls;
		return (
			<div className='space-y-2.5'>
				<ResultBar label='Boy' count={boys} total={total} color={BAR.boy} mine={mine === 'boy'} />
				<ResultBar label='Girl' count={girls} total={total} color={BAR.girl} mine={mine === 'girl'} />
				<p className='text-right text-[11px] font-bold text-muted'>{total === 1 ? '1 vote' : `${total} votes`}</p>
			</div>
		);
	}
	const result = item.kind === 'trait' ? state.traits[item.id] : state.fun[item.id];
	const total = result.counts.aditi + result.counts.kartik;
	const aditiLabel = item.kind === 'fun' ? item.aditiLabel : 'Aditi';
	const kartikLabel = item.kind === 'fun' ? item.kartikLabel : 'Kartik';
	return (
		<div className='space-y-2.5'>
			<ResultBar label={aditiLabel} count={result.counts.aditi} total={total} color={BAR.aditi} mine={result.mine === 'aditi'} />
			<ResultBar label={kartikLabel} count={result.counts.kartik} total={total} color={BAR.kartik} mine={result.mine === 'kartik'} />
			<p className='text-right text-[11px] font-bold text-muted'>{total === 1 ? '1 vote' : `${total} votes`}</p>
		</div>
	);
};

/** All ten polls as one swipeable card deck. */
export const PollDeck = ({ polls }: { polls: Polls }) => {
	const { state } = polls;
	const [index, setIndex] = useState(0);
	const [dir, setDir] = useState(1);
	const [error, setError] = useState<string | null>(null);
	const opened = useRef(false);
	const advanceTimer = useRef<ReturnType<typeof setTimeout>>();

	// Open on the first question this visitor hasn't answered yet.
	useEffect(() => {
		if (state.loading || opened.current) return;
		opened.current = true;
		const first = POLL_ITEMS.findIndex(item => mineFor(state, item) === null);
		if (first > 0) setIndex(first);
	}, [state]);

	useEffect(() => () => clearTimeout(advanceTimer.current), []);

	const go = (next: number, direction: number) => {
		clearTimeout(advanceTimer.current);
		setDir(direction);
		setError(null);
		setIndex((next + POLL_ITEMS.length) % POLL_ITEMS.length);
	};

	const scheduleAdvance = () => {
		for (let step = 1; step < POLL_ITEMS.length; step++) {
			const j = (index + step) % POLL_ITEMS.length;
			if (mineFor(state, POLL_ITEMS[j]) === null) {
				advanceTimer.current = setTimeout(() => go(j, 1), 1300);
				return;
			}
		}
	};

	const vote = async (e: ClickEvent, action: () => Promise<void>) => {
		burstFrom(e.currentTarget);
		setError(null);
		try {
			await action();
			scheduleAdvance();
		} catch (err: unknown) {
			console.error(err);
			setError("That vote didn't save. Try again?");
		}
	};

	const item = POLL_ITEMS[index];
	const mine = mineFor(state, item);
	const answered = POLL_ITEMS.filter(p => mineFor(state, p) !== null).length;
	const allDone = !state.loading && answered === POLL_ITEMS.length;
	const canDrag = !(item.kind === 'gender' && !mine);

	const onSideVote = (e: ClickEvent, side: Side) => {
		if (item.kind === 'trait') void vote(e, () => polls.voteTrait(item.id, side));
		else if (item.kind === 'fun') void vote(e, () => polls.voteFun(item.id, side));
	};

	const onGenderVote = (e: ClickEvent, choice: Gender, name: string) => {
		saveGuestName(name);
		void vote(e, () => polls.voteGender(choice, name));
	};

	return (
		<section aria-label='Play and predict'>
			<div className='mb-2.5 flex items-center justify-between gap-2 px-1'>
				<h2 className='flex items-center gap-2 font-display text-display-md font-extrabold'>
					Play &amp; predict <Emoji name='game-die' size={24} eager />
				</h2>
				<span className='flex items-center gap-1 text-xs font-extrabold text-muted'>
					{allDone ? (<>All answered <Emoji name='party-popper' size={16} /></>) : `${answered} of ${POLL_ITEMS.length} answered`}
				</span>
			</div>

			<div className='relative'>
				<div aria-hidden className='absolute inset-0 translate-x-[9px] translate-y-[9px] rotate-[2.5deg] rounded-card border-2 border-ink bg-lav' />
				<div aria-hidden className='absolute inset-0 translate-x-[4px] translate-y-[4px] rotate-1 rounded-card border-2 border-ink bg-mint' />
				<div className='relative min-h-[182px]'>
					<AnimatePresence mode='popLayout' initial={false} custom={dir}>
						<motion.div
							key={item.id}
							custom={dir}
							variants={cardVariants}
							initial='enter'
							animate='center'
							exit='exit'
							transition={{ type: 'spring', stiffness: 320, damping: 28 }}
							drag={canDrag ? 'x' : false}
							dragSnapToOrigin
							dragElastic={0.55}
							onDragEnd={(_, info) => {
								if (info.offset.x < -70 || info.velocity.x < -450) go(index + 1, 1);
								else if (info.offset.x > 70 || info.velocity.x > 450) go(index - 1, -1);
							}}
							className={canDrag ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''}
						>
							<Card className='min-h-[182px] p-4'>
								{state.loading ? (
									<Spinner label='Loading polls' />
								) : (
									<>
										<p className='eyebrow text-muted'>{item.tag}</p>
										<div className='mt-1.5 flex items-center gap-3'>
											<motion.div
												className='shrink-0'
												animate={{ rotate: [0, -10, 9, -5, 0] }}
												transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.4 }}
											>
												<Emoji name={item.emoji} size={46} />
											</motion.div>
											<h3 className='font-display text-[19px] font-extrabold leading-snug'>{item.question}</h3>
										</div>
										<div className='mt-4'>
											{mine ? (
												<Results item={item} state={state} />
											) : item.kind === 'gender' ? (
												<GenderOptions onVote={onGenderVote} />
											) : (
												<div className='grid grid-cols-2 gap-2.5'>
													<Button tone='lav' onClick={e => onSideVote(e, 'aditi')}>
														{item.kind === 'fun' ? item.aditiLabel : 'Aditi'}
													</Button>
													<Button tone='mint' onClick={e => onSideVote(e, 'kartik')}>
														{item.kind === 'fun' ? item.kartikLabel : 'Kartik'}
													</Button>
												</div>
											)}
										</div>
									</>
								)}
							</Card>
						</motion.div>
					</AnimatePresence>
				</div>
			</div>

			<div className='mt-4 flex items-center justify-between gap-2 px-1'>
				<button
					type='button'
					aria-label='Previous question'
					onClick={() => go(index - 1, -1)}
					className='press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
				>
					<CaretLeft size={16} weight='bold' />
				</button>
				<div className='flex items-center gap-1.5'>
					{POLL_ITEMS.map((p, i) => (
						<button
							key={p.id}
							type='button'
							aria-label={`Question ${i + 1}`}
							aria-current={i === index}
							onClick={() => go(i, i > index ? 1 : -1)}
							className='grid h-6 place-items-center'
						>
							<motion.span
								className={`block h-2 rounded-full ${i === index ? 'bg-ink' : mineFor(state, p) ? 'bg-ink/35' : 'bg-ink/15'}`}
								animate={{ width: i === index ? 20 : 8 }}
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
							/>
						</button>
					))}
				</div>
				<button
					type='button'
					aria-label='Next question'
					onClick={() => go(index + 1, 1)}
					className='press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
				>
					<CaretRight size={16} weight='bold' />
				</button>
			</div>
			{error && <p role='alert' className='mt-2 text-center text-sm font-bold text-danger'>{error}</p>}
		</section>
	);
};

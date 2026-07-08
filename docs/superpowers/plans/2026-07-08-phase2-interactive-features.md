# Baby Timeline Phase 2 — Interactive Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add trait polls, a birth-date guessing game, emoji reactions on wishes, a Q&A tab, and apply aesthetic consistency across all components.

**Architecture:** Six sequential tasks; each builds on shared utilities from Task 1. All new components follow the existing mobile-first pattern (max-w-[600px], bottom tab bar at `fixed bottom-0`). No routing library — tab state lives in App.tsx.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CSS v3, Supabase (PostgreSQL + realtime), Lucide React icons.

## Global Constraints

- All source files use **tabs** for indentation (not spaces)
- TypeScript strict — no implicit `any`; `catch (err: unknown)` with type guard preferred
- Mobile-first: `max-w-[600px]` centered, `sm:` breakpoints for desktop
- Color palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`, bg `#FAFAFA`, card `#FFFFFF`, text-primary `#1A1A2E`
- Font tokens: `font-poppins` (headings), `font-nunito` (body) — defined in tailwind.config.js
- `getVoterId()` from `src/utils.ts` is the single source of voter identity for ALL interactive features
- EDD sourced only from `src/config.ts`
- No external libraries for fingerprinting, date formatting, or relative timestamps
- Supabase client imported as `import { supabase } from '../supabaseClient'` from `src/components/` or `import { supabase } from '../../supabaseClient'` from `src/components/home/` and `src/components/wishes/`

---

### Task 1: Database Migration + Fingerprint Utility + Types

**Files:**
- Create: `supabase/migrations/20260708_add_phase2_tables.sql`
- Modify: `src/utils.ts` — append `getVoterId()`
- Modify: `src/types.ts` — append 4 new types
- Modify: `src/components/home/PollWidget.tsx` — replace local voter ID fn with `getVoterId()`

**Interfaces:**
- Produces: `getVoterId(): string` exported from `src/utils.ts` — used by Tasks 2, 3, 4, 5
- Produces: `TraitVote`, `Guess`, `WishReaction`, `Question` types in `src/types.ts`

- [ ] **Step 1: Create the migration SQL file**

```sql
-- supabase/migrations/20260708_add_phase2_tables.sql

create table trait_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  trait       text not null check (trait in ('eyes', 'nose', 'hair', 'smile')),
  choice      text not null check (choice in ('mum', 'dad', 'mix')),
  created_at  timestamptz default now(),
  unique (voter_id, trait)
);

create table guesses (
  id            uuid primary key default gen_random_uuid(),
  voter_id      text not null unique,
  guesser_name  text not null,
  guess_date    date not null,
  is_winner     boolean default false,
  created_at    timestamptz default now()
);

create table wish_reactions (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  wish_id     uuid not null references wishes(id) on delete cascade,
  emoji       text not null check (emoji in ('❤️', '😂', '🥹', '🎉')),
  created_at  timestamptz default now(),
  unique (voter_id, wish_id, emoji)
);

create table questions (
  id           uuid primary key default gen_random_uuid(),
  asker_name   text not null,
  question     text not null,
  answer       text,
  answered_at  timestamptz,
  created_at   timestamptz default now()
);
```

- [ ] **Step 2: Run the migration**

Go to your Supabase project → SQL Editor → paste the contents of `supabase/migrations/20260708_add_phase2_tables.sql` → Run. Verify all 4 tables appear in Table Editor.

- [ ] **Step 3: Append `getVoterId()` to `src/utils.ts`**

Append after the existing `formatDate` export:

```ts
export function getVoterId(): string {
	const CACHE_KEY = 'timeline_fp';
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (cached) return cached;
	} catch { /* localStorage unavailable */ }

	const raw = [
		navigator.userAgent,
		String(screen.width),
		String(screen.height),
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		navigator.language,
		navigator.platform,
	].join('|');

	let hash = 5381;
	for (let i = 0; i < raw.length; i++) {
		hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
	}
	const fp = Math.abs(hash).toString(36);

	try { localStorage.setItem(CACHE_KEY, fp); } catch { /* ignore */ }
	return fp;
}
```

- [ ] **Step 4: Append new types to `src/types.ts`**

Append after the existing `BirthCapsule` type:

```ts
export type TraitVote = {
	id: string;
	voter_id: string;
	trait: 'eyes' | 'nose' | 'hair' | 'smile';
	choice: 'mum' | 'dad' | 'mix';
	created_at: string;
};

export type Guess = {
	id: string;
	voter_id: string;
	guesser_name: string;
	guess_date: string;
	is_winner: boolean;
	created_at: string;
};

export type WishReaction = {
	id: string;
	voter_id: string;
	wish_id: string;
	emoji: '❤️' | '😂' | '🥹' | '🎉';
	created_at: string;
};

export type Question = {
	id: string;
	asker_name: string;
	question: string;
	answer: string | null;
	answered_at: string | null;
	created_at: string;
};
```

- [ ] **Step 5: Update PollWidget to use `getVoterId()` from utils**

In `src/components/home/PollWidget.tsx`:
1. Add to imports: `import { getVoterId } from '../../utils';`
2. Remove the local `getOrCreateVoterId` function (it was defined inside or above the component)
3. Change the ref initialisation line from `useRef<string | null>(null)` + lazy init block to simply: `const voterIdRef = useRef(getVoterId());`

The ref lines should become:
```tsx
const voterIdRef = useRef(getVoterId());
```

Remove any `if (!voterIdRef.current) voterIdRef.current = ...` blocks and any local `getOrCreateVoterId` or `VOTE_ID_KEY` constants that are no longer needed. Also remove the `'timeline_vote_id'` localStorage key reference if it exists only in the local function.

- [ ] **Step 6: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```
git add supabase/migrations/20260708_add_phase2_tables.sql src/utils.ts src/types.ts src/components/home/PollWidget.tsx
git commit -m "feat: phase2 DB migration, fingerprint voter ID, new types"
```

---

### Task 2: Trait Polls (Home Tab)

**Files:**
- Create: `src/components/home/TraitPolls.tsx`
- Modify: `src/components/HomeTab.tsx` — add `isUnlocked: boolean` prop, render `<TraitPolls />`
- Modify: `App.tsx` — pass `isUnlocked` to `<HomeTab />`

**Interfaces:**
- Consumes: `getVoterId()` from `../../utils`; `supabase` from `../../supabaseClient`; `trait_votes` table
- Produces: `TraitPolls` component (no props)

- [ ] **Step 1: Create `src/components/home/TraitPolls.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';

type Trait  = 'eyes' | 'nose' | 'hair' | 'smile';
type Choice = 'mum' | 'dad' | 'mix';

const TRAITS: { id: Trait; emoji: string; label: string }[] = [
	{ id: 'eyes',  emoji: '👀', label: 'Whose eyes?'  },
	{ id: 'nose',  emoji: '👃', label: 'Whose nose?'  },
	{ id: 'hair',  emoji: '💇', label: 'Whose hair?'  },
	{ id: 'smile', emoji: '😄', label: 'Whose smile?' },
];

const CHOICES: { id: Choice; label: string }[] = [
	{ id: 'mum', label: 'Mum'         },
	{ id: 'dad', label: 'Dad'         },
	{ id: 'mix', label: 'Mix of Both' },
];

type Counts     = Record<Choice, number>;
type TraitState = { voted: Choice | null; counts: Counts };

const emptyState = (): TraitState => ({ voted: null, counts: { mum: 0, dad: 0, mix: 0 } });

const initStates = (): Record<Trait, TraitState> => ({
	eyes:  emptyState(),
	nose:  emptyState(),
	hair:  emptyState(),
	smile: emptyState(),
});

export const TraitPolls = () => {
	const voterId = useRef(getVoterId());
	const [states, setStates] = useState<Record<Trait, TraitState>>(initStates);

	const fetchAll = async () => {
		const { data } = await supabase.from('trait_votes').select('trait, choice, voter_id');
		if (!data) return;

		const next = initStates();
		for (const trait of TRAITS.map(t => t.id)) {
			const rows = data.filter(r => r.trait === trait);
			const counts: Counts = { mum: 0, dad: 0, mix: 0 };
			for (const row of rows) counts[row.choice as Choice]++;
			const mine = rows.find(r => r.voter_id === voterId.current);
			next[trait] = { voted: mine ? (mine.choice as Choice) : null, counts };
		}
		setStates(next);
	};

	useEffect(() => {
		fetchAll();

		const channel = supabase
			.channel('trait_votes_changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'trait_votes' }, () => {
				fetchAll();
			})
			.subscribe();

		return () => { supabase.removeChannel(channel); };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const vote = async (trait: Trait, choice: Choice) => {
		const old = states[trait];
		const counts = { ...old.counts };
		if (old.voted) counts[old.voted] = Math.max(0, counts[old.voted] - 1);
		counts[choice]++;
		setStates(prev => ({ ...prev, [trait]: { voted: choice, counts } }));

		await supabase.from('trait_votes').upsert(
			{ voter_id: voterId.current, trait, choice },
			{ onConflict: 'voter_id,trait' },
		);
	};

	return (
		<div className='mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-3'>Who will baby look like? 👶</h2>
			<div className='grid grid-cols-2 gap-3'>
				{TRAITS.map(({ id, emoji, label }) => {
					const { voted, counts } = states[id];
					const total = counts.mum + counts.dad + counts.mix;

					return (
						<div key={id} className='bg-white rounded-3xl shadow-md p-4'>
							<p className='font-poppins font-bold text-sm text-[#1A1A2E] mb-3'>
								{emoji} {label}
							</p>

							{voted === null ? (
								<div className='flex flex-col gap-1.5'>
									{CHOICES.map(({ id: c, label: cl }) => (
										<button
											key={c}
											onClick={() => vote(id, c)}
											className='rounded-full border-2 border-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:border-[#FF8C69] hover:text-[#FF8C69] transition-colors'>
											{cl}
										</button>
									))}
								</div>
							) : (
								<div className='space-y-1.5'>
									{CHOICES.map(({ id: c, label: cl }) => {
										const pct   = total > 0 ? Math.round((counts[c] / total) * 100) : 0;
										const isMe  = voted === c;
										return (
											<div key={c}>
												<div className='flex justify-between text-[10px] font-bold mb-0.5'>
													<span className={isMe ? 'text-[#FF8C69]' : 'text-slate-400'}>
														{cl}{isMe && ' ✓'}
													</span>
													<span className='text-slate-400'>{pct}%</span>
												</div>
												<div className='h-1.5 rounded-full bg-slate-100 overflow-hidden'>
													<div
														className='h-full rounded-full transition-all duration-500'
														style={{ width: `${pct}%`, backgroundColor: isMe ? '#FF8C69' : '#CBD5E1' }}
													/>
												</div>
											</div>
										);
									})}
									<p className='text-[10px] text-slate-400 text-right mt-1'>
										{total} vote{total !== 1 ? 's' : ''}
									</p>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
```

- [ ] **Step 2: Update `src/components/HomeTab.tsx`**

Read the current file. Make two changes:
1. Add `isUnlocked: boolean` prop to the component signature
2. Import and render `<TraitPolls />` after the PollWidget comment and before the closing of the main div

The updated file should look like:

```tsx
import { CountdownHero }  from './home/CountdownHero';
import { FruitTracker }   from './home/FruitTracker';
import { WeeklyFacts }    from './home/WeeklyFacts';
import { TraitPolls }     from './home/TraitPolls';

export const HomeTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	// isUnlocked will be passed to GuessingGame in Task 3
	void isUnlocked;
	return (
		<div className='py-4 space-y-4'>
			<CountdownHero />
			<FruitTracker />
			{/* PollWidget added in Task 5 of v2 plan — boy/girl poll */}
			<TraitPolls />
			{/* GuessingGame added in Task 3 */}
			<WeeklyFacts />
		</div>
	);
};
```

Note: `void isUnlocked` is a temporary suppression until Task 3 uses it. Remove it in Task 3.

- [ ] **Step 3: Update `App.tsx` to pass `isUnlocked` to `HomeTab`**

Find the line: `{activeTab === 'home' && <HomeTab />}`

Replace with: `{activeTab === 'home' && <HomeTab isUnlocked={isUnlocked} />}`

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/components/home/TraitPolls.tsx src/components/HomeTab.tsx App.tsx
git commit -m "feat: add trait polls (eyes, nose, hair, smile) to home tab"
```

---

### Task 3: Birth Date Guessing Game

**Files:**
- Create: `src/components/home/GuessingGame.tsx`
- Modify: `src/components/HomeTab.tsx` — render `<GuessingGame isUnlocked={isUnlocked} />`, remove `void isUnlocked`

**Interfaces:**
- Consumes: `getVoterId()` from `../../utils`; `supabase` from `../../supabaseClient`; `Guess` type from `../../types`; `guesses` table
- Produces: `GuessingGame` component with prop `{ isUnlocked: boolean }`

- [ ] **Step 1: Create `src/components/home/GuessingGame.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { Guess } from '../../types';

type GameState = 'loading' | 'form' | 'voted';

const fmtDate = (d: string) =>
	new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const GuessingGame = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const voterId  = useRef(getVoterId());
	const [gameState, setGameState] = useState<GameState>('loading');
	const [guesses,   setGuesses]   = useState<Guess[]>([]);
	const [myGuess,   setMyGuess]   = useState<Guess | null>(null);
	const [name,      setName]      = useState('');
	const [date,      setDate]      = useState('');
	const [isEditing, setIsEditing] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error,     setError]     = useState<string | null>(null);

	const hasWinner = guesses.some(g => g.is_winner);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('guesses')
					.select('*')
					.order('created_at', { ascending: true });
				const rows = data ?? [];
				setGuesses(rows);
				const mine = rows.find(g => g.voter_id === voterId.current);
				if (mine) { setMyGuess(mine); setGameState('voted'); }
				else setGameState('form');
			} catch {
				setGameState('form');
			}
		})();
	}, []);

	const submit = async () => {
		if (!name.trim() || !date) return;
		setSubmitting(true);
		setError(null);
		try {
			const { data, error: err } = await supabase
				.from('guesses')
				.upsert(
					{ voter_id: voterId.current, guesser_name: name.trim(), guess_date: date, is_winner: false },
					{ onConflict: 'voter_id' },
				)
				.select()
				.single();
			if (err) throw err;
			setMyGuess(data);
			setGuesses(prev => {
				const without = prev.filter(g => g.voter_id !== voterId.current);
				return [...without, data].sort(
					(a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
				);
			});
			setGameState('voted');
			setIsEditing(false);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to save guess');
		} finally {
			setSubmitting(false);
		}
	};

	const revealWinner = async () => {
		const { data: capsule } = await supabase
			.from('birth_capsule')
			.select('birth_date')
			.limit(1)
			.maybeSingle();
		if (!capsule?.birth_date) {
			setError('No birth date found in Baby Book. Fill it in first.');
			return;
		}
		const birthDate = capsule.birth_date as string;
		await supabase.from('guesses').update({ is_winner: true }).eq('guess_date', birthDate);
		setGuesses(prev => prev.map(g => ({ ...g, is_winner: g.guess_date === birthDate })));
	};

	if (gameState === 'loading') return null;

	return (
		<div className='bg-white rounded-3xl shadow-md p-5 mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-1'>Guess the Birthday 🎯</h2>
			<p className='text-sm text-slate-400 mb-4'>When do you think baby will arrive?</p>

			{/* Form — shown when no guess yet, or when editing */}
			{(gameState === 'form' || isEditing) && (
				<div className='space-y-3 mb-5'>
					<input
						type='text'
						placeholder='Your name'
						value={name}
						onChange={e => setName(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69]'
					/>
					<input
						type='date'
						value={date}
						onChange={e => setDate(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69]'
					/>
					{error && <p className='text-xs text-red-500 px-2'>{error}</p>}
					<button
						onClick={submit}
						disabled={submitting || !name.trim() || !date}
						className='w-full rounded-full bg-[#FF8C69] text-white font-bold py-3 text-sm disabled:opacity-50 transition-opacity'>
						{submitting ? 'Saving…' : 'Place My Guess 🎯'}
					</button>
					{isEditing && (
						<button
							onClick={() => { setIsEditing(false); setError(null); }}
							className='w-full rounded-full border-2 border-slate-200 py-2.5 text-sm font-bold text-slate-500'>
							Cancel
						</button>
					)}
				</div>
			)}

			{/* My guess pill — shown after voting (not editing) */}
			{gameState === 'voted' && !isEditing && myGuess && (
				<div className='flex items-center justify-between bg-[#FF8C69]/10 rounded-2xl px-4 py-3 mb-4'>
					<div>
						<p className='text-xs text-slate-400 font-nunito'>Your guess</p>
						<p className='font-poppins font-bold text-[#FF8C69]'>{fmtDate(myGuess.guess_date)}</p>
					</div>
					<button
						onClick={() => { setName(myGuess.guesser_name); setDate(myGuess.guess_date); setIsEditing(true); }}
						className='text-xs text-slate-400 hover:text-[#FF8C69] transition-colors'>
						✏️ Edit
					</button>
				</div>
			)}

			{/* Reveal winner button — unlocked only, no winner yet */}
			{isUnlocked && !hasWinner && gameState === 'voted' && !isEditing && (
				<button
					onClick={revealWinner}
					className='w-full rounded-full border-2 border-[#FF8C69] text-[#FF8C69] font-bold py-2.5 text-sm mb-4 hover:bg-[#FF8C69]/5 transition-colors'>
					Reveal Winner 🎉
				</button>
			)}

			{/* Guesses leaderboard */}
			{guesses.length > 0 && (
				<div>
					<p className='text-xs font-bold text-slate-400 uppercase tracking-wider mb-2'>
						{guesses.length} guess{guesses.length !== 1 ? 'es' : ''}
					</p>
					<div className='space-y-2 max-h-48 overflow-y-auto'>
						{guesses.map(g => (
							<div
								key={g.id}
								className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${
									g.is_winner ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-slate-50'
								}`}>
								<div>
									<span className='text-sm font-bold text-[#1A1A2E]'>{g.guesser_name}</span>
									<span className='text-xs text-slate-400 ml-2'>{fmtDate(g.guess_date)}</span>
								</div>
								{g.is_winner && <span className='text-lg'>🏆</span>}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
```

- [ ] **Step 2: Update `src/components/HomeTab.tsx`**

Replace the file with:

```tsx
import { CountdownHero } from './home/CountdownHero';
import { FruitTracker }  from './home/FruitTracker';
import { GuessingGame }  from './home/GuessingGame';
import { TraitPolls }    from './home/TraitPolls';
import { WeeklyFacts }   from './home/WeeklyFacts';

export const HomeTab = ({ isUnlocked }: { isUnlocked: boolean }) => (
	<div className='py-4 space-y-4'>
		<CountdownHero />
		<FruitTracker />
		{/* PollWidget — boy/girl poll */}
		<TraitPolls />
		<GuessingGame isUnlocked={isUnlocked} />
		<WeeklyFacts />
	</div>
);
```

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add src/components/home/GuessingGame.tsx src/components/HomeTab.tsx
git commit -m "feat: add birth date guessing game to home tab"
```

---

### Task 4: Emoji Reactions on Wishes

**Files:**
- Create: `src/components/wishes/ReactionBar.tsx`
- Modify: `src/components/WishesTab.tsx` — render `<ReactionBar>` at bottom of each wish card

**Interfaces:**
- Consumes: `getVoterId()` from `../../utils`; `supabase` from `../../supabaseClient`; `wish_reactions` table
- Produces: `ReactionBar` component with prop `{ wishId: string }`

- [ ] **Step 1: Create `src/components/wishes/ReactionBar.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';

const EMOJIS = ['❤️', '😂', '🥹', '🎉'] as const;
type Emoji = typeof EMOJIS[number];

const EMPTY: Record<Emoji, number> = { '❤️': 0, '😂': 0, '🥹': 0, '🎉': 0 };

export const ReactionBar = ({ wishId }: { wishId: string }) => {
	const voterId    = useRef(getVoterId());
	const [counts,   setCounts]   = useState<Record<Emoji, number>>({ ...EMPTY });
	const [mine,     setMine]     = useState<Set<Emoji>>(new Set());
	const [toggling, setToggling] = useState<Emoji | null>(null);

	useEffect(() => {
		(async () => {
			const { data } = await supabase
				.from('wish_reactions')
				.select('voter_id, emoji')
				.eq('wish_id', wishId);
			if (!data) return;

			const c: Record<Emoji, number> = { ...EMPTY };
			const m = new Set<Emoji>();
			for (const row of data) {
				c[row.emoji as Emoji] = (c[row.emoji as Emoji] ?? 0) + 1;
				if (row.voter_id === voterId.current) m.add(row.emoji as Emoji);
			}
			setCounts(c);
			setMine(m);
		})();
	}, [wishId]);

	const toggle = async (emoji: Emoji) => {
		if (toggling) return;
		setToggling(emoji);
		const isActive = mine.has(emoji);

		// Optimistic update
		setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? -1 : 1)) }));
		setMine(prev => {
			const next = new Set(prev);
			isActive ? next.delete(emoji) : next.add(emoji);
			return next;
		});

		try {
			if (isActive) {
				await supabase.from('wish_reactions').delete()
					.eq('voter_id', voterId.current)
					.eq('wish_id', wishId)
					.eq('emoji', emoji);
			} else {
				await supabase.from('wish_reactions').insert({
					voter_id: voterId.current,
					wish_id:  wishId,
					emoji,
				});
			}
		} catch {
			// Roll back optimistic update
			setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? 1 : -1)) }));
			setMine(prev => {
				const next = new Set(prev);
				isActive ? next.add(emoji) : next.delete(emoji);
				return next;
			});
		} finally {
			setToggling(null);
		}
	};

	return (
		<div className='flex gap-2 mt-3 pt-3 border-t border-slate-100'>
			{EMOJIS.map(emoji => {
				const count  = counts[emoji];
				const active = mine.has(emoji);
				return (
					<button
						key={emoji}
						onClick={() => toggle(emoji)}
						disabled={toggling !== null}
						className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-sm transition-colors disabled:cursor-not-allowed ${
							active
								? 'bg-[#FF8C69]/15 border border-[#FF8C69]/40'
								: 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
						}`}>
						<span>{emoji}</span>
						{count > 0 && (
							<span className='text-xs font-bold text-slate-500'>{count}</span>
						)}
					</button>
				);
			})}
		</div>
	);
};
```

- [ ] **Step 2: Update `src/components/WishesTab.tsx`**

Read the current file. Find the wish card JSX (each `<div>` rendering a wish). At the bottom of the wish card content (after the message and timestamp), add:

```tsx
import { ReactionBar } from './wishes/ReactionBar';
```

And at the bottom of each wish card, after the message text, before closing the card div:

```tsx
<ReactionBar wishId={wish.id} />
```

The wish card was using a `wish.id` field — confirm that field name matches the `Wish` type (`id: string`). It does.

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add src/components/wishes/ReactionBar.tsx src/components/WishesTab.tsx
git commit -m "feat: add emoji reactions to guestbook wish cards"
```

---

### Task 5: Q&A Tab

**Files:**
- Create: `src/components/QATab.tsx`
- Modify: `src/components/TabBar.tsx` — add `'qa'` tab (4th), shift Baby Book to 5th
- Modify: `App.tsx` — add `'qa'` to `TabId`, render `<QATab isUnlocked={isUnlocked} />`

**Interfaces:**
- Consumes: `supabase` from `'../supabaseClient'`; `Question` type from `'../types'`; `questions` table
- Produces: `QATab` component with prop `{ isUnlocked: boolean }`

- [ ] **Step 1: Create `src/components/QATab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Question } from '../types';

function relativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1)  return 'just now';
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24)  return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

export const QATab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [questions,   setQuestions]   = useState<Question[]>([]);
	const [isLoading,   setIsLoading]   = useState(true);
	const [askerName,   setAskerName]   = useState('');
	const [questionTxt, setQuestionTxt] = useState('');
	const [submitting,  setSubmitting]  = useState(false);
	const [answeringId, setAnsweringId] = useState<string | null>(null);
	const [answerTxt,   setAnswerTxt]   = useState('');

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('questions')
					.select('*')
					.order('created_at', { ascending: false });
				setQuestions(data ?? []);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const submitQuestion = async () => {
		if (!askerName.trim() || !questionTxt.trim()) return;
		setSubmitting(true);
		try {
			const { data, error } = await supabase
				.from('questions')
				.insert({ asker_name: askerName.trim(), question: questionTxt.trim() })
				.select()
				.single();
			if (error) throw error;
			setQuestions(prev => [data, ...prev]);
			setAskerName('');
			setQuestionTxt('');
		} catch { /* silently fail */ } finally {
			setSubmitting(false);
		}
	};

	const saveAnswer = async (id: string) => {
		if (!answerTxt.trim()) return;
		const { data, error } = await supabase
			.from('questions')
			.update({ answer: answerTxt.trim(), answered_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single();
		if (error) return;
		setQuestions(prev => prev.map(q => q.id === id ? data : q));
		setAnsweringId(null);
		setAnswerTxt('');
	};

	return (
		<div className='py-4 space-y-4'>
			{/* Submit form */}
			<div className='bg-white rounded-3xl shadow-md p-5'>
				<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-1'>Ask Us Anything 💬</h2>
				<p className='text-sm text-slate-400 mb-4'>We'll answer as soon as we can!</p>
				<div className='space-y-3'>
					<input
						type='text'
						placeholder='Your name'
						value={askerName}
						onChange={e => setAskerName(e.target.value)}
						className='w-full rounded-full border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#B39DDB]'
					/>
					<textarea
						placeholder='Ask us anything...'
						value={questionTxt}
						onChange={e => setQuestionTxt(e.target.value)}
						rows={3}
						className='w-full rounded-2xl border-2 border-slate-200 px-5 py-3 text-sm font-nunito focus:outline-none focus:border-[#B39DDB] resize-none'
					/>
					<button
						onClick={submitQuestion}
						disabled={submitting || !askerName.trim() || !questionTxt.trim()}
						className='w-full rounded-full bg-[#B39DDB] text-white font-bold py-3 text-sm disabled:opacity-50 transition-opacity'>
						{submitting ? 'Sending…' : 'Ask Away 💬'}
					</button>
				</div>
			</div>

			{/* Questions feed */}
			{isLoading ? (
				<div className='flex justify-center py-12'>
					<div className='w-8 h-8 rounded-full border-4 border-[#B39DDB] border-t-transparent animate-spin' />
				</div>
			) : questions.length === 0 ? (
				<div className='bg-white rounded-3xl shadow-md p-8 text-center'>
					<p className='text-4xl mb-3'>💬</p>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No questions yet</p>
					<p className='text-sm text-slate-400 mt-1'>Be the first to ask!</p>
				</div>
			) : (
				questions.map(q => (
					<div key={q.id} className='bg-white rounded-3xl shadow-md p-5'>
						<div className='flex items-center justify-between mb-2'>
							<span className='font-poppins font-bold text-sm text-[#1A1A2E]'>{q.asker_name}</span>
							<span className='text-xs text-slate-400'>{relativeTime(q.created_at)}</span>
						</div>
						<p className='text-[#1A1A2E] text-sm leading-relaxed mb-3'>{q.question}</p>

						{q.answer ? (
							<div className='border-l-4 border-[#FF8C69] pl-4 bg-[#FF8C69]/5 rounded-r-2xl py-2 pr-3'>
								<p className='text-sm text-[#1A1A2E] leading-relaxed'>{q.answer}</p>
								<p className='text-xs text-slate-400 mt-1'>— Mum & Dad 💛</p>
							</div>
						) : (
							answeringId !== q.id ? (
								<div className='flex items-center justify-between'>
									<p className='text-xs text-slate-300 italic'>Waiting for an answer... 🌙</p>
									{isUnlocked && (
										<button
											onClick={() => { setAnsweringId(q.id); setAnswerTxt(''); }}
											className='text-xs font-bold text-[#FF8C69] hover:underline'>
											Answer
										</button>
									)}
								</div>
							) : (
								<div className='space-y-2'>
									<textarea
										placeholder='Type your answer...'
										value={answerTxt}
										onChange={e => setAnswerTxt(e.target.value)}
										rows={3}
										autoFocus
										className='w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm font-nunito focus:outline-none focus:border-[#FF8C69] resize-none'
									/>
									<div className='flex gap-2'>
										<button
											onClick={() => saveAnswer(q.id)}
											disabled={!answerTxt.trim()}
											className='flex-1 rounded-full bg-[#FF8C69] text-white font-bold py-2.5 text-sm disabled:opacity-50'>
											Save Answer
										</button>
										<button
											onClick={() => setAnsweringId(null)}
											className='flex-1 rounded-full border-2 border-slate-200 font-bold py-2.5 text-sm text-slate-500'>
											Cancel
										</button>
									</div>
								</div>
							)
						)}
					</div>
				))
			)}
		</div>
	);
};
```

- [ ] **Step 2: Update `src/components/TabBar.tsx`**

Read the current file. The current `TabId` type is `'home' | 'timeline' | 'wishes' | 'babybook'`. The tab array has 4 entries.

Replace the entire file with:

```tsx
import type { ComponentType } from 'react';
import { BookOpen, Home, Library, MessageCircle, Heart } from 'lucide-react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'qa' | 'babybook';

const TABS: { id: TabId; label: string; Icon: ComponentType<{ className?: string }> }[] = [
	{ id: 'home',      label: 'Home',     Icon: Home          },
	{ id: 'timeline',  label: 'Timeline', Icon: BookOpen      },
	{ id: 'wishes',    label: 'Wishes',   Icon: Heart         },
	{ id: 'qa',        label: 'Q&A',      Icon: MessageCircle },
	{ id: 'babybook',  label: 'Baby Book',Icon: Library       },
];

export const TabBar = ({
	activeTab,
	onTabChange,
}: {
	activeTab:   TabId;
	onTabChange: (tab: TabId) => void;
}) => (
	<nav className='fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-30'>
		<div className='max-w-[600px] mx-auto flex justify-around py-2'>
			{TABS.map(({ id, label, Icon }) => {
				const active = activeTab === id;
				return (
					<button
						key={id}
						onClick={() => onTabChange(id)}
						className={`flex flex-col items-center gap-0.5 px-2 transition-colors ${
							active ? 'text-[#FF8C69]' : 'text-slate-400 hover:text-slate-600'
						}`}>
						<Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
						<span className='text-[10px] font-bold'>{label}</span>
					</button>
				);
			})}
		</div>
	</nav>
);
```

- [ ] **Step 3: Update `App.tsx`**

1. Add import: `import { QATab } from './src/components/QATab';`
2. In the `<main>` section, add after the wishes tab render:

```tsx
{activeTab === 'qa' && <QATab isUnlocked={isUnlocked} />}
```

The full set of tab renders should be:
```tsx
{activeTab === 'home'     && <HomeTab isUnlocked={isUnlocked} />}
{activeTab === 'timeline' && (
    <TimelineTab ... />
)}
{activeTab === 'wishes'   && <WishesTab />}
{activeTab === 'qa'       && <QATab isUnlocked={isUnlocked} />}
{activeTab === 'babybook' && <BabyBookTab isUnlocked={isUnlocked} />}
```

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/components/QATab.tsx src/components/TabBar.tsx App.tsx
git commit -m "feat: add Q&A tab with question submission and parent answering"
```

---

### Task 6: Aesthetic Consistency Pass

**Files:**
- Modify: `src/components/AuthGate.tsx`
- Modify: `src/components/MemoryModal.tsx`
- Modify: `src/components/ExpandedImageModal.tsx`

**Interfaces:**
- No new interfaces — purely visual changes. All props, exports, and behaviour preserved exactly.

- [ ] **Step 1: Reskin `src/components/AuthGate.tsx`**

Read the current file carefully. Apply the following changes (preserve all logic, event handlers, and conditional rendering):

**Remove** the `FloatingBackground` import and usage (`import { FloatingBackground }` line and `<FloatingBackground />` JSX).

**Full-screen (non-modal) layout** — replace outer div classes:
- Old: `'relative min-h-screen overflow-x-hidden bg-cream flex items-center justify-center font-nunito'`
- New: `'min-h-screen bg-[#FAFAFA] flex items-center justify-center font-nunito px-4'`

**Full-screen card** — replace card div classes:
- Old: `'relative z-10 w-full max-w-sm mx-4 bg-white rounded-3xl p-8 shadow-2xl shadow-pink-100 border-4 border-pink-200'`
- New: `'w-full max-w-sm bg-white rounded-3xl p-8 shadow-xl'`

**Icon container** — replace:
- Old: `'inline-flex items-center justify-center p-4 mb-4 bg-pink-100 rounded-full'`
- New: `'inline-flex items-center justify-center p-4 mb-4 bg-[#FF8C69]/10 rounded-full'`

**Baby icon color** — replace:
- Old: `className='w-12 h-12 text-pink-500'`
- New: `className='w-12 h-12 text-[#FF8C69]'`

**Heading** — replace:
- Old: `'text-3xl font-extrabold text-slate-800 text-center'`
- New: `'font-poppins text-3xl font-extrabold text-[#1A1A2E] text-center'`

**Password input** — replace:
- Old: `'w-full px-4 py-3 border-2 border-pink-200 rounded-full text-center font-nunito text-slate-700 focus:outline-none focus:border-pink-400 bg-white'`
- New: `'w-full px-5 py-3 border-2 border-slate-200 rounded-full text-center font-nunito text-slate-700 focus:outline-none focus:border-[#FF8C69] bg-white'`

**Unlock button** — replace:
- Old: `'mt-4 w-full py-3 bg-pink-400 text-white font-bold rounded-full hover:bg-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'`
- New: `'mt-4 w-full py-3 bg-[#FF8C69] text-white font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'`

**View only button** — replace:
- Old: `'mt-3 w-full py-3 border-2 border-pink-200 text-pink-500 font-bold rounded-full hover:bg-pink-50 transition-colors'`
- New: `'mt-3 w-full py-3 border-2 border-[#FF8C69] text-[#FF8C69] font-bold rounded-full hover:bg-[#FF8C69]/5 transition-colors'`

**Modal card** — replace:
- Old: `'w-full max-w-sm mx-4 bg-cream rounded-3xl p-8 shadow-2xl shadow-pink-100 border-2 border-pink-100'`
- New: `'w-full max-w-sm mx-4 bg-white rounded-3xl p-8 shadow-xl'`

**Modal heading** — replace:
- Old: `'text-2xl font-extrabold text-slate-800 text-center mb-6'`
- New: `'font-poppins text-2xl font-extrabold text-[#1A1A2E] text-center mb-6'`

- [ ] **Step 2: Reskin `src/components/MemoryModal.tsx`**

Read the current file carefully. Preserve all logic. Apply these class changes only:

**Modal backdrop** — replace:
- Old: `'fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-sm'`
- New: `'fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-[#1A1A2E]/40 backdrop-blur-sm'`

**Modal card** — replace:
- Old: `'bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-pink-100 transform transition-all my-8'`
- New: `'bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-xl overflow-hidden transform transition-all my-8'`

**Header** — replace:
- Old: `'flex items-center justify-between px-8 py-6 border-b-2 border-pink-100 bg-pink-50 shrink-0'`
- New: `'flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-[#FF8C69]/5 shrink-0'`

**Title** — replace:
- Old: `'flex items-center gap-2 text-2xl font-bold text-slate-800'`
- New: `'flex items-center gap-2 text-2xl font-poppins font-bold text-[#1A1A2E]'`

**Title input** — replace `focus:border-pink-300` with `focus:border-[#FF8C69]`; replace `bg-slate-50 border-slate-100` with `bg-white border-slate-200`

**Date input** — same replacements as title input

**Textarea** — replace `focus:border-pink-300` with `focus:border-[#FF8C69]`; replace `bg-slate-50 border-slate-100` with `bg-white border-slate-200`

**Icon picker selected state** — replace:
- Old: `'border-pink-400 bg-pink-50 scale-110 shadow-md rotate-6'`
- New: `'border-[#FF8C69] bg-[#FF8C69]/10 scale-110 shadow-md rotate-6'`

**Photo upload hover** — replace:
- Old: `'hover:bg-slate-50 hover:border-pink-200 hover:text-pink-400'`
- New: `'hover:bg-slate-50 hover:border-[#FF8C69] hover:text-[#FF8C69]'`

**Save button** — replace:
- Old: `'w-full py-4 text-xl font-bold text-white transition transform flex justify-center items-center gap-2 bg-pink-400 rounded-full shadow-lg hover:bg-pink-500 shadow-pink-200 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed'`
- New: `'w-full py-4 text-xl font-bold text-white transition transform flex justify-center items-center gap-2 bg-[#FF8C69] rounded-full shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed'`

**Delete button (the "Yes, delete" confirm button)** — replace:
- Old: `'px-3 py-1 text-sm font-bold text-white bg-red-500 rounded-full hover:bg-red-600 transition-colors'`
- New: `'px-3 py-1 text-sm font-bold text-white bg-[#B39DDB] rounded-full hover:opacity-90 transition-opacity'`

**Close button hover** — replace `hover:text-pink-500 hover:bg-pink-100` with `hover:text-[#FF8C69] hover:bg-[#FF8C69]/10`

**New file border** — replace `border-pink-200` (on new file thumbnail) with `border-[#FF8C69]/30`

- [ ] **Step 3: Reskin `src/components/ExpandedImageModal.tsx`**

Read the current file. Apply these targeted class replacements only:

**Close button hover** — replace `hover:bg-pink-50 hover:text-pink-500` with `hover:bg-[#FF8C69]/10 hover:text-[#FF8C69]`

**Left nav button hover** — same replacement

**Right nav button hover** — same replacement

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/components/AuthGate.tsx src/components/MemoryModal.tsx src/components/ExpandedImageModal.tsx
git commit -m "feat: apply Modern Playful design system to auth gate, memory modal, image modal"
```

---

### Task 7: Final Check + Push to GitHub

**Files:** None — verification and deployment only.

- [ ] **Step 1: Full TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Verify the migration reminder**

Confirm that `supabase/migrations/20260708_add_phase2_tables.sql` has already been run in the Supabase dashboard (done in Task 1, Step 2). If not, run it now before proceeding.

- [ ] **Step 3: Commit any stray changes**

```
git status
```

If any files are modified but uncommitted, add and commit them.

- [ ] **Step 4: Push branch and merge**

```
git push origin main
```

This triggers a Netlify redeploy automatically.

- [ ] **Step 5: Final verification checklist**

Confirm all of the following work in the deployed site:
- [ ] Trait polls show 4 cards, voting updates percentages
- [ ] Same device/browser cannot re-vote on trait polls after refresh
- [ ] Guessing game accepts a name + date and shows the guess in the leaderboard
- [ ] Wishes tab shows emoji reaction buttons on each card; toggling adds/removes reactions
- [ ] Q&A tab shows the submit form; submitting adds a question to the feed
- [ ] Unlocked mode shows "Answer" button on each Q&A card
- [ ] AuthGate login screen uses peach buttons and no floating emoji background
- [ ] Memory modal (add/edit milestone) uses peach save button and updated colors

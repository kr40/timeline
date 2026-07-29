# Blessings Corner, Fun Polls, Baby Shower & Pre-Shower Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the Wishes tab into a Blessings & Advice corner, add five "Aditi vs Kartik" fun polls, add a Baby Shower tab with QR deep-link + photo upload, and run the app in gate-free reduced-tab "pre-shower mode" until the end of August 14, 2026.

**Architecture:** Five sequential tasks: (1) migration + config + types, (2) fun polls, (3) blessings corner, (4) shower tab + hash deep link, (5) pre-shower mode rewiring of App.tsx/TabBar. Task 6 verifies, generates the printable QR code, and ships.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CSS v3, Supabase, ImageKit (existing `uploadToImageKit` helper), Lucide React icons.

## Global Constraints

- All source files use **tabs** for indentation (not spaces)
- TypeScript strict — no implicit `any`; `catch (err: unknown)` with `instanceof Error` guard
- Mobile-first: `max-w-[600px]` centered
- Palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`, text-primary `#1A1A2E`, text-muted `#6B7280`
- Fonts: `font-poppins` (headings), `font-nunito` (body)
- `getVoterId()` from `src/utils.ts` for all vote dedup
- All date logic (EDD, shower date) sourced from `src/config.ts` only
- Fun polls: Aditi accent = lavender `#B39DDB`, Kartik accent = mint `#6CC9C9`
- No routing library — `#shower` hash read once on load
- No new runtime dependencies

---

### Task 1: Migration + Config + Types

**Files:**
- Create: `supabase/migrations/20260729_add_blessings_polls_shower.sql`
- Modify: `src/config.ts` — add `SHOWER_DATE` + `isPreShowerMode()`
- Modify: `src/types.ts` — extend `Wish`, add `FunPollVote`, `ShowerPost`

**Interfaces:**
- Produces: `isPreShowerMode(): boolean` from `src/config.ts` — used by Task 5
- Produces: `Wish.category: 'blessing' | 'advice' | null` — used by Task 3
- Produces: `FunPollVote`, `ShowerPost` types — used by Tasks 2 and 4

- [ ] **Step 1: Create the migration SQL file**

```sql
-- supabase/migrations/20260729_add_blessings_polls_shower.sql

alter table wishes add column category text check (category in ('blessing', 'advice'));

create table fun_poll_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  poll        text not null check (poll in ('sleep', 'diaper', 'inherit', 'pushover', 'googler')),
  choice      text not null check (choice in ('aditi', 'kartik')),
  created_at  timestamptz default now(),
  unique (voter_id, poll)
);

create table shower_posts (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  message      text not null,
  image_url    text,
  created_at   timestamptz default now()
);
```

- [ ] **Step 2: Run the migration**

Supabase project → SQL Editor → paste the file contents → Run. Verify `wishes.category` column plus the `fun_poll_votes` and `shower_posts` tables exist.

- [ ] **Step 3: Add shower date + mode helper to `src/config.ts`**

Append at the end of the file:

```ts
export const SHOWER_DATE = '2026-08-14';

/** True through the end of the shower day (local time) — gate-free reduced-tab mode. */
export function isPreShowerMode(): boolean {
	const now    = new Date();
	const shower = new Date(SHOWER_DATE + 'T23:59:59');
	return now.getTime() <= shower.getTime();
}
```

- [ ] **Step 4: Update types in `src/types.ts`**

Change the `Wish` type to add `category`:

```ts
export type Wish = {
	id:          string;
	author_name: string;
	message:     string;
	category:    'blessing' | 'advice' | null;
	created_at:  string;
};
```

Append after the `Question` type:

```ts
export type FunPollVote = {
	id: string;
	voter_id: string;
	poll: 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
	choice: 'aditi' | 'kartik';
	created_at: string;
};

export type ShowerPost = {
	id: string;
	author_name: string;
	message: string;
	image_url: string | null;
	created_at: string;
};
```

- [ ] **Step 5: Fix the optimistic Wish literal in `WishesTab.tsx`**

Adding `category` to `Wish` breaks the optimistic-insert object literal in `src/components/WishesTab.tsx` (`handleSubmit`). Update it minimally so this task compiles cleanly — add `category: null`:

```ts
const optimistic: Wish = {
	id: crypto.randomUUID(), author_name: name, message: msg,
	category: null,
	created_at: new Date().toISOString(),
};
```

(Task 3 will replace this with the real category value; this step only keeps the build green.)

- [ ] **Step 6: TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 7: Commit**

```
git add supabase/migrations/20260729_add_blessings_polls_shower.sql src/config.ts src/types.ts src/components/WishesTab.tsx
git commit -m "feat: migration + config + types for blessings, fun polls, shower"
```

---

### Task 2: Fun Polls (Home Tab)

**Files:**
- Create: `src/data/funPolls.ts`
- Create: `src/components/home/FunPolls.tsx`
- Modify: `src/components/HomeTab.tsx` — render `<FunPolls />` below `<TraitPolls />`

**Interfaces:**
- Consumes: `getVoterId()` from `../../utils`; `supabase` from `../../supabaseClient`; `fun_poll_votes` table
- Produces: `FunPolls` component (no props)

- [ ] **Step 1: Create `src/data/funPolls.ts`**

```ts
export type FunPollId = 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
export type FunPollChoice = 'aditi' | 'kartik';

export type FunPollDef = {
	id: FunPollId;
	question: string;
	aditiLabel: string;
	kartikLabel: string;
};

export const FUN_POLLS: FunPollDef[] = [
	{ id: 'sleep',    question: 'Whose sleep schedule will the baby ruin first? 😴', aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
	{ id: 'diaper',   question: 'Who will cry more during diaper changes? 😭',       aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
	{ id: 'inherit',  question: 'What will baby inherit? 🧬',                        aditiLabel: "Aditi's patience", kartikLabel: "Kartik's appetite" },
	{ id: 'pushover', question: 'Who will baby have wrapped around their finger? 🫠', aditiLabel: 'Aditi',           kartikLabel: 'Kartik' },
	{ id: 'googler',  question: 'Who googles "is this normal?" at 3am more? 🔍',     aditiLabel: 'Aditi',            kartikLabel: 'Kartik' },
];
```

- [ ] **Step 2: Create `src/components/home/FunPolls.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { FUN_POLLS, FunPollChoice, FunPollId } from '../../data/funPolls';

type Counts    = Record<FunPollChoice, number>;
type PollState = { voted: FunPollChoice | null; counts: Counts };

const emptyState = (): PollState => ({ voted: null, counts: { aditi: 0, kartik: 0 } });

const initStates = (): Record<FunPollId, PollState> => ({
	sleep:    emptyState(),
	diaper:   emptyState(),
	inherit:  emptyState(),
	pushover: emptyState(),
	googler:  emptyState(),
});

const CHOICE_COLORS: Record<FunPollChoice, string> = {
	aditi:  '#B39DDB',
	kartik: '#6CC9C9',
};

export const FunPolls = () => {
	const voterId = useRef(getVoterId());
	const [states, setStates] = useState<Record<FunPollId, PollState>>(initStates);

	const fetchAll = async () => {
		const { data } = await supabase.from('fun_poll_votes').select('poll, choice, voter_id');
		if (!data) return;

		const next = initStates();
		for (const def of FUN_POLLS) {
			const rows = data.filter(r => r.poll === def.id);
			const counts: Counts = { aditi: 0, kartik: 0 };
			for (const row of rows) counts[row.choice as FunPollChoice]++;
			const mine = rows.find(r => r.voter_id === voterId.current);
			next[def.id] = { voted: mine ? (mine.choice as FunPollChoice) : null, counts };
		}
		setStates(next);
	};

	useEffect(() => {
		fetchAll();

		const channel = supabase
			.channel('fun_poll_votes_changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'fun_poll_votes' }, () => {
				fetchAll();
			})
			.subscribe();

		return () => { supabase.removeChannel(channel); };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const vote = async (poll: FunPollId, choice: FunPollChoice) => {
		const old = states[poll];
		const counts = { ...old.counts };
		if (old.voted) counts[old.voted] = Math.max(0, counts[old.voted] - 1);
		counts[choice]++;
		setStates(prev => ({ ...prev, [poll]: { voted: choice, counts } }));

		const { error } = await supabase.from('fun_poll_votes').upsert(
			{ voter_id: voterId.current, poll, choice },
			{ onConflict: 'voter_id,poll' },
		);

		if (error) {
			setStates(prev => ({ ...prev, [poll]: old }));
		}
	};

	return (
		<div className='mb-4'>
			<h2 className='font-poppins font-extrabold text-lg text-[#1A1A2E] mb-3'>Aditi vs Kartik 🥊</h2>
			<div className='space-y-3'>
				{FUN_POLLS.map(def => {
					const { voted, counts } = states[def.id];
					const total = counts.aditi + counts.kartik;

					return (
						<div key={def.id} className='bg-white rounded-3xl shadow-md p-5'>
							<p className='font-poppins font-bold text-sm text-[#1A1A2E] mb-3'>{def.question}</p>

							{voted === null ? (
								<div className='flex gap-2'>
									<button
										onClick={() => vote(def.id, 'aditi')}
										className='flex-1 rounded-full border-2 border-[#B39DDB]/50 py-2.5 text-xs font-bold text-[#B39DDB] hover:bg-[#B39DDB]/10 transition-colors'>
										{def.aditiLabel}
									</button>
									<button
										onClick={() => vote(def.id, 'kartik')}
										className='flex-1 rounded-full border-2 border-[#6CC9C9]/50 py-2.5 text-xs font-bold text-[#6CC9C9] hover:bg-[#6CC9C9]/10 transition-colors'>
										{def.kartikLabel}
									</button>
								</div>
							) : (
								<div className='space-y-2'>
									{(['aditi', 'kartik'] as const).map(c => {
										const pct  = total > 0 ? Math.round((counts[c] / total) * 100) : 0;
										const isMe = voted === c;
										const label = c === 'aditi' ? def.aditiLabel : def.kartikLabel;
										return (
											<div key={c}>
												<div className='flex justify-between text-[11px] font-bold mb-0.5'>
													<span style={{ color: isMe ? CHOICE_COLORS[c] : '#94A3B8' }}>
														{label}{isMe && ' ✓'}
													</span>
													<span className='text-slate-400'>{pct}%</span>
												</div>
												<div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
													<div
														className='h-full rounded-full transition-all duration-500'
														style={{ width: `${pct}%`, backgroundColor: isMe ? CHOICE_COLORS[c] : '#CBD5E1' }}
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

- [ ] **Step 3: Render in `src/components/HomeTab.tsx`**

Add the import and render below `TraitPolls`:

```tsx
import { CountdownHero } from './home/CountdownHero';
import { FruitTracker } from './home/FruitTracker';
import { FunPolls } from './home/FunPolls';
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
		<FunPolls />
		<GuessingGame isUnlocked={isUnlocked} />
	</div>
);
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/data/funPolls.ts src/components/home/FunPolls.tsx src/components/HomeTab.tsx
git commit -m "feat: add Aditi vs Kartik fun polls to home tab"
```

---

### Task 3: Blessings & Advice Corner

**Files:**
- Modify: `src/components/WishesTab.tsx` — category picker, filter chips, new copy
- Modify: `src/components/TabBar.tsx` — label "Blessings", icon change

**Interfaces:**
- Consumes: `Wish` type with `category` (Task 1)
- The `wishes` TabId value stays `'wishes'` — only the label/icon change (avoids touching App.tsx)

- [ ] **Step 1: Update `src/components/TabBar.tsx` label/icon**

Change the import and the wishes entry:

```tsx
import { BookOpen, HandHeart, Home, Library, MessageCircle } from 'lucide-react';
```

```tsx
	{ id: 'wishes',   label: 'Blessings', Icon: HandHeart },
```

(All other entries unchanged.)

- [ ] **Step 2: Update `src/components/WishesTab.tsx`**

Apply these changes, preserving all existing logic (optimistic insert with `pendingIds`, ReactionBar, COLORS cycling, relativeTime):

1. Add state for the form category and the feed filter:

```ts
const [category, setCategory] = useState<'blessing' | 'advice'>('blessing');
const [filter, setFilter]     = useState<'all' | 'blessing' | 'advice'>('all');
```

2. In `handleSubmit`, include the category in both the optimistic object and the insert:

```ts
const optimistic: Wish = {
	id: crypto.randomUUID(), author_name: name, message: msg,
	category,
	created_at: new Date().toISOString(),
};
```

```ts
const { data, error } = await supabase
	.from('wishes').insert({ author_name: name, message: msg, category }).select().single();
```

3. Replace the form card's heading/subtext and add the category picker between the heading and the name input:

```tsx
<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-1'>Blessings & Advice Corner 🙏</h2>
<p className='text-xs text-[#6B7280] font-semibold mb-4'>Shower baby with your ashirwad, or share your best advice for the new parents</p>
```

Category picker (first element inside the `<form>`):

```tsx
<div className='flex gap-2'>
	<button type='button' onClick={() => setCategory('blessing')}
		className={`flex-1 py-2 rounded-full text-xs font-bold border-2 transition-colors ${
			category === 'blessing'
				? 'bg-[#B39DDB] border-[#B39DDB] text-white'
				: 'border-slate-200 text-slate-500 hover:border-[#B39DDB]/50'
		}`}>
		🙏 Blessing
	</button>
	<button type='button' onClick={() => setCategory('advice')}
		className={`flex-1 py-2 rounded-full text-xs font-bold border-2 transition-colors ${
			category === 'advice'
				? 'bg-[#6CC9C9] border-[#6CC9C9] text-white'
				: 'border-slate-200 text-slate-500 hover:border-[#6CC9C9]/50'
		}`}>
		💡 Advice
	</button>
</div>
```

4. Update the textarea placeholder and the submit button label:

```tsx
<textarea placeholder='Write your blessing or advice for baby...' ... />
```

```tsx
{isSubmitting ? 'Sending...' : 'Send with Love 🙏'}
```

5. Add filter chips between the form card and the feed:

```tsx
<div className='flex gap-2'>
	{([['all', 'All'], ['blessing', '🙏 Blessings'], ['advice', '💡 Advice']] as const).map(([id, label]) => (
		<button key={id} onClick={() => setFilter(id)}
			className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
				filter === id
					? 'bg-[#1A1A2E] border-[#1A1A2E] text-white'
					: 'bg-white border-slate-200 text-slate-500'
			}`}>
			{label}
		</button>
	))}
</div>
```

6. Filter the feed before mapping — legacy posts (`category === null`) appear only under All:

```tsx
{wishes
	.filter(w => filter === 'all' || w.category === filter)
	.map((wish, i) => ( ... existing card JSX ... ))}
```

7. Inside each card, show a category chip next to the timestamp when present:

```tsx
<div className='flex items-center gap-2'>
	{wish.category && (
		<span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#6B7280]'>
			{wish.category === 'blessing' ? '🙏 Blessing' : '💡 Advice'}
		</span>
	)}
	<span className='text-[10px] text-[#6B7280] font-semibold'>{relativeTime(wish.created_at)}</span>
</div>
```

(This replaces the bare timestamp `<span>` in the card header row.)

8. Update the empty state copy:

```tsx
<div className='text-4xl mb-3'>🙏</div>
<p className='font-poppins font-bold text-[#1A1A2E]'>No blessings yet</p>
<p className='text-xs text-[#6B7280] font-semibold mt-1'>Be the first to bless the little one!</p>
```

9. Also replace the two `catch (err: any)` blocks in this file with `catch (err: unknown)` + `err instanceof Error ? err.message : <fallback>` while editing.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 4: Commit**

```
git add src/components/WishesTab.tsx src/components/TabBar.tsx
git commit -m "feat: evolve wishes tab into blessings & advice corner with categories"
```

---

### Task 4: Baby Shower Tab + Hash Deep Link

**Files:**
- Create: `src/components/ShowerTab.tsx`
- Modify: `src/components/TabBar.tsx` — add `'shower'` tab between Q&A and Baby Book
- Modify: `App.tsx` — render ShowerTab; initialize `activeTab` from `location.hash`

**Interfaces:**
- Consumes: `ShowerPost` type (Task 1); `uploadToImageKit` from `./src/imagekit`; `shower_posts` table
- Produces: `TabId` gains `'shower'`

- [ ] **Step 1: Create `src/components/ShowerTab.tsx`**

```tsx
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { uploadToImageKit } from '../imagekit';
import { ShowerPost } from '../types';

const COLORS = [
	'bg-[#FF8C69]/10 border-[#FF8C69]/20',
	'bg-[#6CC9C9]/10 border-[#6CC9C9]/20',
	'bg-[#B39DDB]/10 border-[#B39DDB]/20',
	'bg-[#FF8FAB]/10 border-[#FF8FAB]/20',
];

function relativeTime(iso: string): string {
	const diff  = Date.now() - new Date(iso).getTime();
	const mins  = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days  = Math.floor(diff / 86400000);
	if (mins  < 1)  return 'just now';
	if (mins  < 60) return `${mins}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days  < 7)  return `${days}d ago`;
	return new Date(iso).toLocaleDateString();
}

export const ShowerTab = ({ onImageClick }: { onImageClick: (url: string) => void }) => {
	const [posts, setPosts]             = useState<ShowerPost[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [loadError, setLoadError]     = useState<string | null>(null);
	const [authorName, setAuthorName]   = useState('');
	const [message, setMessage]         = useState('');
	const [photo, setPhoto]             = useState<{ file: File; previewUrl: string } | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const { data, error } = await supabase
					.from('shower_posts').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setPosts(data ?? []);
			} catch (err: unknown) {
				setLoadError(err instanceof Error ? err.message : 'Failed to load shower posts.');
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		return () => { if (photo) URL.revokeObjectURL(photo.previewUrl); };
	}, [photo]);

	const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (photo) URL.revokeObjectURL(photo.previewUrl);
		setPhoto({ file, previewUrl: URL.createObjectURL(file) });
		e.target.value = '';
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const name = authorName.trim();
		const msg  = message.trim();
		if (!name || !msg) return;
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			let imageUrl: string | null = null;
			if (photo) imageUrl = await uploadToImageKit(photo.file);

			const { data, error } = await supabase
				.from('shower_posts')
				.insert({ author_name: name, message: msg, image_url: imageUrl })
				.select()
				.single();
			if (error) throw error;

			setPosts(prev => [data, ...prev]);
			setAuthorName('');
			setMessage('');
			if (photo) { URL.revokeObjectURL(photo.previewUrl); setPhoto(null); }
		} catch (err: unknown) {
			setSubmitError(err instanceof Error ? err.message : 'Failed to post. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 pb-4'>
			<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white shadow-lg shadow-[#FF8C69]/30 text-center'>
				<div className='text-4xl mb-2'>🎉</div>
				<h2 className='font-poppins font-extrabold text-xl'>Baby Shower Memories</h2>
				<p className='text-white/80 text-sm font-semibold mt-1'>Share a photo and a message from the celebration!</p>
			</div>

			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
				<form onSubmit={handleSubmit} className='space-y-3'>
					<input type='text' placeholder='Your name' required value={authorName}
						onChange={e => setAuthorName(e.target.value)}
						className='w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#FF8C69] transition-colors' />
					<textarea placeholder='Your message for the family...' required rows={3} value={message}
						onChange={e => setMessage(e.target.value)}
						className='w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-3xl bg-slate-50 focus:outline-none focus:border-[#FF8C69] resize-none transition-colors' />

					<input type='file' accept='image/*' ref={fileInputRef} onChange={handlePhotoChange} className='hidden' />

					{photo ? (
						<div className='relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#FF8C69]/30'>
							<img src={photo.previewUrl} alt='Selected' className='object-cover w-full h-full' />
							{!isSubmitting && (
								<button type='button'
									onClick={() => { URL.revokeObjectURL(photo.previewUrl); setPhoto(null); }}
									className='absolute top-1 right-1 p-0.5 bg-white/80 rounded-full text-slate-600 hover:text-red-500 transition-colors'>
									<X className='w-4 h-4' />
								</button>
							)}
						</div>
					) : (
						<button type='button' disabled={isSubmitting}
							onClick={() => fileInputRef.current?.click()}
							className='flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#FF8C69]/50 hover:text-[#FF8C69] transition-colors text-sm font-semibold'>
							<ImageIcon className='w-4 h-4' /> Add a photo (optional)
						</button>
					)}

					{submitError && <p className='text-xs text-red-500 font-semibold px-2'>{submitError}</p>}
					<button type='submit' disabled={isSubmitting}
						className='w-full py-3 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all disabled:opacity-60'>
						{isSubmitting ? 'Sharing...' : 'Share the Moment 🎉'}
					</button>
				</form>
			</div>

			{isLoading && (
				<div className='flex justify-center py-8'>
					<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
				</div>
			)}
			{loadError && (
				<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center'>
					{loadError}
				</div>
			)}
			{!isLoading && !loadError && posts.length === 0 && (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-4xl mb-3'>📸</div>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No memories yet</p>
					<p className='text-xs text-[#6B7280] font-semibold mt-1'>Be the first to share a moment from the shower!</p>
				</div>
			)}
			{posts.map((post, i) => (
				<div key={post.id} className={`rounded-3xl border p-5 ${COLORS[i % COLORS.length]}`}>
					{post.image_url && (
						<button type='button' onClick={() => onImageClick(post.image_url as string)}
							className='block w-full mb-3 rounded-2xl overflow-hidden'>
							<img src={post.image_url} alt={`Photo from ${post.author_name}`} loading='lazy'
								className='w-full max-h-80 object-cover' />
						</button>
					)}
					<div className='flex items-center justify-between mb-2'>
						<span className='font-poppins font-bold text-[#1A1A2E] text-sm'>{post.author_name}</span>
						<span className='text-[10px] text-[#6B7280] font-semibold'>{relativeTime(post.created_at)}</span>
					</div>
					<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed'>{post.message}</p>
				</div>
			))}
		</div>
	);
};
```

- [ ] **Step 2: Add the tab in `src/components/TabBar.tsx`**

```tsx
import { BookOpen, HandHeart, Home, Library, MessageCircle, PartyPopper } from 'lucide-react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'qa' | 'shower' | 'babybook';
```

```tsx
const TABS: Tab[] = [
	{ id: 'home',     label: 'Home',      Icon: Home },
	{ id: 'timeline', label: 'Timeline',  Icon: BookOpen },
	{ id: 'wishes',   label: 'Blessings', Icon: HandHeart },
	{ id: 'qa',       label: 'Q&A',       Icon: MessageCircle },
	{ id: 'shower',   label: 'Shower',    Icon: PartyPopper },
	{ id: 'babybook', label: 'Baby Book', Icon: Library },
];
```

Note: with 6 tabs, reduce the per-tab horizontal padding from `px-4` to `px-2` so all six fit on a 360px-wide phone.

- [ ] **Step 3: Wire into `App.tsx`**

1. Import: `import { ShowerTab } from './src/components/ShowerTab';`
2. Initialize `activeTab` from the URL hash (replace the current `useState<TabId>('home')`):

```tsx
const [activeTab, setActiveTab] = useState<TabId>(() => {
	if (window.location.hash === '#shower') {
		try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
		return 'shower';
	}
	return 'home';
});
```

3. Add the render (after the `qa` line):

```tsx
{activeTab === 'shower' && (
	<ShowerTab onImageClick={url => setExpandedGallery({ images: [url], index: 0, title: 'Baby Shower' })} />
)}
```

- [ ] **Step 4: TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 5: Commit**

```
git add src/components/ShowerTab.tsx src/components/TabBar.tsx App.tsx
git commit -m "feat: add baby shower tab with photo upload and #shower deep link"
```

---

### Task 5: Pre-Shower Mode

**Files:**
- Modify: `src/components/TabBar.tsx` — accept a `visibleTabs` prop
- Modify: `App.tsx` — gate bypass, reduced tabs, tap-5-times title gesture

**Interfaces:**
- Consumes: `isPreShowerMode()` from `src/config.ts` (Task 1)
- Produces: `TabBar` gains prop `visibleTabs: TabId[]`

- [ ] **Step 1: Add `visibleTabs` prop to `src/components/TabBar.tsx`**

Change the Props type and the render to filter:

```tsx
type Props = { activeTab: TabId; onTabChange: (tab: TabId) => void; visibleTabs: TabId[] };

export const TabBar = ({ activeTab, onTabChange, visibleTabs }: Props) => (
	<nav className='fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-30'>
		<div className='max-w-[600px] mx-auto flex justify-around items-center py-2'>
			{TABS.filter(t => visibleTabs.includes(t.id)).map(({ id, label, Icon }) => {
				...existing button JSX unchanged...
			})}
		</div>
	</nav>
);
```

- [ ] **Step 2: Rewire `App.tsx` for pre-shower mode**

Apply these changes:

1. Import `isPreShowerMode`:

```tsx
import { APP_TITLE, getDaysUntilEDD, isPreShowerMode } from './src/config';
```

2. Add derived mode values after the `isUnlocked` line:

```tsx
const preShower = isPreShowerMode() && !isUnlocked;
const visibleTabs: TabId[] = preShower
	? ['home', 'wishes', 'qa', 'shower']
	: ['home', 'timeline', 'wishes', 'qa', 'shower', 'babybook'];
```

3. Add the tap-5-times gesture state and handler (near the other state declarations):

```tsx
const titleTaps = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
const handleTitleTap = () => {
	if (!preShower) return;
	const t = titleTaps.current;
	t.count += 1;
	if (t.timer) clearTimeout(t.timer);
	if (t.count >= 5) {
		t.count = 0;
		setShowUnlockModal(true);
	} else {
		t.timer = setTimeout(() => { t.count = 0; }, 3000);
	}
};
```

4. Replace the full-screen gate line so pre-shower visitors skip it:

```tsx
if (authState === null && !isPreShowerMode()) return <AuthGate onAuth={handleAuth} />;
```

5. Guard the milestone fetch so it also runs for gate-free pre-shower visitors (change the existing effect):

```tsx
useEffect(() => {
	if (authState === null && !isPreShowerMode()) return;
	fetchMilestones(0, true);
}, [fetchMilestones, authState]);
```

6. Make the `<h1>` title tappable:

```tsx
<h1 onClick={handleTitleTap} className='font-poppins font-extrabold text-lg select-none'>{APP_TITLE}</h1>
```

7. Hide the lock/unlock header button while in pre-shower mode — wrap the existing ternary:

```tsx
{!preShower && (
	isUnlocked ? (
		...existing Lock button...
	) : (
		...existing Unlock button...
	)
)}
```

8. Guard the hidden tabs' renders (defense in depth — a stale `activeTab` should never render a hidden tab):

```tsx
{activeTab === 'timeline' && !preShower && ( <TimelineTab ... /> )}
{activeTab === 'babybook' && !preShower && <BabyBookTab isUnlocked={isUnlocked} />}
```

9. Snap `activeTab` back to home if it points at a tab that just became hidden (e.g. parent locks again). Add an effect:

```tsx
useEffect(() => {
	if (!visibleTabs.includes(activeTab)) setActiveTab('home');
}, [visibleTabs, activeTab]);
```

Note: `visibleTabs` is recreated each render; to keep the effect honest, depend on `preShower` instead if the linter complains — the semantics are identical:

```tsx
useEffect(() => {
	if (!visibleTabs.includes(activeTab)) setActiveTab('home');
	// eslint-disable-next-line react-hooks/exhaustive-deps
}, [preShower, activeTab]);
```

10. Pass `visibleTabs` to the TabBar:

```tsx
<TabBar activeTab={activeTab} onTabChange={setActiveTab} visibleTabs={visibleTabs} />
```

11. The unlock modal (`showUnlockModal && <AuthGate isModal .../>`) needs no change — the tap gesture opens it, and `handleAuth('unlocked')` already restores the full app since `preShower` derives from `!isUnlocked`. However, `AuthGate`'s modal mode currently shows only the password field (`showViewOnly={false}`) — correct for this use.

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 4: Manual smoke test of mode logic (code inspection)**

Verify by reading the final `App.tsx`:
- Pre-shower + never-authed visitor: no gate, 4 tabs, no lock button, title taps open unlock modal
- Pre-shower + unlocked parent: 6 tabs, lock button visible, edit rights
- Post-shower (simulate by temporarily changing `SHOWER_DATE` to a past date — revert after checking): gate on load, 6 tabs after auth

- [ ] **Step 5: Commit**

```
git add src/components/TabBar.tsx App.tsx
git commit -m "feat: pre-shower mode — gate-free reduced tabs until Aug 14, tap-5 unlock gesture"
```

---

### Task 6: Final Check + QR Code + Ship

**Files:**
- Create: `docs/shower-qr.png` (generated asset)

- [ ] **Step 1: Full TypeScript check**

Run: `npx tsc --noEmit` — Expected: 0 errors.

- [ ] **Step 2: Confirm the migration was run**

`supabase/migrations/20260729_add_blessings_polls_shower.sql` must be applied in the Supabase dashboard before merge (user does this manually, as with all prior phases).

- [ ] **Step 3: Generate the printable QR code**

Requires the production site URL (ask the user if unknown). Then:

```
npx qrcode -o docs/shower-qr.png -w 600 "https://<PRODUCTION-URL>/#shower"
```

(`qrcode` runs via npx as a one-off CLI; it is NOT added to package.json. If npx fetch fails, fall back to asking the user to generate one at any QR generator pointing at the same URL.)

Commit the PNG:

```
git add docs/shower-qr.png
git commit -m "docs: add printable baby shower QR code"
```

- [ ] **Step 4: Merge and push**

Merge the feature branch into `main` with `--no-ff`, push `origin main` (Netlify auto-deploys).

- [ ] **Step 5: Deployed verification checklist**

- [ ] Site loads WITHOUT password screen; tab bar shows Home, Blessings, Q&A, Shower only
- [ ] Tapping the title 5 times quickly opens the password modal; unlocking shows all 6 tabs + lock button
- [ ] Locking again returns to the 4-tab gate-free view
- [ ] `<site>/#shower` lands directly on the Shower tab
- [ ] Shower upload works: name + message posts; adding a photo uploads via ImageKit and renders in the feed; tapping the photo opens it full-screen
- [ ] Blessings tab shows category picker; posting a Blessing and an Advice works; filter chips filter; old wishes appear under All only; reactions still work on all posts
- [ ] All five Aditi vs Kartik polls vote and show percentages; refresh keeps your vote

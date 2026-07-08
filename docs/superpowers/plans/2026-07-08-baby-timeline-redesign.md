# Baby Timeline v2 — Redesign & Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the baby timeline app with a Modern Playful aesthetic, mobile-first bottom tab navigation, and three new feature modules: fruit tracker, boy/girl poll, guestbook, and birth capsule.

**Architecture:** `App.tsx` becomes a thin shell managing auth, tab state, and milestone CRUD; each of the four tabs is a self-contained component. `src/config.ts` is the single source of truth for EDD. Supabase gains three new tables (`votes`, `wishes`, `birth_capsule`). Two static data files drive the fruit tracker and weekly facts. No routing library — tab state is `useState`.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CSS v3, Supabase JS client, Lucide React, Google Fonts (Poppins + Nunito).

## Global Constraints

- Tabs indentation in all source files — existing project convention
- TypeScript strict mode — no implicit `any`
- Mobile-first: design for 375px; desktop is `sm:` / `md:` enhancement
- Max content width: `max-w-[600px] mx-auto`
- Colors: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`, bg `#FAFAFA`, pink-vote `#FF8FAB`, blue-vote `#6BAED6`
- Fonts: `font-poppins` for headings, `font-nunito` for body
- TypeScript check: `node .\node_modules\typescript\bin\tsc --noEmit` (from `C:\Projects\timeline`)
- Dev server: `npm run dev`
- Supabase client: imported from `./src/supabaseClient` (root files) or `../supabaseClient` (from `src/components/`)
- EDD: always import from `src/config.ts`, never hardcode elsewhere
- `App.tsx` lives at project root — existing convention preserved
- Auth: view-only users CAN vote and post wishes; only `unlocked` can add/edit milestones or edit birth capsule
- `FloatingBackground` component is intentionally dropped — new design uses solid colors

---

### Task 1: Design Foundation — Fonts, Tailwind, Config, Static Data, Types

**Files:**
- Modify: `index.html`
- Modify: `tailwind.config.js`
- Modify: `index.css`
- Create: `src/config.ts`
- Create: `src/data/fruitData.ts`
- Create: `src/data/weeklyFacts.ts`
- Modify: `src/types.ts`

**Interfaces:**
- Produces: `EDD`, `APP_TITLE`, `getCurrentWeek()`, `getDaysUntilEDD()` from `src/config.ts`
- Produces: `FruitEntry`, `fruitData`, `getFruitForWeek()` from `src/data/fruitData.ts`
- Produces: `WeeklyFact`, `weeklyFacts`, `getFactsForWeek()` from `src/data/weeklyFacts.ts`
- Produces: `Vote`, `Wish`, `BirthCapsule` types appended to `src/types.ts`
- Produces: `font-poppins`, `font-nunito`, `peach`, `mint`, `lavender` Tailwind tokens

- [ ] **Step 1: Add Google Fonts to `index.html`**

Replace full contents of `index.html`:

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="preconnect" href="https://fonts.googleapis.com" />
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
		<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
		<title>Baby Journey ✨</title>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/main.tsx"></script>
	</body>
</html>
```

- [ ] **Step 2: Update `tailwind.config.js`**

Replace full contents:

```js
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './App.tsx', './main.tsx'],
	theme: {
		extend: {
			fontFamily: {
				poppins: ["'Poppins'", 'sans-serif'],
				nunito:  ["'Nunito'", 'sans-serif'],
			},
			colors: {
				cream:    '#fcf8f7',
				peach:    '#FF8C69',
				mint:     '#6CC9C9',
				lavender: '#B39DDB',
			},
		},
	},
	plugins: [],
};
```

- [ ] **Step 3: Add base font to `index.css`**

Add these two lines at the very top of `index.css`, before all existing rules:

```css
html, body { font-family: 'Nunito', sans-serif; }
body { background-color: #FAFAFA; }
```

- [ ] **Step 4: Create `src/config.ts`**

```ts
export const EDD       = '2026-11-09';
export const APP_TITLE = 'Baby Journey ✨';

/** Returns current pregnancy week (4–40) derived from EDD. */
export function getCurrentWeek(): number {
	const daysUntil = getDaysUntilEDD();
	const week = 40 - Math.round(daysUntil / 7);
	return Math.max(4, Math.min(40, week));
}

/** Days remaining until EDD — negative after EDD passes. */
export function getDaysUntilEDD(): number {
	const today = new Date();
	const edd   = new Date(EDD);
	return Math.ceil((edd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
```

- [ ] **Step 5: Create `src/data/fruitData.ts`**

```ts
export type FruitEntry = {
	week:     number;
	fruit:    string;
	emoji:    string;
	lengthCm: number;
	weightG:  number;
	fact:     string;
};

export const fruitData: FruitEntry[] = [
	{ week: 4,  fruit: 'Poppy Seed',       emoji: '🌱', lengthCm: 0.1,  weightG: 0,    fact: 'The embryo is smaller than a grain of rice!' },
	{ week: 5,  fruit: 'Sesame Seed',       emoji: '🌿', lengthCm: 0.2,  weightG: 0,    fact: 'The heart is beginning to form.' },
	{ week: 6,  fruit: 'Sweet Pea',         emoji: '💚', lengthCm: 0.5,  weightG: 0,    fact: 'Tiny arm and leg buds are appearing.' },
	{ week: 7,  fruit: 'Blueberry',         emoji: '🫐', lengthCm: 1.0,  weightG: 0,    fact: 'The brain and face are developing rapidly.' },
	{ week: 8,  fruit: 'Kidney Bean',       emoji: '🫘', lengthCm: 1.6,  weightG: 1,    fact: 'Baby is moving, though you can\'t feel it yet.' },
	{ week: 9,  fruit: 'Grape',             emoji: '🍇', lengthCm: 2.3,  weightG: 2,    fact: 'Tiny fingers and toes are forming.' },
	{ week: 10, fruit: 'Kumquat',           emoji: '🍊', lengthCm: 3.1,  weightG: 4,    fact: 'Baby\'s vital organs are mostly formed.' },
	{ week: 11, fruit: 'Fig',               emoji: '🍂', lengthCm: 4.1,  weightG: 7,    fact: 'Baby can open and close their fingers.' },
	{ week: 12, fruit: 'Lime',              emoji: '🍋', lengthCm: 5.4,  weightG: 14,   fact: 'Risk of miscarriage drops significantly this week.' },
	{ week: 13, fruit: 'Lemon',             emoji: '🍋', lengthCm: 7.4,  weightG: 23,   fact: 'Baby\'s fingerprints are forming — completely unique.' },
	{ week: 14, fruit: 'Peach',             emoji: '🍑', lengthCm: 8.7,  weightG: 43,   fact: 'Baby can make facial expressions now.' },
	{ week: 15, fruit: 'Apple',             emoji: '🍎', lengthCm: 10.1, weightG: 70,   fact: 'Baby is practicing breathing with amniotic fluid.' },
	{ week: 16, fruit: 'Avocado',           emoji: '🥑', lengthCm: 11.6, weightG: 100,  fact: 'You may feel baby\'s first flutters of movement soon!' },
	{ week: 17, fruit: 'Pear',              emoji: '🍐', lengthCm: 13.0, weightG: 140,  fact: 'Baby can now hear sounds from outside the womb.' },
	{ week: 18, fruit: 'Bell Pepper',       emoji: '🫑', lengthCm: 14.2, weightG: 190,  fact: 'Baby is yawning, hiccupping, and sucking their thumb.' },
	{ week: 19, fruit: 'Mango',             emoji: '🥭', lengthCm: 15.3, weightG: 240,  fact: 'Baby\'s senses — taste, smell, touch — are developing.' },
	{ week: 20, fruit: 'Banana',            emoji: '🍌', lengthCm: 16.4, weightG: 300,  fact: 'Halfway there! Baby now has a sleep-wake cycle.' },
	{ week: 21, fruit: 'Carrot',            emoji: '🥕', lengthCm: 26.7, weightG: 360,  fact: 'Baby can swallow and taste the amniotic fluid.' },
	{ week: 22, fruit: 'Papaya',            emoji: '🍈', lengthCm: 27.8, weightG: 430,  fact: 'Baby\'s grip is getting stronger every day.' },
	{ week: 23, fruit: 'Large Mango',       emoji: '🥭', lengthCm: 28.9, weightG: 501,  fact: 'Your baby can now hear your voice — talk to them!' },
	{ week: 24, fruit: 'Ear of Corn',       emoji: '🌽', lengthCm: 30.0, weightG: 600,  fact: 'Baby\'s face is fully formed, complete with eyebrows.' },
	{ week: 25, fruit: 'Cauliflower',       emoji: '🥦', lengthCm: 34.6, weightG: 660,  fact: 'Baby is developing a sense of direction.' },
	{ week: 26, fruit: 'Scallion',          emoji: '🌿', lengthCm: 35.6, weightG: 760,  fact: 'Baby\'s eyes are starting to open for the first time!' },
	{ week: 27, fruit: 'Rutabaga',          emoji: '🥔', lengthCm: 36.6, weightG: 875,  fact: 'Baby is practicing breathing movements.' },
	{ week: 28, fruit: 'Eggplant',          emoji: '🍆', lengthCm: 37.6, weightG: 1005, fact: 'Baby can blink and has developed eyelashes.' },
	{ week: 29, fruit: 'Butternut Squash',  emoji: '🎃', lengthCm: 38.6, weightG: 1153, fact: 'Baby\'s brain is growing rapidly.' },
	{ week: 30, fruit: 'Cabbage',           emoji: '🥬', lengthCm: 39.9, weightG: 1319, fact: 'Baby is putting on fat to regulate temperature.' },
	{ week: 31, fruit: 'Coconut',           emoji: '🥥', lengthCm: 41.1, weightG: 1502, fact: 'Baby can process information from all five senses.' },
	{ week: 32, fruit: 'Jicama',            emoji: '🥔', lengthCm: 42.4, weightG: 1702, fact: 'Baby is practicing breathing and sucking every day.' },
	{ week: 33, fruit: 'Pineapple',         emoji: '🍍', lengthCm: 43.7, weightG: 1918, fact: 'Baby\'s bones are hardening — except the skull.' },
	{ week: 34, fruit: 'Cantaloupe',        emoji: '🍈', lengthCm: 45.0, weightG: 2146, fact: 'Baby\'s central nervous system is maturing.' },
	{ week: 35, fruit: 'Honeydew Melon',    emoji: '🍈', lengthCm: 46.2, weightG: 2383, fact: 'Baby is running out of room — kicks feel stronger.' },
	{ week: 36, fruit: 'Head of Lettuce',   emoji: '🥬', lengthCm: 47.4, weightG: 2622, fact: 'Baby is early term — lungs are nearly ready!' },
	{ week: 37, fruit: 'Swiss Chard',       emoji: '🥬', lengthCm: 48.6, weightG: 2859, fact: 'Baby is full term — they could arrive any day!' },
	{ week: 38, fruit: 'Leek',              emoji: '🌿', lengthCm: 49.8, weightG: 3083, fact: 'Baby\'s grip is incredibly strong now.' },
	{ week: 39, fruit: 'Mini Watermelon',   emoji: '🍉', lengthCm: 50.7, weightG: 3288, fact: 'Baby has shed most of the vernix on their skin.' },
	{ week: 40, fruit: 'Watermelon',        emoji: '🍉', lengthCm: 51.2, weightG: 3462, fact: 'Baby is fully ready to meet the world! 🎉' },
];

export function getFruitForWeek(week: number): FruitEntry {
	const clamped = Math.max(4, Math.min(40, week));
	return fruitData.find(f => f.week === clamped) ?? fruitData[fruitData.length - 1];
}
```

- [ ] **Step 6: Create `src/data/weeklyFacts.ts`**

```ts
export type WeeklyFact = {
	week:  number;
	facts: [string, string, string];
};

export const weeklyFacts: WeeklyFact[] = [
	{ week: 4,  facts: ['The embryo is smaller than a grain of rice', 'The neural tube — future brain and spine — is forming', 'Implantation is complete and pregnancy hormones are rising'] },
	{ week: 5,  facts: ['Baby\'s heart is forming and will soon start beating', 'Tiny arm and leg buds are just beginning to appear', 'The placenta is developing to nourish your baby'] },
	{ week: 6,  facts: ['Baby\'s heart is beating about 100–160 times per minute', 'The face is starting to form, including the jaw and cheeks', 'Tiny kidneys are beginning to develop'] },
	{ week: 7,  facts: ['Baby has doubled in size since last week', 'The brain is growing at an astonishing rate', 'Hands and feet are emerging from the arm and leg buds'] },
	{ week: 8,  facts: ['All essential organs have begun forming', 'Baby is constantly moving, though you can\'t feel it yet', 'Fingers and toes are webbed but developing rapidly'] },
	{ week: 9,  facts: ['Baby can now flex their arms at the elbows', 'Tiny earlobes are forming', 'The embryo is now officially called a fetus'] },
	{ week: 10, facts: ['Baby\'s vital organs are mostly formed', 'Fingernails are beginning to grow', 'Baby can now make small movements in the womb'] },
	{ week: 11, facts: ['Baby can open and close their fists', 'The skeleton is starting to harden into bone', 'Hiccups may begin as baby\'s diaphragm develops'] },
	{ week: 12, facts: ['Risk of miscarriage drops significantly this week', 'Baby\'s reflexes are developing — touching the lips causes a sucking reflex', 'The digestive system is practicing contractions'] },
	{ week: 13, facts: ['Baby\'s fingerprints are forming — completely unique to them', 'Vocal cords are developing', 'Baby\'s intestines are moving from the cord into the abdomen'] },
	{ week: 14, facts: ['Baby can make facial expressions', 'The roof of the mouth is fully formed', 'You may start to show a baby bump this week'] },
	{ week: 15, facts: ['Baby is practicing breathing with amniotic fluid', 'Tiny legs are now longer than the arms', 'Baby can sense light through closed eyelids'] },
	{ week: 16, facts: ['You may feel baby\'s first flutters — like butterflies!', 'Baby\'s eyes can make small movements from side to side', 'The nervous system is rapidly connecting to muscles'] },
	{ week: 17, facts: ['Baby can now hear sounds from outside the womb', 'Fat is beginning to develop under the skin', 'Baby\'s skeleton is changing from cartilage to bone'] },
	{ week: 18, facts: ['Baby is yawning, hiccupping, and sucking their thumb', 'Unique fingerprints are now set for life', 'Baby can hear your heartbeat and digestive sounds'] },
	{ week: 19, facts: ['Baby\'s senses of taste, smell, and touch are developing', 'Vernix — a waxy protective coating — is forming on baby\'s skin', 'Baby can hear voices from outside the womb clearly'] },
	{ week: 20, facts: ['You\'re halfway there! 🎉', 'Baby has a regular sleep-wake cycle now', 'The uterus has risen to belly button level'] },
	{ week: 21, facts: ['Baby can swallow and taste the amniotic fluid', 'Taste buds are fully formed — baby may taste what you eat!', 'Eyebrows are visible now'] },
	{ week: 22, facts: ['Baby\'s grip is getting stronger every day', 'Baby\'s eyes are formed, though the irises lack pigment', 'The senses of smell and taste continue developing'] },
	{ week: 23, facts: ['Your baby can now hear your voice — talk and sing to them!', 'Eyebrows and eyelashes are now visible', 'Baby\'s skin is still wrinkled as fat fills in gradually'] },
	{ week: 24, facts: ['Baby\'s face is fully formed, complete with eyebrows and lashes', 'Ears are fully developed — baby recognizes familiar voices', 'Lungs are producing surfactant to prepare for breathing air'] },
	{ week: 25, facts: ['Baby is beginning to develop a sense of direction', 'Baby may respond to familiar sounds and voices', 'Hands are fully developed — baby explores their environment'] },
	{ week: 26, facts: ['Baby\'s eyes are starting to open for the first time!', 'The retinas are forming to detect light and colour', 'Brain activity is increasing rapidly this week'] },
	{ week: 27, facts: ['Baby is practicing breathing movements in the womb', 'Eyes can open and close, and detect light', 'Baby is now capable of hiccupping — you may feel it!'] },
	{ week: 28, facts: ['Baby can blink and has developed eyelashes', 'The brain is developing billions of neurons', 'Baby may react to sounds with kicks and movement'] },
	{ week: 29, facts: ['Baby\'s brain is growing at an incredible rate', 'Baby is building up brown fat to help regulate temperature', 'Muscles and lungs are continuing to mature'] },
	{ week: 30, facts: ['Baby is putting on fat to regulate temperature after birth', 'Baby recognizes your voice and may respond to music', 'The brain now controls breathing and body temperature'] },
	{ week: 31, facts: ['Baby can process information from all five senses', 'Baby is going through REM sleep cycles', 'Antibodies are being passed from you to baby'] },
	{ week: 32, facts: ['Baby is practicing breathing and sucking every day', 'Baby\'s toenails have grown to the tips of the toes', 'Baby is running out of space but still very active'] },
	{ week: 33, facts: ['Baby\'s bones are hardening everywhere except the skull', 'The skull stays flexible to fit through the birth canal', 'Baby is gaining about 250g per week now'] },
	{ week: 34, facts: ['Baby\'s central nervous system is maturing rapidly', 'Most babies are now in a head-down position', 'Baby\'s fingernails have grown to the tips of the fingers'] },
	{ week: 35, facts: ['Baby may feel less active as space runs out — kicks feel stronger', 'Baby\'s kidneys are fully developed', 'Almost all organs are fully functional except the lungs'] },
	{ week: 36, facts: ['Baby is early term — lungs are nearly ready!', 'Baby is shedding the lanugo that covered their body', 'Baby is practicing sucking and swallowing for feeding'] },
	{ week: 37, facts: ['Baby is full term — they could arrive any day!', 'Baby\'s immune system is continuing to strengthen', 'Baby is sleeping 90% of the time, storing energy for birth'] },
	{ week: 38, facts: ['Baby\'s grip is incredibly strong — they\'ll hold your finger tight', 'Baby is shedding vernix and lanugo', 'The brain and nervous system are fine-tuning connections'] },
	{ week: 39, facts: ['Baby has shed most of the vernix coating their skin', 'Baby is fully developed and adding a little more weight', 'You may notice baby dropping lower into the pelvis'] },
	{ week: 40, facts: ['Baby is fully cooked and ready to meet the world! 🎉', 'The placenta is passing antibodies to protect baby after birth', 'Baby knows your voice — they\'ll recognize it at birth'] },
];

export function getFactsForWeek(week: number): WeeklyFact {
	const clamped = Math.max(4, Math.min(40, week));
	return weeklyFacts.find(f => f.week === clamped) ?? weeklyFacts[weeklyFacts.length - 1];
}
```

- [ ] **Step 7: Append new types to `src/types.ts`**

Add to the end of `src/types.ts` (keep all existing exports):

```ts
export type Vote = {
	id:         string;
	voter_id:   string;
	choice:     'boy' | 'girl';
	voter_name: string | null;
	created_at: string;
};

export type Wish = {
	id:          string;
	author_name: string;
	message:     string;
	created_at:  string;
};

export type BirthCapsule = {
	id:               string;
	birth_date:       string | null;
	birth_time:       string | null;
	weight_kg:        number | null;
	length_cm:        number | null;
	location:         string | null;
	headlines:        string[];
	sports_results:   string[];
	top_song:         string | null;
	top_movie:        string | null;
	famous_birthdays: string[];
	weather:          string | null;
	notes:            string | null;
	created_at:       string;
};
```

- [ ] **Step 8: Verify TypeScript**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```
git add index.html tailwind.config.js index.css src/config.ts src/data/fruitData.ts src/data/weeklyFacts.ts src/types.ts
git commit -m "feat: design foundation — fonts, tailwind config, EDD config, static data, new types"
```

---

### Task 2: Database Migration

**Files:**
- Create: `supabase/migrations/20260708_add_votes_wishes_birth_capsule.sql`

**Interfaces:**
- Produces: `votes`, `wishes`, `birth_capsule` tables used by Tasks 5, 6, 7

- [ ] **Step 1: Create migration file**

Create directory `supabase/migrations/` at project root. Create `supabase/migrations/20260708_add_votes_wishes_birth_capsule.sql`:

```sql
create table if not exists votes (
	id          uuid primary key default gen_random_uuid(),
	voter_id    text not null,
	choice      text not null check (choice in ('boy', 'girl')),
	voter_name  text,
	created_at  timestamptz default now(),
	unique (voter_id)
);

create table if not exists wishes (
	id          uuid primary key default gen_random_uuid(),
	author_name text not null,
	message     text not null,
	created_at  timestamptz default now()
);

create table if not exists birth_capsule (
	id                uuid primary key default gen_random_uuid(),
	birth_date        date,
	birth_time        text,
	weight_kg         numeric,
	length_cm         numeric,
	location          text,
	headlines         text[] default '{}',
	sports_results    text[] default '{}',
	top_song          text,
	top_movie         text,
	famous_birthdays  text[] default '{}',
	weather           text,
	notes             text,
	created_at        timestamptz default now()
);
```

- [ ] **Step 2: Run in Supabase**

Open Supabase dashboard → SQL Editor → New Query → paste the file contents → Run. Verify all three tables appear in Table Editor.

- [ ] **Step 3: Commit**

```
git add supabase/migrations/20260708_add_votes_wishes_birth_capsule.sql
git commit -m "feat: add votes, wishes, birth_capsule migration SQL"
```

---

### Task 3: App Shell — TabBar + App.tsx Refactor

**Files:**
- Create: `src/components/TabBar.tsx`
- Modify: `App.tsx`
- Create (stubs): `src/components/HomeTab.tsx`, `src/components/TimelineTab.tsx`, `src/components/WishesTab.tsx`, `src/components/BabyBookTab.tsx`

**Interfaces:**
- Produces: `TabId` type exported from `src/components/TabBar.tsx`
- Produces: App shell with tab routing; passes milestone CRUD props to `TimelineTab`

- [ ] **Step 1: Create `src/components/TabBar.tsx`**

```tsx
import { BookOpen, Heart, Home, Library } from 'lucide-react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'babybook';

type Tab = { id: TabId; label: string; Icon: React.FC<{ className?: string }> };

const TABS: Tab[] = [
	{ id: 'home',     label: 'Home',      Icon: Home },
	{ id: 'timeline', label: 'Timeline',  Icon: BookOpen },
	{ id: 'wishes',   label: 'Wishes',    Icon: Heart },
	{ id: 'babybook', label: 'Baby Book', Icon: Library },
];

type Props = { activeTab: TabId; onTabChange: (tab: TabId) => void };

export const TabBar = ({ activeTab, onTabChange }: Props) => (
	<nav className='fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 z-30'>
		<div className='max-w-[600px] mx-auto flex justify-around items-center py-2'>
			{TABS.map(({ id, label, Icon }) => {
				const active = activeTab === id;
				return (
					<button
						key={id}
						onClick={() => onTabChange(id)}
						className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-colors ${
							active ? 'text-[#FF8C69]' : 'text-slate-400'
						}`}>
						<Icon className={`w-6 h-6 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
						<span className='text-[10px] font-bold tracking-wide'>{label}</span>
					</button>
				);
			})}
		</div>
	</nav>
);
```

- [ ] **Step 2: Create stub tab components**

Create `src/components/HomeTab.tsx`:
```tsx
export const HomeTab = () => (
	<div className='py-8 text-center text-slate-400 font-bold'>Home coming soon</div>
);
```

Create `src/components/TimelineTab.tsx`:
```tsx
import { Milestone } from '../types';
type Props = {
	milestones: Milestone[]; isLoading: boolean; error: string | null;
	hasMore: boolean; isUnlocked: boolean;
	onLoadMore: () => void;
	onImageClick: (images: string[], idx: number, title: string) => void;
	onEditClick: (m: Milestone) => void;
	onAddClick: () => void;
};
export const TimelineTab = (_props: Props) => (
	<div className='py-8 text-center text-slate-400 font-bold'>Timeline coming soon</div>
);
```

Create `src/components/WishesTab.tsx`:
```tsx
export const WishesTab = () => (
	<div className='py-8 text-center text-slate-400 font-bold'>Wishes coming soon</div>
);
```

Create `src/components/BabyBookTab.tsx`:
```tsx
export const BabyBookTab = (_props: { isUnlocked: boolean }) => (
	<div className='py-8 text-center text-slate-400 font-bold'>Baby Book coming soon</div>
);
```

- [ ] **Step 3: Rewrite `App.tsx`**

Replace the full contents of `App.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate } from './src/components/AuthGate';
import { BabyBookTab } from './src/components/BabyBookTab';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { HomeTab } from './src/components/HomeTab';
import { MemoryModal } from './src/components/MemoryModal';
import { TabBar, TabId } from './src/components/TabBar';
import { TimelineTab } from './src/components/TimelineTab';
import { WishesTab } from './src/components/WishesTab';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';
import { PAGE_SIZE } from './src/constants';
import { APP_TITLE, getDaysUntilEDD } from './src/config';

const AUTH_STORAGE_KEY = 'timeline_auth';
type AuthState = 'unlocked' | 'view-only' | null;

const App = () => {
	const [milestones, setMilestones]   = useState<Milestone[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [error, setError]             = useState<string | null>(null);
	const [page, setPage]               = useState(0);
	const [hasMore, setHasMore]         = useState(true);
	const [activeTab, setActiveTab]     = useState<TabId>('home');
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [expandedGallery, setExpandedGallery] = useState<{ images: string[]; index: number; title: string } | null>(null);

	const [editingMilestoneState, setEditingMilestoneState] = useState<Milestone | null>(null);
	const editingMilestoneRef = useRef<Milestone | null>(null);
	const setEditingMilestone = (m: Milestone | null) => {
		editingMilestoneRef.current = m;
		setEditingMilestoneState(m);
	};

	const [authState, setAuthState] = useState<AuthState>(() => {
		try {
			const stored = localStorage.getItem(AUTH_STORAGE_KEY);
			if (stored === 'unlocked' || stored === 'view-only') return stored;
		} catch { /* localStorage unavailable */ }
		return null;
	});

	const [showUnlockModal, setShowUnlockModal] = useState(false);
	const isUnlocked = authState === 'unlocked';

	const handleAuth  = (state: 'unlocked' | 'view-only') => setAuthState(state);
	const handleLock  = () => {
		try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
		setAuthState(null);
	};

	const fetchMilestones = useCallback(async (pageNum: number, replace: boolean) => {
		try {
			if (replace) setIsLoading(true);
			setError(null);
			const from = pageNum * PAGE_SIZE;
			const { data, error: supaError } = await supabase
				.from('milestones')
				.select('*')
				.order('date', { ascending: true })
				.order('id',   { ascending: true })
				.range(from, from + PAGE_SIZE - 1);
			if (supaError) throw supaError;
			if (data) {
				setMilestones(prev => replace ? data : [...prev, ...data]);
				setHasMore(data.length === PAGE_SIZE);
			}
		} catch (err: any) {
			setError(err.message || 'Failed to connect to the database.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (authState === null) return;
		fetchMilestones(0, true);
	}, [fetchMilestones, authState]);

	const handleLoadMore = useCallback(() => {
		const next = page + 1;
		setPage(next);
		fetchMilestones(next, false);
	}, [page, fetchMilestones]);

	const handleSaveMilestone = useCallback(async (eventData: NewEvent) => {
		const editing = editingMilestoneRef.current;
		const eventToSave: NewEvent = { ...eventData, image: eventData.images[0] ?? null };
		if (editing) {
			const { error } = await supabase.from('milestones').update(eventToSave).eq('id', editing.id);
			if (error) throw error;
			if (!hasMore) {
				setMilestones(prev =>
					prev
						.map(m => (m.id === editing.id ? { ...eventToSave, id: editing.id } : m))
						.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id),
				);
			} else {
				setPage(0); fetchMilestones(0, true);
			}
		} else {
			const { data, error } = await supabase.from('milestones').insert([eventToSave]).select();
			if (error) throw error;
			if (data) {
				if (!hasMore) {
					setMilestones(prev =>
						[...prev, data[0]].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id,
						),
					);
				} else {
					setPage(0); fetchMilestones(0, true);
				}
			}
		}
		setIsModalOpen(false);
		setEditingMilestone(null);
	}, [hasMore, fetchMilestones]);

	const handleDeleteMilestone = useCallback(async (id: number) => {
		const { error } = await supabase.from('milestones').delete().eq('id', id);
		if (error) throw error;
		setMilestones(prev => prev.filter(m => m.id !== id));
		setIsModalOpen(false);
		setEditingMilestone(null);
	}, []);

	const daysLeft = getDaysUntilEDD();

	if (authState === null) return <AuthGate onAuth={handleAuth} />;

	return (
		<div className='min-h-screen bg-[#FAFAFA] font-nunito text-[#1A1A2E] pb-24'>
			<header className='sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100'>
				<div className='max-w-[600px] mx-auto flex items-center justify-between px-4 py-3'>
					<h1 className='font-poppins font-extrabold text-lg'>{APP_TITLE}</h1>
					<div className='flex items-center gap-2'>
						{daysLeft > 0 && (
							<span className='hidden sm:inline-flex items-center gap-1 bg-[#FF8C69]/10 text-[#FF8C69] text-xs font-bold px-3 py-1 rounded-full'>
								{daysLeft} days to go
							</span>
						)}
						{isUnlocked ? (
							<button onClick={handleLock}
								className='text-xs font-bold text-[#FF8C69] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors'>
								🔒 Lock
							</button>
						) : (
							<button onClick={() => setShowUnlockModal(true)}
								className='text-xs font-bold text-[#FF8C69] bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors'>
								🔑 Unlock
							</button>
						)}
					</div>
				</div>
			</header>

			<main className='max-w-[600px] mx-auto px-4 pt-4'>
				{activeTab === 'home'     && <HomeTab />}
				{activeTab === 'timeline' && (
					<TimelineTab
						milestones={milestones}
						isLoading={isLoading}
						error={error}
						hasMore={hasMore}
						isUnlocked={isUnlocked}
						onLoadMore={handleLoadMore}
						onImageClick={(images, idx, title) => setExpandedGallery({ images, index: idx, title })}
						onEditClick={m => { setEditingMilestone(m); setIsModalOpen(true); }}
						onAddClick={() => { setEditingMilestone(null); setIsModalOpen(true); }}
					/>
				)}
				{activeTab === 'wishes'   && <WishesTab />}
				{activeTab === 'babybook' && <BabyBookTab isUnlocked={isUnlocked} />}
			</main>

			<TabBar activeTab={activeTab} onTabChange={setActiveTab} />

			{isModalOpen && (
				<MemoryModal
					editingMilestone={editingMilestoneState}
					onClose={() => setIsModalOpen(false)}
					onSave={handleSaveMilestone}
					onDelete={handleDeleteMilestone}
				/>
			)}
			{expandedGallery && (
				<ExpandedImageModal
					images={expandedGallery.images}
					initialIndex={expandedGallery.index}
					title={expandedGallery.title}
					onClose={() => setExpandedGallery(null)}
				/>
			)}
			{showUnlockModal && (
				<AuthGate
					isModal={true}
					onAuth={state => { handleAuth(state); setShowUnlockModal(false); }}
					onClose={() => setShowUnlockModal(false)}
				/>
			)}
		</div>
	);
};

export default App;
```

- [ ] **Step 4: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Smoke-test**

```
npm run dev
```

Verify: auth gate shows → after login, compact header + four bottom tabs → each tab shows its placeholder text.

- [ ] **Step 6: Commit**

```
git add src/components/TabBar.tsx src/components/HomeTab.tsx src/components/TimelineTab.tsx src/components/WishesTab.tsx src/components/BabyBookTab.tsx App.tsx
git commit -m "feat: app shell with bottom tabs, compact header, stub tab components"
```

---

### Task 4: Home Tab — Countdown, Fruit Tracker, Weekly Facts

**Files:**
- Create: `src/components/home/CountdownHero.tsx`
- Create: `src/components/home/FruitTracker.tsx`
- Create: `src/components/home/WeeklyFacts.tsx`
- Modify: `src/components/HomeTab.tsx`

**Interfaces:**
- Consumes: `getDaysUntilEDD`, `getCurrentWeek` from `../../config`
- Consumes: `getFruitForWeek` from `../../data/fruitData`
- Consumes: `getFactsForWeek` from `../../data/weeklyFacts`
- Produces: Static Home tab sections (poll added in Task 5)

- [ ] **Step 1: Create `src/components/home/CountdownHero.tsx`**

```tsx
import { getDaysUntilEDD } from '../../config';

export const CountdownHero = () => {
	const days      = getDaysUntilEDD();
	const isArrived = days <= 0;

	return (
		<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white text-center shadow-lg shadow-[#FF8C69]/30'>
			{isArrived ? (
				<>
					<div className='text-5xl mb-2'>🎉</div>
					<h2 className='font-poppins font-extrabold text-3xl'>Baby is here!</h2>
					<p className='text-white/80 mt-1 font-semibold'>Welcome to the world, little one!</p>
				</>
			) : (
				<>
					<p className='text-white/70 font-bold text-xs uppercase tracking-widest mb-1'>Baby arrives in</p>
					<div className='font-poppins font-extrabold text-7xl leading-none'>{days}</div>
					<p className='text-white/90 font-bold text-xl mt-1'>{days === 1 ? 'day' : 'days'} to go 🌟</p>
					<p className='text-white/50 text-xs mt-3'>Estimated due date: 9 November 2026</p>
				</>
			)}
		</div>
	);
};
```

- [ ] **Step 2: Create `src/components/home/FruitTracker.tsx`**

```tsx
import { getCurrentWeek } from '../../config';
import { getFruitForWeek } from '../../data/fruitData';

export const FruitTracker = () => {
	const week  = getCurrentWeek();
	const entry = getFruitForWeek(week);

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<div className='flex items-center justify-between mb-3'>
				<h2 className='font-poppins font-bold text-[#1A1A2E] text-base'>Baby this week</h2>
				<span className='bg-[#6CC9C9]/15 text-[#6CC9C9] text-xs font-bold px-3 py-1 rounded-full'>
					Week {week}
				</span>
			</div>
			<div className='flex items-center gap-4'>
				<div className='text-6xl'>{entry.emoji}</div>
				<div className='flex-1 min-w-0'>
					<p className='font-poppins font-extrabold text-2xl text-[#1A1A2E] leading-tight'>{entry.fruit}</p>
					<div className='flex gap-2 mt-1 flex-wrap'>
						<span className='text-xs font-semibold text-[#6B7280] bg-slate-50 px-2 py-0.5 rounded-full'>
							{entry.lengthCm} cm
						</span>
						{entry.weightG > 0 && (
							<span className='text-xs font-semibold text-[#6B7280] bg-slate-50 px-2 py-0.5 rounded-full'>
								~{entry.weightG}g
							</span>
						)}
					</div>
				</div>
			</div>
			<p className='mt-4 text-sm text-[#6B7280] font-semibold leading-relaxed bg-[#6CC9C9]/10 rounded-2xl px-4 py-3'>
				✨ {entry.fact}
			</p>
		</div>
	);
};
```

- [ ] **Step 3: Create `src/components/home/WeeklyFacts.tsx`**

```tsx
import { getCurrentWeek } from '../../config';
import { getFactsForWeek } from '../../data/weeklyFacts';

export const WeeklyFacts = () => {
	const week         = getCurrentWeek();
	const { facts }    = getFactsForWeek(week);

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-4'>This week in pregnancy</h2>
			<ul className='space-y-3'>
				{facts.map((fact, i) => (
					<li key={i} className='flex items-start gap-3'>
						<span className='shrink-0 w-6 h-6 rounded-full bg-[#B39DDB]/20 text-[#B39DDB] flex items-center justify-center text-xs font-bold mt-0.5'>
							{i + 1}
						</span>
						<p className='text-sm text-[#6B7280] font-semibold leading-relaxed'>{fact}</p>
					</li>
				))}
			</ul>
		</div>
	);
};
```

- [ ] **Step 4: Update `src/components/HomeTab.tsx`**

```tsx
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
```

- [ ] **Step 5: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

- [ ] **Step 6: Smoke-test**

```
npm run dev
```

Home tab should show: peach countdown card → 🥭 Large Mango week 23 card → three weekly facts bullets.

- [ ] **Step 7: Commit**

```
git add src/components/home/CountdownHero.tsx src/components/home/FruitTracker.tsx src/components/home/WeeklyFacts.tsx src/components/HomeTab.tsx
git commit -m "feat: countdown hero, fruit tracker, weekly facts on home tab"
```

---

### Task 5: Home Tab — Boy/Girl Poll

**Files:**
- Create: `src/components/home/PollWidget.tsx`
- Modify: `src/components/HomeTab.tsx`

**Interfaces:**
- Consumes: `supabase` from `../../supabaseClient`, `Vote` from `../../types`
- Produces: Poll with Supabase persistence, duplicate prevention via localStorage UUID, live realtime updates

- [ ] **Step 1: Create `src/components/home/PollWidget.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Vote } from '../../types';

const VOTER_ID_KEY = 'timeline_vote_id';

function getOrCreateVoterId(): string {
	try {
		const existing = localStorage.getItem(VOTER_ID_KEY);
		if (existing) return existing;
		const id = crypto.randomUUID();
		localStorage.setItem(VOTER_ID_KEY, id);
		return id;
	} catch {
		return crypto.randomUUID();
	}
}

type PollState =
	| { status: 'loading' }
	| { status: 'ready'; voterName: string }
	| { status: 'submitting' }
	| { status: 'voted'; choice: 'boy' | 'girl'; boys: number; girls: number }
	| { status: 'error'; message: string };

const fetchCounts = async (): Promise<{ boys: number; girls: number }> => {
	const { data, error } = await supabase.from('votes').select('choice');
	if (error) throw error;
	const rows = (data ?? []) as Pick<Vote, 'choice'>[];
	return {
		boys:  rows.filter(r => r.choice === 'boy').length,
		girls: rows.filter(r => r.choice === 'girl').length,
	};
};

export const PollWidget = () => {
	const voterId = getOrCreateVoterId();
	const [state, setState] = useState<PollState>({ status: 'loading' });

	useEffect(() => {
		const init = async () => {
			try {
				const { data: existing } = await supabase
					.from('votes').select('choice').eq('voter_id', voterId).maybeSingle();
				if (existing) {
					const counts = await fetchCounts();
					setState({ status: 'voted', choice: existing.choice, ...counts });
				} else {
					setState({ status: 'ready', voterName: '' });
				}
			} catch {
				setState({ status: 'ready', voterName: '' });
			}
		};
		void init();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const channel = supabase
			.channel('votes-realtime')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, async () => {
				setState(prev => {
					if (prev.status !== 'voted') return prev;
					fetchCounts().then(counts => setState(p => p.status === 'voted' ? { ...p, ...counts } : p)).catch(() => {});
					return prev;
				});
			})
			.subscribe();
		return () => { void supabase.removeChannel(channel); };
	}, []);

	const handleVote = async (choice: 'boy' | 'girl') => {
		if (state.status !== 'ready') return;
		const voterName = state.voterName.trim() || null;
		setState({ status: 'submitting' });
		try {
			const { error } = await supabase.from('votes').insert({ voter_id: voterId, choice, voter_name: voterName });
			if (error) throw error;
			const counts = await fetchCounts();
			setState({ status: 'voted', choice, ...counts });
		} catch (err: any) {
			setState({ status: 'error', message: err.message || 'Vote failed. Try again.' });
		}
	};

	const total   = state.status === 'voted' ? state.boys + state.girls : 0;
	const boyPct  = total > 0 && state.status === 'voted' ? Math.round((state.boys  / total) * 100) : 50;
	const girlPct = total > 0 && state.status === 'voted' ? Math.round((state.girls / total) * 100) : 50;

	return (
		<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
			<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-1'>Boy or Girl? 🤔</h2>
			<p className='text-xs text-[#6B7280] font-semibold mb-4'>Cast your prediction!</p>

			{(state.status === 'loading' || state.status === 'submitting') && (
				<div className='flex justify-center py-6'>
					<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
				</div>
			)}

			{state.status === 'ready' && (
				<>
					<input
						type='text'
						placeholder='Your name (optional)'
						value={state.voterName}
						onChange={e => setState({ status: 'ready', voterName: e.target.value })}
						className='w-full px-4 py-2.5 mb-4 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#6CC9C9] transition-colors'
					/>
					<div className='grid grid-cols-2 gap-3'>
						<button onClick={() => handleVote('boy')}
							className='flex items-center justify-center gap-2 py-4 rounded-2xl font-poppins font-bold text-white bg-[#6BAED6] hover:bg-[#5a9ec6] active:scale-95 transition-all text-lg shadow-md shadow-[#6BAED6]/30'>
							💙 Boy
						</button>
						<button onClick={() => handleVote('girl')}
							className='flex items-center justify-center gap-2 py-4 rounded-2xl font-poppins font-bold text-white bg-[#FF8FAB] hover:bg-[#ff7a9c] active:scale-95 transition-all text-lg shadow-md shadow-[#FF8FAB]/30'>
							🩷 Girl
						</button>
					</div>
				</>
			)}

			{state.status === 'voted' && (
				<>
					<div className='mb-2 flex justify-between text-xs font-bold text-[#6B7280]'>
						<span>💙 {boyPct}% ({state.boys})</span>
						<span>{total} votes</span>
						<span>{girlPct}% ({state.girls}) 🩷</span>
					</div>
					<div className='h-5 rounded-full overflow-hidden bg-[#FF8FAB]'>
						<div className='h-full bg-[#6BAED6] rounded-l-full transition-all duration-700' style={{ width: `${boyPct}%` }} />
					</div>
					<p className='mt-3 text-xs text-center text-[#6B7280] font-semibold'>
						You voted: {state.choice === 'boy' ? '💙 Boy' : '🩷 Girl'}
					</p>
				</>
			)}

			{state.status === 'error' && (
				<div className='text-xs text-red-500 font-semibold text-center bg-red-50 rounded-2xl px-4 py-3'>
					{state.message}
					<button onClick={() => setState({ status: 'ready', voterName: '' })}
						className='block mx-auto mt-1 text-[#FF8C69] underline'>Try again</button>
				</div>
			)}
		</div>
	);
};
```

- [ ] **Step 2: Add PollWidget to `src/components/HomeTab.tsx`**

```tsx
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
```

- [ ] **Step 3: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

- [ ] **Step 4: Smoke-test**

```
npm run dev
```

Vote Boy or Girl → results bar appears. Open incognito → results show live. Check Supabase `votes` table for the row. Refresh → still shows results (vote persisted).

- [ ] **Step 5: Commit**

```
git add src/components/home/PollWidget.tsx src/components/HomeTab.tsx
git commit -m "feat: boy/girl poll with Supabase, localStorage dedup, realtime updates"
```

---

### Task 6: Wishes Tab — Guestbook

**Files:**
- Modify: `src/components/WishesTab.tsx`

**Interfaces:**
- Consumes: `supabase` from `../supabaseClient`, `Wish` from `../types`
- Produces: Post form + scrolling feed with optimistic updates; pastel card colors cycle

- [ ] **Step 1: Replace `src/components/WishesTab.tsx`**

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wish } from '../types';

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

export const WishesTab = () => {
	const [wishes, setWishes]           = useState<Wish[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [loadError, setLoadError]     = useState<string | null>(null);
	const [authorName, setAuthorName]   = useState('');
	const [message, setMessage]         = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const { data, error } = await supabase
					.from('wishes').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setWishes(data ?? []);
			} catch (err: any) {
				setLoadError(err.message || 'Failed to load wishes.');
			} finally {
				setIsLoading(false);
			}
		};
		void load();
	}, []);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const name = authorName.trim();
		const msg  = message.trim();
		if (!name || !msg) return;
		setIsSubmitting(true);
		setSubmitError(null);

		const optimistic: Wish = {
			id: crypto.randomUUID(), author_name: name, message: msg,
			created_at: new Date().toISOString(),
		};
		setWishes(prev => [optimistic, ...prev]);
		setAuthorName('');
		setMessage('');

		try {
			const { data, error } = await supabase
				.from('wishes').insert({ author_name: name, message: msg }).select().single();
			if (error) throw error;
			setWishes(prev => prev.map(w => w.id === optimistic.id ? data : w));
		} catch (err: any) {
			setWishes(prev => prev.filter(w => w.id !== optimistic.id));
			setSubmitError(err.message || 'Failed to post wish. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 pb-4'>
			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
				<h2 className='font-poppins font-bold text-[#1A1A2E] text-base mb-1'>Leave a wish 💌</h2>
				<p className='text-xs text-[#6B7280] font-semibold mb-4'>Share a message for baby to read one day</p>
				<form onSubmit={handleSubmit} className='space-y-3'>
					<input type='text' placeholder='Your name' required value={authorName}
						onChange={e => setAuthorName(e.target.value)}
						className='w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#B39DDB] transition-colors' />
					<textarea placeholder='Write a wish for baby...' required rows={3} value={message}
						onChange={e => setMessage(e.target.value)}
						className='w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-3xl bg-slate-50 focus:outline-none focus:border-[#B39DDB] resize-none transition-colors' />
					{submitError && <p className='text-xs text-red-500 font-semibold px-2'>{submitError}</p>}
					<button type='submit' disabled={isSubmitting}
						className='w-full py-3 rounded-full font-poppins font-bold text-white bg-[#B39DDB] hover:bg-[#a48dcb] active:scale-95 transition-all disabled:opacity-60'>
						{isSubmitting ? 'Sending...' : 'Send Wish 💌'}
					</button>
				</form>
			</div>

			{isLoading && (
				<div className='flex justify-center py-8'>
					<div className='w-8 h-8 border-2 border-[#B39DDB] border-t-transparent rounded-full animate-spin' />
				</div>
			)}
			{loadError && (
				<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center'>
					{loadError}
				</div>
			)}
			{!isLoading && !loadError && wishes.length === 0 && (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-4xl mb-3'>💌</div>
					<p className='font-poppins font-bold text-[#1A1A2E]'>No wishes yet</p>
					<p className='text-xs text-[#6B7280] font-semibold mt-1'>Be the first to leave baby a message!</p>
				</div>
			)}
			{wishes.map((wish, i) => (
				<div key={wish.id} className={`rounded-3xl border p-5 ${COLORS[i % COLORS.length]}`}>
					<div className='flex items-center justify-between mb-2'>
						<span className='font-poppins font-bold text-[#1A1A2E] text-sm'>{wish.author_name}</span>
						<span className='text-[10px] text-[#6B7280] font-semibold'>{relativeTime(wish.created_at)}</span>
					</div>
					<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed'>{wish.message}</p>
				</div>
			))}
		</div>
	);
};
```

- [ ] **Step 2: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

- [ ] **Step 3: Smoke-test**

```
npm run dev
```

Post a wish → appears immediately → check Supabase `wishes` table → refresh → still there.

- [ ] **Step 4: Commit**

```
git add src/components/WishesTab.tsx
git commit -m "feat: guestbook wishes tab with optimistic updates"
```

---

### Task 7: Baby Book Tab — Birth Capsule

**Files:**
- Create: `src/components/BirthCapsuleModal.tsx`
- Modify: `src/components/BabyBookTab.tsx`

**Interfaces:**
- Consumes: `supabase`, `BirthCapsule` type
- Produces: Pre-birth placeholder; unlocked admin can create/edit birth capsule; display of all capsule sections

- [ ] **Step 1: Create `src/components/BirthCapsuleModal.tsx`**

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';

type Props = {
	existing: BirthCapsule | null;
	onClose:  () => void;
	onSaved:  (capsule: BirthCapsule) => void;
};

export const BirthCapsuleModal = ({ existing, onClose, onSaved }: Props) => {
	const [form, setForm] = useState({
		birth_date:       existing?.birth_date             ?? '',
		birth_time:       existing?.birth_time             ?? '',
		weight_kg:        existing?.weight_kg?.toString()  ?? '',
		length_cm:        existing?.length_cm?.toString()  ?? '',
		location:         existing?.location               ?? '',
		headlines:        (existing?.headlines       ?? []).join('\n'),
		sports_results:   (existing?.sports_results  ?? []).join('\n'),
		top_song:         existing?.top_song               ?? '',
		top_movie:        existing?.top_movie              ?? '',
		famous_birthdays: (existing?.famous_birthdays ?? []).join('\n'),
		weather:          existing?.weather                ?? '',
		notes:            existing?.notes                  ?? '',
	});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	useEffect(() => {
		const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		window.addEventListener('keydown', h);
		return () => window.removeEventListener('keydown', h);
	}, [onClose]);

	const lines = (text: string): string[] =>
		text.split('\n').map(l => l.trim()).filter(Boolean);

	const set = (key: keyof typeof form) => (
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
			setForm(prev => ({ ...prev, [key]: e.target.value }))
	);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setSaveError(null);
		try {
			const payload = {
				birth_date:       form.birth_date     || null,
				birth_time:       form.birth_time     || null,
				weight_kg:        form.weight_kg      ? parseFloat(form.weight_kg) : null,
				length_cm:        form.length_cm      ? parseFloat(form.length_cm) : null,
				location:         form.location       || null,
				headlines:        lines(form.headlines),
				sports_results:   lines(form.sports_results),
				top_song:         form.top_song       || null,
				top_movie:        form.top_movie      || null,
				famous_birthdays: lines(form.famous_birthdays),
				weather:          form.weather        || null,
				notes:            form.notes          || null,
			};
			const query = existing
				? supabase.from('birth_capsule').update(payload).eq('id', existing.id).select().single()
				: supabase.from('birth_capsule').insert(payload).select().single();
			const { data, error } = await query;
			if (error) throw error;
			onSaved(data);
		} catch (err: any) {
			setSaveError(err.message || 'Failed to save. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const inputCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#FF8C69] transition-colors';
	const textareaCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:border-[#FF8C69] resize-none transition-colors';
	const labelCls = 'block text-xs font-bold text-[#6B7280] mb-1.5 pl-1';

	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm'
			onClick={onClose}>
			<div role='dialog' aria-modal='true' aria-labelledby='capsule-title'
				className='bg-white w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden'
				onClick={e => e.stopPropagation()}>
				<div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0'>
					<h2 id='capsule-title' className='font-poppins font-extrabold text-lg text-[#1A1A2E]'>Birth Capsule 🌟</h2>
					<button onClick={onClose} className='p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors'>
						<X className='w-5 h-5' />
					</button>
				</div>
				<form onSubmit={handleSubmit} className='p-6 space-y-4 overflow-y-auto'>
					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Birth Date</label><input className={inputCls} value={form.birth_date} onChange={set('birth_date')} placeholder='2026-11-09' /></div>
						<div><label className={labelCls}>Birth Time</label><input className={inputCls} value={form.birth_time} onChange={set('birth_time')} placeholder='3:42 AM' /></div>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Weight (kg)</label><input className={inputCls} value={form.weight_kg} onChange={set('weight_kg')} placeholder='3.4' /></div>
						<div><label className={labelCls}>Length (cm)</label><input className={inputCls} value={form.length_cm} onChange={set('length_cm')} placeholder='50' /></div>
					</div>
					<div><label className={labelCls}>Location</label><input className={inputCls} value={form.location} onChange={set('location')} placeholder='Dubai Hospital' /></div>
					<div><label className={labelCls}>World Headlines (one per line)</label><textarea className={textareaCls} rows={3} value={form.headlines} onChange={set('headlines')} placeholder={'Headline 1\nHeadline 2'} /></div>
					<div><label className={labelCls}>Sports Results (one per line)</label><textarea className={textareaCls} rows={3} value={form.sports_results} onChange={set('sports_results')} placeholder={'Team A won...'} /></div>
					<div><label className={labelCls}>#1 Song</label><input className={inputCls} value={form.top_song} onChange={set('top_song')} placeholder='Song – Artist' /></div>
					<div><label className={labelCls}>#1 Movie</label><input className={inputCls} value={form.top_movie} onChange={set('top_movie')} placeholder='Movie title' /></div>
					<div><label className={labelCls}>Famous Birthdays — same date (one per line)</label><textarea className={textareaCls} rows={3} value={form.famous_birthdays} onChange={set('famous_birthdays')} placeholder={'Name (born year)'} /></div>
					<div><label className={labelCls}>Weather</label><input className={inputCls} value={form.weather} onChange={set('weather')} placeholder='Sunny, 28°C in Dubai' /></div>
					<div><label className={labelCls}>Notes</label><textarea className={textareaCls} rows={3} value={form.notes} onChange={set('notes')} placeholder='Anything else...' /></div>
					{saveError && <p className='text-xs text-red-500 font-semibold px-2'>{saveError}</p>}
					<button type='submit' disabled={isSaving}
						className='w-full py-3.5 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all disabled:opacity-60'>
						{isSaving ? 'Saving...' : 'Save Birth Capsule 🌟'}
					</button>
				</form>
			</div>
		</div>
	);
};
```

- [ ] **Step 2: Replace `src/components/BabyBookTab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';
import { BirthCapsuleModal } from './BirthCapsuleModal';

const SECTION_COLORS = {
	peach:    'bg-[#FF8C69]/10 border-[#FF8C69]/20',
	mint:     'bg-[#6CC9C9]/10 border-[#6CC9C9]/20',
	lavender: 'bg-[#B39DDB]/10 border-[#B39DDB]/20',
} as const;

const CapsuleSection = ({ title, items, color }: {
	title: string; items: string[]; color: keyof typeof SECTION_COLORS;
}) => (
	<div className={`rounded-3xl border p-5 ${SECTION_COLORS[color]}`}>
		<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>{title}</h3>
		<ul className='space-y-1.5'>
			{items.map((item, i) => (
				<li key={i} className='flex items-start gap-2 text-sm font-semibold text-[#1A1A2E]'>
					<span className='text-[#6B7280] shrink-0 mt-0.5'>•</span>{item}
				</li>
			))}
		</ul>
	</div>
);

export const BabyBookTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [capsule, setCapsule]     = useState<BirthCapsule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);

	useEffect(() => {
		supabase.from('birth_capsule').select('*').limit(1).maybeSingle()
			.then(({ data }) => setCapsule(data ?? null))
			.finally(() => setIsLoading(false));
	}, []);

	if (isLoading) return (
		<div className='flex justify-center py-16'>
			<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
		</div>
	);

	return (
		<div className='space-y-4 pb-4'>
			{!capsule ? (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-6xl mb-4'>📚</div>
					<h2 className='font-poppins font-extrabold text-xl text-[#1A1A2E] mb-2'>Baby Book Coming Soon</h2>
					<p className='text-sm text-[#6B7280] font-semibold leading-relaxed max-w-xs mx-auto'>
						Fill this in when baby arrives — headlines, sports scores, famous birthdays, and all the details of the big day ✨
					</p>
					{isUnlocked && (
						<button onClick={() => setShowModal(true)}
							className='mt-6 px-6 py-3 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all text-sm'>
							+ Add Birth Details
						</button>
					)}
				</div>
			) : (
				<>
					<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white shadow-lg shadow-[#FF8C69]/30'>
						<div className='flex items-start justify-between'>
							<div>
								<p className='text-white/70 text-xs font-bold uppercase tracking-widest mb-1'>Baby arrived on</p>
								<h2 className='font-poppins font-extrabold text-2xl leading-tight'>
									{capsule.birth_date
										? new Date(capsule.birth_date).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
										: 'The big day!'}
								</h2>
								{capsule.birth_time && <p className='text-white/80 font-semibold text-sm mt-0.5'>at {capsule.birth_time}</p>}
							</div>
							{isUnlocked && (
								<button onClick={() => setShowModal(true)}
									className='p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors'>
									<Pencil className='w-4 h-4 text-white' />
								</button>
							)}
						</div>
						{(capsule.weight_kg || capsule.length_cm || capsule.location) && (
							<div className='flex gap-3 mt-4 flex-wrap'>
								{capsule.weight_kg && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Weight</p>
										<p className='text-white font-poppins font-extrabold text-lg'>{capsule.weight_kg}kg</p>
									</div>
								)}
								{capsule.length_cm && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Length</p>
										<p className='text-white font-poppins font-extrabold text-lg'>{capsule.length_cm}cm</p>
									</div>
								)}
								{capsule.location && (
									<div className='bg-white/20 rounded-2xl px-4 py-2 text-center'>
										<p className='text-white/70 text-[10px] font-bold uppercase'>Where</p>
										<p className='text-white font-poppins font-extrabold text-sm'>{capsule.location}</p>
									</div>
								)}
							</div>
						)}
					</div>

					{capsule.headlines?.length > 0        && <CapsuleSection title='World Headlines 📰' items={capsule.headlines} color='peach' />}
					{capsule.sports_results?.length > 0   && <CapsuleSection title='Sports ⚽' items={capsule.sports_results} color='mint' />}
					{(capsule.top_song || capsule.top_movie) && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>Culture 🎵🎬</h3>
							{capsule.top_song  && <p className='text-sm font-semibold text-[#6B7280]'>🎵 {capsule.top_song}</p>}
							{capsule.top_movie && <p className='text-sm font-semibold text-[#6B7280] mt-1'>🎬 {capsule.top_movie}</p>}
						</div>
					)}
					{capsule.famous_birthdays?.length > 0 && <CapsuleSection title='Famous Birthdays 🎂' items={capsule.famous_birthdays} color='lavender' />}
					{capsule.weather && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-1'>Weather ☀️</h3>
							<p className='text-sm font-semibold text-[#6B7280]'>{capsule.weather}</p>
						</div>
					)}
					{capsule.notes && (
						<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-5'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-1'>Notes 📝</h3>
							<p className='text-sm font-semibold text-[#6B7280] leading-relaxed whitespace-pre-line'>{capsule.notes}</p>
						</div>
					)}
				</>
			)}

			{showModal && (
				<BirthCapsuleModal
					existing={capsule}
					onClose={() => setShowModal(false)}
					onSaved={updated => { setCapsule(updated); setShowModal(false); }}
				/>
			)}
		</div>
	);
};
```

- [ ] **Step 3: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

- [ ] **Step 4: Smoke-test**

```
npm run dev
```

Baby Book shows placeholder → unlock → "+ Add Birth Details" button → modal slides up from bottom → fill fields → save → capsule card renders all sections.

- [ ] **Step 5: Commit**

```
git add src/components/BirthCapsuleModal.tsx src/components/BabyBookTab.tsx
git commit -m "feat: baby book tab with birth capsule placeholder and admin form"
```

---

### Task 8: Timeline Reskin + TimelineTab Implementation

**Files:**
- Modify: `src/components/TimelineItem.tsx`
- Modify: `src/components/TimelineTab.tsx`

**Interfaces:**
- Consumes: all existing imports (`Milestone`, `getImages`, `renderIcon`, `formatDate`, `FADE_IN_STEP_S`, `FADE_IN_MAX_S`, `useSwipe`)
- Produces: Reskinned cards with new design system; mobile-first single-column layout; gradient timeline line; FAB in `TimelineTab`

- [ ] **Step 1: Replace `src/components/TimelineItem.tsx`**

```tsx
import { Calendar, Pencil } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { useSwipe } from '../hooks/useSwipe';
import { Milestone, getImages } from '../types';
import { renderIcon } from '../icons';
import { formatDate } from '../utils';
import { FADE_IN_STEP_S, FADE_IN_MAX_S } from '../constants';

export const TimelineCard = memo(({
	milestone, onImageClick, onEditClick, isUnlocked,
}: {
	milestone:    Milestone;
	onImageClick: (images: string[], index: number) => void;
	onEditClick:  (milestone: Milestone) => void;
	isUnlocked:   boolean;
}) => {
	const images     = getImages(milestone);
	const hasImages  = images.length > 0;
	const isCarousel = images.length > 1;
	const [activeIndex, setActiveIndex] = useState(0);
	const safeIndex = hasImages ? Math.min(activeIndex, images.length - 1) : 0;
	const [imgLoaded, setImgLoaded] = useState(false);

	useEffect(() => { setImgLoaded(false); }, [safeIndex]);

	const prev  = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
	const next  = () => setActiveIndex(i => (i + 1) % images.length);
	const swipe = useSwipe(next, prev);

	return (
		<div className='relative bg-white w-full rounded-3xl p-5 shadow-md border border-slate-100 hover:shadow-lg transition-shadow duration-300 group'>
			{isUnlocked && (
				<button onClick={() => onEditClick(milestone)}
					className='absolute p-2 text-[#FF8C69] opacity-0 group-hover:opacity-100 top-4 right-4 bg-orange-50 hover:bg-orange-100 rounded-full transition-opacity'>
					<Pencil className='w-4 h-4' />
				</button>
			)}

			<div className='inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 text-xs font-bold text-[#FF8C69] bg-[#FF8C69]/10 rounded-full'>
				<Calendar className='w-3.5 h-3.5' />
				<span>{formatDate(milestone.date)}</span>
			</div>

			<h3 className='font-poppins font-extrabold text-xl text-[#1A1A2E] mb-3 pr-8 leading-tight'>
				{milestone.title}
			</h3>

			{hasImages && (
				<div className='mb-4 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer touch-pan-y'
					{...(isCarousel ? swipe : {})}
					onClick={() => onImageClick(images, safeIndex)}>
					<div className='relative w-full aspect-[4/3]'>
						{!imgLoaded && (
							<div className='absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100' />
						)}
						<img
							key={safeIndex}
							src={images[safeIndex]}
							alt={`${milestone.title} – photo ${safeIndex + 1}`}
							loading='lazy'
							onLoad={() => setImgLoaded(true)}
							className={`object-cover w-full h-full carousel-img-enter transition-opacity duration-300 select-none ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
						/>
					</div>
					{isCarousel && (
						<div className='flex justify-center gap-1.5 py-2 bg-white' onClick={e => e.stopPropagation()}>
							{images.map((_, i) => (
								<button key={i} onClick={() => setActiveIndex(i)}
									className={`rounded-full transition-all duration-200 ${i === safeIndex ? 'w-4 h-2 bg-[#FF8C69]' : 'w-2 h-2 bg-slate-200'}`}
									aria-label={`Go to photo ${i + 1}`} />
							))}
						</div>
					)}
				</div>
			)}

			{milestone.description && (
				<p className='text-sm text-[#6B7280] font-semibold leading-relaxed'>{milestone.description}</p>
			)}
		</div>
	);
});

export const TimelineItem = memo(({
	milestone, index, onImageClick, onEditClick, isUnlocked,
}: {
	milestone:    Milestone;
	index:        number;
	onImageClick: (images: string[], index: number) => void;
	onEditClick:  (milestone: Milestone) => void;
	isUnlocked:   boolean;
}) => (
	<div className='relative mb-6 animate-fade-in-up'
		style={{ animationDelay: `${Math.min(index * FADE_IN_STEP_S, FADE_IN_MAX_S)}s` }}>
		<div className='absolute -left-2 top-5 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white border-2 border-[#FF8C69]/30 shadow-sm'>
			{renderIcon(milestone.icon)}
		</div>
		<div className='pl-12'>
			<TimelineCard
				milestone={milestone}
				onImageClick={onImageClick}
				onEditClick={onEditClick}
				isUnlocked={isUnlocked}
			/>
		</div>
	</div>
));
```

- [ ] **Step 2: Replace `src/components/TimelineTab.tsx`**

```tsx
import { Plus } from 'lucide-react';
import { Milestone } from '../types';
import { TimelineItem } from './TimelineItem';

type Props = {
	milestones:   Milestone[];
	isLoading:    boolean;
	error:        string | null;
	hasMore:      boolean;
	isUnlocked:   boolean;
	onLoadMore:   () => void;
	onImageClick: (images: string[], idx: number, title: string) => void;
	onEditClick:  (m: Milestone) => void;
	onAddClick:   () => void;
};

export const TimelineTab = ({
	milestones, isLoading, error, hasMore, isUnlocked,
	onLoadMore, onImageClick, onEditClick, onAddClick,
}: Props) => (
	<div className='relative pb-4'>
		<div className='absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FF8C69]/40 via-[#6CC9C9]/40 to-[#B39DDB]/40' />

		{isLoading && (
			<div className='flex justify-center py-16'>
				<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
			</div>
		)}
		{error && (
			<div className='rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-500 font-semibold text-center mt-4'>
				{error}
			</div>
		)}
		{!isLoading && !error && milestones.length === 0 && (
			<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center mt-4'>
				<div className='text-4xl mb-3'>📖</div>
				<p className='font-poppins font-bold text-[#1A1A2E]'>No memories yet</p>
				{isUnlocked && <p className='text-xs text-[#6B7280] font-semibold mt-1'>Tap + to add the first memory!</p>}
			</div>
		)}

		{milestones.map((milestone, index) => (
			<TimelineItem
				key={milestone.id}
				milestone={milestone}
				index={index}
				onImageClick={(images, idx) => onImageClick(images, idx, milestone.title)}
				onEditClick={onEditClick}
				isUnlocked={isUnlocked}
			/>
		))}

		{hasMore && !isLoading && (
			<div className='flex justify-center mt-4'>
				<button onClick={onLoadMore}
					className='px-6 py-2.5 font-bold text-[#FF8C69] bg-orange-50 border-2 border-[#FF8C69]/20 rounded-full hover:bg-orange-100 transition-colors text-sm'>
					Load more memories
				</button>
			</div>
		)}

		{isUnlocked && (
			<button onClick={onAddClick}
				className='fixed z-40 bottom-20 right-4 w-14 h-14 bg-[#FF8C69] text-white rounded-full shadow-lg shadow-[#FF8C69]/40 hover:bg-[#e87a57] active:scale-95 transition-all flex items-center justify-center'>
				<Plus className='w-7 h-7' strokeWidth={2.5} />
				<span className='sr-only'>Add Memory</span>
			</button>
		)}
	</div>
);
```

- [ ] **Step 3: TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Full visual smoke-test**

```
npm run dev
```

Check every tab:
- **Home:** Peach countdown → 🥭 fruit card → poll → weekly facts
- **Timeline:** Left-edge gradient line, icon badges, reskinned white cards, edit pencil on hover (unlocked), peach FAB bottom-right
- **Wishes:** Post form + pastel cards
- **Baby Book:** Placeholder or capsule card
- **Header:** Sticky, compact, days-to-go pill on sm+ screens
- **Tab bar:** Fixed at bottom, peach active color

- [ ] **Step 5: Commit**

```
git add src/components/TimelineItem.tsx src/components/TimelineTab.tsx
git commit -m "feat: reskin timeline cards, implement timeline tab with gradient line and FAB"
```

---

### Task 9: Push to GitHub

- [ ] **Step 1: Final TypeScript check**

```
node .\node_modules\typescript\bin\tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Push**

```
git push origin HEAD
```

- [ ] **Step 3: Verify Netlify deploy**

Open Netlify dashboard → confirm deploy succeeds → visit production URL → verify all four tabs work, poll persists votes, wishes tab saves messages, birth capsule shows placeholder.

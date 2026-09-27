# Storybook Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every screen in the approved "Storybook" style (ink outlines, sticker cards, cream dotted paper, Fluent 3D pictures, Phosphor icons, Motion animations), cut scrolling sharply, and remove the Shower tab and pre-shower mode — without touching any data.

**Architecture:** A small UI kit (`src/components/ui/*`, `src/lib/*`, hooks) is built first, then each screen is rebuilt on it: app shell → Home → Timeline → Blessings → Baby Book. All Supabase reads/writes keep their existing queries and semantics; only presentation and component structure change.

**Tech Stack:** React 18.3, TypeScript strict, Vite 5, Tailwind CSS 3.4, Supabase JS v2, `motion` (Motion for React), `canvas-confetti`, `@phosphor-icons/react`, `@fontsource-variable/grandstander` + `@fontsource-variable/nunito`, Microsoft Fluent 3D emoji (MIT) self-hosted as WebP.

**Spec:** `docs/superpowers/specs/2026-09-27-storybook-redesign-design.md`

## Global Constraints

- **No data changes of any kind.** No migrations, no new tables/columns, no DELETE/UPDATE except the existing app behaviours (milestone edit/delete, guess upsert, winner reveal, reaction toggle). Every table and row stays as is, including `shower_posts` and `questions`.
- Every existing behaviour is preserved (auth + view-only, milestone CRUD + multi-photo upload + pagination + ascending date order, boy/girl vote insert-only with required name, trait/fun upsert votes, realtime counts, guess range Oct–Nov + edit own guess + unlocked winner reveal, blessing category/filter/optimistic insert/reactions, sealed insert-only birth capsule, image viewer swipe + pinch).
- All source files use **tabs** for indentation.
- TypeScript strict with `noUnusedLocals`/`noUnusedParameters`; `catch (err: unknown)`; no `any`.
- Palette (Tailwind tokens): `ink #2B2340`, `muted #756B86`, `paper #FFFBF2`, `dot #EADFCC`, `peach #FFD6C7`, `mint #CBF1EC`, `lav #E6DBFF`, `butter #FFE680`, `pink #FFD6E5`, `sky #D3E8FF`, `danger #C23B55`. Aditi = lavender, Kartik = mint, Boy = sky, Girl = pink.
- Cards: `rounded-card border-2 border-ink shadow-sticker` (22px radius, `4px 4px 0 ink` shadow). One pastel per card at most.
- Headings use `font-display` (Grandstander) and only at ≥16px; everything else `font-body` (Nunito). Form inputs are 16px (`text-base`) to prevent iOS zoom.
- Pictures only via `<Emoji name=…>` (Fluent 3D WebP in `public/emoji/`); icons only via `@phosphor-icons/react`. No `lucide-react` after Task 7. User-typed content emoji are untouched.
- Motion: `motion/react` only; everything wrapped in `<MotionConfig reducedMotion="user">`; animate transform/opacity (width only for result bars/dots); confetti via `src/lib/celebrate.ts` with `disableForReducedMotion: true`.
- Tabs after this plan: `home`, `timeline`, `wishes` (label "Blessings"), `babybook`. The Shower tab, `ShowerTab.tsx`, `ShowerPost` type, `SHOWER_DATE`, `isPreShowerMode`, `GamesHero`, and the tap-5-times title gesture are removed.
- Verification commands (no test runner exists): `npx tsc --noEmit` must print nothing and exit 0; `npm run build` must succeed.

## File Map

| File | Action | Task |
|---|---|---|
| `package.json` | add deps | 1 |
| `tailwind.config.js`, `index.css`, `index.html`, `main.tsx`, `tsconfig.json` | rewrite/modify | 1 |
| `src/emoji.ts`, `scripts/fetch-emoji.mjs`, `public/emoji/*.webp`, `public/favicon.png`, `public/apple-touch-icon.png` | create | 1 |
| `src/components/FloatingBackground.tsx` | delete (unused) | 1 |
| `src/lib/motion.ts`, `src/lib/celebrate.ts`, `src/lib/palette.ts` | create | 2 |
| `src/hooks/useGuestName.ts`, `src/hooks/useMediaQuery.ts` | create | 2 |
| `src/components/ui/{Emoji,Card,Button,Sheet,Fab,Reveal,AnimatedNumber,Spinner,EmptyState,ResultBar,ErrorNote}.tsx` | create | 2 |
| `src/utils.ts` | add helpers | 2 (remove `formatDate` in 5) |
| `App.tsx`, `src/components/{TabBar,AuthGate,ExpandedImageModal,Doodles,ErrorBoundary}.tsx`, `src/config.ts`, `src/types.ts`, `src/components/HomeTab.tsx` | rewrite/modify | 3 |
| `src/components/ShowerTab.tsx`, `src/components/home/GamesHero.tsx` | delete | 3 |
| `src/data/{funPolls,polls,fruitImages}.ts`, `src/hooks/{usePolls,useGuesses}.ts`, `src/components/home/{HeroCard,FactTicker,PollDeck,HomeTiles,ScoreSheet,GuessPanel}.tsx`, `src/components/HomeTab.tsx` | create/rewrite | 4 |
| `src/components/home/{CountdownHero,FruitTracker,WeeklyFacts,PollWidget,TraitPolls,FunPolls,GuessingGame}.tsx` | delete | 4 |
| `src/components/timeline/{timelineIcons,MemoryCard,PhotoCarousel,MemoryView,MemoryForm}.tsx`, `src/components/TimelineTab.tsx`, `App.tsx` | create/rewrite/modify | 5 |
| `src/components/{TimelineItem,MemoryModal}.tsx`, `src/icons.tsx`, `src/hooks/useSwipe.ts` | delete | 5 |
| `src/components/WishesTab.tsx`, `src/components/wishes/{BlessingNote,ComposeBlessing,ReactionBar}.tsx` | rewrite/create | 6 |
| `src/components/BabyBookTab.tsx`, `src/components/babybook/{BirthCapsuleForm,SealStamp}.tsx` | rewrite/create | 7 |
| `src/hooks/useLatestMemory.ts`, `src/components/home/LatestMemoryCard.tsx`, `src/components/home/HeroCard.tsx`, `src/components/HomeTab.tsx`, `App.tsx` | create/modify | 8 |
| `src/components/BirthCapsuleModal.tsx`, `lucide-react` | delete/uninstall | 7 |

---

### Task 1: Foundation — dependencies, tokens, fonts, global CSS, emoji assets

**Files:**
- Modify: `package.json` (via npm), `tsconfig.json`, `main.tsx`
- Rewrite: `tailwind.config.js`, `index.css`, `index.html`
- Create: `src/emoji.ts`, `scripts/fetch-emoji.mjs`, `public/emoji/*.webp` (generated), `public/favicon.png`, `public/apple-touch-icon.png` (generated)
- Delete: `src/components/FloatingBackground.tsx` (confirm it is imported nowhere first)

**Interfaces:**
- Produces: Tailwind tokens (`ink`, `muted`, `paper`, `dot`, `peach`, `mint`, `lav`, `butter`, `pink`, `sky`, `danger`; `font-display`, `font-body`; `shadow-sticker`, `shadow-sticker-sm`, `shadow-sticker-xs`, `shadow-sticker-lg`; `rounded-card`; `text-display-xl|lg|md`), CSS component classes `.field`, `.field-label`, `.press`, `.eyebrow`.
- Produces: `EmojiName` type and `emojiSrc(name)` from `src/emoji.ts`; files at `/emoji/<name>.webp`.

- [ ] **Step 1: Install dependencies**

```bash
npm install motion canvas-confetti @phosphor-icons/react @fontsource-variable/grandstander @fontsource-variable/nunito
npm install -D @types/canvas-confetti
```

Expected: both commands succeed. Do **not** add `sharp` to `package.json` (it is only needed once, in Step 5, via `--no-save`).

- [ ] **Step 2: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './App.tsx', './main.tsx'],
	theme: {
		extend: {
			fontFamily: {
				display: ["'Grandstander Variable'", "'Nunito Variable'", 'system-ui', 'sans-serif'],
				body:    ["'Nunito Variable'", 'system-ui', 'sans-serif'],
			},
			colors: {
				ink:    '#2B2340',
				muted:  '#756B86',
				paper:  '#FFFBF2',
				dot:    '#EADFCC',
				peach:  '#FFD6C7',
				mint:   '#CBF1EC',
				lav:    '#E6DBFF',
				butter: '#FFE680',
				pink:   '#FFD6E5',
				sky:    '#D3E8FF',
				danger: '#C23B55',
			},
			boxShadow: {
				'sticker-xs': '1px 1px 0 #2B2340',
				'sticker-sm': '2px 2px 0 #2B2340',
				sticker:      '4px 4px 0 #2B2340',
				'sticker-lg': '6px 6px 0 #2B2340',
			},
			borderRadius: {
				card: '22px',
			},
			fontSize: {
				'display-xl': ['clamp(1.6rem, 1.2rem + 1.7vw, 2.25rem)', { lineHeight: '1.08' }],
				'display-lg': ['clamp(1.3rem, 1.08rem + 0.95vw, 1.7rem)', { lineHeight: '1.12' }],
				'display-md': ['clamp(1.05rem, 0.97rem + 0.35vw, 1.25rem)', { lineHeight: '1.22' }],
			},
		},
	},
	plugins: [],
};
```

- [ ] **Step 3: Replace `index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
	html {
		-webkit-text-size-adjust: 100%;
		-webkit-tap-highlight-color: transparent;
	}
	body {
		@apply m-0 min-h-screen min-w-[320px] bg-paper font-body text-ink antialiased;
		background-image: radial-gradient(theme('colors.dot') 1.3px, transparent 1.3px);
		background-size: 18px 18px;
		text-rendering: optimizeLegibility;
	}
	#root {
		@apply w-full;
	}
	::selection {
		@apply bg-butter text-ink;
	}
	:focus-visible {
		@apply outline outline-[3px] outline-offset-2 outline-ink;
	}
	h1, h2, h3 {
		text-wrap: balance;
	}
}

@layer components {
	.field {
		@apply w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 text-base font-semibold text-ink outline-none transition-[background-color,box-shadow] duration-150 placeholder:font-semibold placeholder:text-muted/70 focus:bg-[#FFFCEB] focus:shadow-sticker-sm focus-visible:outline-none;
	}
	.field-label {
		@apply mb-1.5 block pl-1 text-xs font-extrabold uppercase tracking-[0.08em] text-muted;
	}
	.press {
		@apply transition-[transform,box-shadow] duration-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-sticker-xs;
	}
	.eyebrow {
		@apply text-[11px] font-extrabold uppercase tracking-[0.12em];
	}
}
```

- [ ] **Step 4: Create `src/emoji.ts`**

```ts
/**
 * Microsoft Fluent 3D emoji (MIT licence, © Microsoft Corporation), self-hosted as
 * 160px WebP in public/emoji/. scripts/fetch-emoji.mjs reads this list with a regex,
 * so keep each entry on ONE line in the form ['name', 'Fluent folder', skinToneVariant].
 */
export const EMOJI_SOURCES = [
	// Baby, family, celebration
	['baby', 'Baby', true],
	['baby-bottle', 'Baby bottle', false],
	['teddy-bear', 'Teddy bear', false],
	['ribbon', 'Ribbon', false],
	['balloon', 'Balloon', false],
	['party-popper', 'Party popper', false],
	['wrapped-gift', 'Wrapped gift', false],
	['hatching-chick', 'Hatching chick', false],
	['hugging-face', 'Hugging face', false],
	['waving-hand', 'Waving hand', true],
	['love-letter', 'Love letter', false],
	['folded-hands', 'Folded hands', true],
	// Sky and sparkle
	['sparkles', 'Sparkles', false],
	['star', 'Star', false],
	['glowing-star', 'Glowing star', false],
	['cloud', 'Cloud', false],
	['crescent-moon', 'Crescent moon', false],
	// Hearts
	['red-heart', 'Red heart', false],
	['pink-heart', 'Pink heart', false],
	['blue-heart', 'Blue heart', false],
	['two-hearts', 'Two hearts', false],
	// Faces and polls
	['thinking-face', 'Thinking face', false],
	['eyes', 'Eyes', false],
	['nose', 'Nose', true],
	['person-curly-hair', 'Person curly hair', true],
	['smiling-face-with-smiling-eyes', 'Smiling face with smiling eyes', false],
	['sleeping-face', 'Sleeping face', false],
	['loudly-crying-face', 'Loudly crying face', false],
	['face-with-tears-of-joy', 'Face with tears of joy', false],
	['face-holding-back-tears', 'Face holding back tears', false],
	['melting-face', 'Melting face', false],
	['dna', 'Dna', false],
	['magnifying-glass', 'Magnifying glass tilted left', false],
	// Objects
	['light-bulb', 'Light bulb', false],
	['game-die', 'Game die', false],
	['tear-off-calendar', 'Tear-off calendar', false],
	['bullseye', 'Bullseye', false],
	['crown', 'Crown', false],
	['open-book', 'Open book', false],
	['key', 'Key', false],
	['gem-stone', 'Gem stone', false],
	['newspaper', 'Newspaper', false],
	['soccer-ball', 'Soccer ball', false],
	['musical-notes', 'Musical notes', false],
	['clapper-board', 'Clapper board', false],
	['birthday-cake', 'Birthday cake', false],
	['sun-behind-small-cloud', 'Sun behind small cloud', false],
	['memo', 'Memo', false],
	// Fruit of the week
	['seedling', 'Seedling', false],
	['herb', 'Herb', false],
	['green-heart', 'Green heart', false],
	['blueberries', 'Blueberries', false],
	['beans', 'Beans', false],
	['grapes', 'Grapes', false],
	['tangerine', 'Tangerine', false],
	['fallen-leaf', 'Fallen leaf', false],
	['lemon', 'Lemon', false],
	['peach', 'Peach', false],
	['red-apple', 'Red apple', false],
	['avocado', 'Avocado', false],
	['pear', 'Pear', false],
	['bell-pepper', 'Bell pepper', false],
	['mango', 'Mango', false],
	['banana', 'Banana', false],
	['carrot', 'Carrot', false],
	['melon', 'Melon', false],
	['ear-of-corn', 'Ear of corn', false],
	['broccoli', 'Broccoli', false],
	['potato', 'Potato', false],
	['eggplant', 'Eggplant', false],
	['jack-o-lantern', 'Jack-o-lantern', false],
	['leafy-green', 'Leafy green', false],
	['coconut', 'Coconut', false],
	['pineapple', 'Pineapple', false],
	['watermelon', 'Watermelon', false],
] as const;

export type EmojiName = (typeof EMOJI_SOURCES)[number][0];

export const emojiSrc = (name: EmojiName): string => `/emoji/${name}.webp`;
```

- [ ] **Step 5: Create `scripts/fetch-emoji.mjs` and generate the assets**

```js
// Downloads the Microsoft Fluent 3D emoji (MIT licence) listed in src/emoji.ts and writes
// 160px WebP files to public/emoji/, plus public/favicon.png and public/apple-touch-icon.png.
// Usage (sharp is intentionally not a project dependency):
//   npm install --no-save sharp && node scripts/fetch-emoji.mjs
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
const outPath = (name) => fileURLToPath(new URL(`../public/emoji/${name}.webp`, import.meta.url));
const publicPath = (file) => fileURLToPath(new URL(`../public/${file}`, import.meta.url));

const source = await readFile(new URL('../src/emoji.ts', import.meta.url), 'utf8');
const entries = [...source.matchAll(/\['([a-z0-9-]+)',\s*'([^']+)',\s*(true|false)\]/g)]
	.map(([, name, folder, skinTone]) => ({ name, folder, skinTone: skinTone === 'true' }));
if (entries.length === 0) throw new Error('No emoji entries found in src/emoji.ts');

const urlFor = ({ folder, skinTone }) => {
	const file = folder.toLowerCase().replace(/ /g, '_');
	const dir = encodeURIComponent(folder);
	return skinTone
		? `${BASE}/${dir}/Default/3D/${file}_3d_default.png`
		: `${BASE}/${dir}/3D/${file}_3d.png`;
};

const download = async (entry) => {
	const res = await fetch(urlFor(entry));
	if (!res.ok) throw new Error(`${entry.name}: HTTP ${res.status} for ${urlFor(entry)}`);
	return Buffer.from(await res.arrayBuffer());
};

await mkdir(fileURLToPath(new URL('../public/emoji/', import.meta.url)), { recursive: true });

for (const entry of entries) {
	const png = await download(entry);
	await sharp(png)
		.resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.webp({ quality: 88 })
		.toFile(outPath(entry.name));
	process.stdout.write('.');
}

const baby = await download(entries.find((e) => e.name === 'baby'));
await sharp(baby).resize(64, 64).png().toFile(publicPath('favicon.png'));
const inner = await sharp(baby).resize(132, 132).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#FFFBF2' } })
	.composite([{ input: inner, gravity: 'center' }])
	.png()
	.toFile(publicPath('apple-touch-icon.png'));

console.log(`\nWrote ${entries.length} emoji, favicon.png and apple-touch-icon.png`);
```

Run:

```bash
npm install --no-save sharp && node scripts/fetch-emoji.mjs
```

Expected: ends with `Wrote 76 emoji, favicon.png and apple-touch-icon.png`. Then verify:

```bash
ls public/emoji | wc -l            # 76
git status --short package.json    # package.json must NOT list sharp
```

- [ ] **Step 6: Replace `index.html`**

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
		<meta name="theme-color" content="#FFFBF2" />
		<meta name="description" content="Follow our baby's journey — predictions, blessings, and memories." />
		<link rel="icon" type="image/png" href="/favicon.png" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
		<title>Baby Journey ✨</title>
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/main.tsx"></script>
	</body>
</html>
```

- [ ] **Step 7: Self-host the fonts in `main.tsx`**

Add these two imports directly after the `react-dom/client` import (before `App`):

```tsx
import '@fontsource-variable/nunito';
import '@fontsource-variable/grandstander';
```

- [ ] **Step 8: Type-check every `.tsx` file**

In `tsconfig.json`, change the `include` array to:

```json
"include": [
	"main.tsx",
	"App.tsx",
	"src/**/*.ts",
	"src/**/*.tsx",
	"vite-env.d.ts"
],
```

- [ ] **Step 9: Delete the unused `FloatingBackground`**

```bash
grep -rn "FloatingBackground" --include=*.tsx --include=*.ts App.tsx main.tsx src | grep -v "src/components/FloatingBackground.tsx"
```

Expected: no output. Then delete `src/components/FloatingBackground.tsx`.

- [ ] **Step 10: Verify**

```bash
npx tsc --noEmit
npm run build
```

Expected: tsc prints nothing; build succeeds. (Existing screens still use old class names — that's fine; they are rebuilt in later tasks.)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tailwind.config.js index.css index.html main.tsx tsconfig.json src/emoji.ts scripts/fetch-emoji.mjs public
git rm src/components/FloatingBackground.tsx
git commit -m "feat: storybook foundation — tokens, self-hosted fonts, Fluent 3D emoji assets"
```

---

### Task 2: UI kit — primitives, motion presets, confetti, hooks, utils

**Files:**
- Create: `src/lib/motion.ts`, `src/lib/celebrate.ts`, `src/lib/palette.ts`, `src/hooks/useGuestName.ts`, `src/hooks/useMediaQuery.ts`
- Create: `src/components/ui/Emoji.tsx`, `Card.tsx`, `Button.tsx`, `Sheet.tsx`, `Fab.tsx`, `Reveal.tsx`, `AnimatedNumber.tsx`, `Spinner.tsx`, `EmptyState.tsx`, `ResultBar.tsx`, `ErrorNote.tsx`
- Modify: `src/utils.ts` (append helpers; keep everything existing)

**Interfaces (used by every later task):**
- `Emoji({ name: EmojiName; size?: number; className?: string; alt?: string; eager?: boolean })`
- `Card` — motion div; props `tone?: Tone` (`'white'|'paper'|'peach'|'mint'|'lav'|'butter'|'pink'|'sky'`), `interactive?: boolean` (press effect; with `onClick` also gets `role="button"`, `tabIndex=0`, Enter/Space activation). Exports `Tone`, `TONE_BG`.
- `Button` — motion button; props `tone?: Tone` (default `'butter'`), `size?: 'sm'|'md'|'lg'`, `block?: boolean`, `pill?: boolean`.
- `Sheet({ open, onClose, title: ReactNode, children })` — portal; bottom sheet < 640px (drag handle to dismiss), centred dialog ≥ 640px. `onClose` should be referentially stable (wrap in `useCallback`).
- `Fab({ label, onClick, tone?, children })` — portal, floating above the tab bar at the content column's right edge.
- `Reveal({ children, className?, delay?, rotate? })` — springs in once on scroll.
- `AnimatedNumber({ value, className? })`, `Spinner({ label? })`, `EmptyState({ emoji, title, body?, children? })`, `ResultBar({ label, count, total, color, mine? })`, `ErrorNote({ children })`.
- `lib/motion.ts`: `springSnappy`, `springSoft`, `springBouncy`, `stagger`, `riseIn`, `floatLoop(duration?, delay?)`.
- `lib/celebrate.ts`: `burstFrom(el: Element | null, count?: number)`, `celebrate()`.
- `lib/palette.ts`: `BAR = { aditi, kartik, boy, girl }`.
- `hooks/useGuestName.ts`: `useGuestName(): string`, `saveGuestName(name: string): void` (localStorage key `timeline_guest_name`).
- `hooks/useMediaQuery.ts`: `useMediaQuery(query: string): boolean`.
- `utils.ts` additions: `parseDay`, `formatDay(value, style?)`, `relativeTime(iso)`, `class FriendlyError`, `errorMessage(err, fallback)`.

- [ ] **Step 1: Create `src/lib/motion.ts`**

```ts
import type { Transition, Variants } from 'motion/react';

export const springSnappy: Transition = { type: 'spring', stiffness: 520, damping: 32 };
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 24 };
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 18 };

/** Parent variant: staggers children that use `riseIn`. */
export const stagger: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Child variant: rises and settles with a soft spring. */
export const riseIn: Variants = {
	hidden: { opacity: 0, y: 18, scale: 0.98 },
	show: { opacity: 1, y: 0, scale: 1, transition: springSoft },
};

/** Gentle idle float for decorative pictures. Spread onto a motion element. */
export const floatLoop = (duration = 3.2, delay = 0) => ({
	animate: { y: [0, -6, 0], rotate: [-5, 5, -5] },
	transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' as const },
});
```

- [ ] **Step 2: Create `src/lib/celebrate.ts`**

```ts
import confetti from 'canvas-confetti';

const COLORS = ['#FFE680', '#FFD6C7', '#CBF1EC', '#E6DBFF', '#FFD6E5', '#D3E8FF', '#2B2340'];

/** Small confetti burst from the centre of an element (e.g. the button that was tapped). */
export function burstFrom(el: Element | null, count = 40): void {
	const rect = el?.getBoundingClientRect();
	const x = rect && rect.width > 0 ? (rect.left + rect.width / 2) / window.innerWidth : 0.5;
	const y = rect && rect.height > 0 ? (rect.top + rect.height / 2) / window.innerHeight : 0.5;
	void confetti({
		particleCount: count,
		spread: 70,
		startVelocity: 28,
		gravity: 0.9,
		scalar: 0.9,
		ticks: 140,
		origin: { x, y },
		colors: COLORS,
		zIndex: 100,
		disableForReducedMotion: true,
	});
}

/** Big two-sided celebration for milestone moments. */
export function celebrate(): void {
	const shared = { spread: 65, startVelocity: 45, ticks: 200, colors: COLORS, zIndex: 100, disableForReducedMotion: true };
	void confetti({ ...shared, particleCount: 70, angle: 60, origin: { x: 0, y: 0.75 } });
	void confetti({ ...shared, particleCount: 70, angle: 120, origin: { x: 1, y: 0.75 } });
}
```

- [ ] **Step 3: Create `src/lib/palette.ts`**

```ts
/** Saturated fills for result bars — the pastel tokens are too pale against a white track. */
export const BAR = {
	aditi:  '#B9A3F5',
	kartik: '#7FD6CB',
	boy:    '#8EC2F4',
	girl:   '#F59BBE',
} as const;
```

- [ ] **Step 4: Create `src/hooks/useMediaQuery.ts`**

```ts
import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		onChange => {
			const list = window.matchMedia(query);
			list.addEventListener('change', onChange);
			return () => list.removeEventListener('change', onChange);
		},
		() => window.matchMedia(query).matches,
		() => false,
	);
}
```

- [ ] **Step 5: Create `src/hooks/useGuestName.ts`**

```ts
import { useSyncExternalStore } from 'react';

const KEY = 'timeline_guest_name';
const listeners = new Set<() => void>();

function read(): string {
	try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => { listeners.delete(listener); };
}

/** Remembers the visitor's name so every form can prefill it. */
export function saveGuestName(name: string): void {
	const trimmed = name.trim();
	if (!trimmed) return;
	try { localStorage.setItem(KEY, trimmed); } catch { /* storage unavailable */ }
	listeners.forEach(listener => listener());
}

export function useGuestName(): string {
	return useSyncExternalStore(subscribe, read, () => '');
}
```

- [ ] **Step 6: Create `src/components/ui/Emoji.tsx`**

```tsx
import { EmojiName, emojiSrc } from '../../emoji';

type Props = {
	name: EmojiName;
	size?: number;
	className?: string;
	/** Leave empty for decorative pictures (the default). */
	alt?: string;
	/** Load immediately (above-the-fold pictures). */
	eager?: boolean;
};

export const Emoji = ({ name, size = 32, className = '', alt = '', eager = false }: Props) => (
	<img
		src={emojiSrc(name)}
		width={size}
		height={size}
		alt={alt}
		aria-hidden={alt ? undefined : true}
		loading={eager ? 'eager' : 'lazy'}
		decoding='async'
		draggable={false}
		style={{ width: size, height: size }}
		className={`inline-block shrink-0 select-none object-contain drop-shadow-[0_3px_3px_rgba(43,35,64,0.14)] ${className}`}
	/>
);
```

- [ ] **Step 7: Create `src/components/ui/Card.tsx`**

```tsx
import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export type Tone = 'white' | 'paper' | 'peach' | 'mint' | 'lav' | 'butter' | 'pink' | 'sky';

export const TONE_BG: Record<Tone, string> = {
	white:  'bg-white',
	paper:  'bg-paper',
	peach:  'bg-peach',
	mint:   'bg-mint',
	lav:    'bg-lav',
	butter: 'bg-butter',
	pink:   'bg-pink',
	sky:    'bg-sky',
};

type Props = HTMLMotionProps<'div'> & {
	tone?: Tone;
	/** Sticker press effect + pointer cursor; with onClick it also becomes keyboard-activatable. */
	interactive?: boolean;
};

/** Sticker card: 2px ink outline + offset ink shadow. */
export const Card = forwardRef<HTMLDivElement, Props>(
	({ tone = 'white', interactive = false, className = '', onClick, onKeyDown, ...rest }, ref) => {
		const keyboard = interactive && onClick
			? {
				role: 'button' as const,
				tabIndex: 0,
				onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
					onKeyDown?.(e);
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.currentTarget.click();
					}
				},
			}
			: { onKeyDown };

		return (
			<motion.div
				ref={ref}
				whileTap={interactive ? { x: 3, y: 3 } : undefined}
				transition={{ type: 'spring', stiffness: 700, damping: 30 }}
				className={`rounded-card border-2 border-ink shadow-sticker ${TONE_BG[tone]} ${
					interactive ? 'cursor-pointer select-none transition-shadow duration-100 active:shadow-sticker-xs' : ''
				} ${className}`}
				{...keyboard}
				{...rest}
				onClick={onClick}
			/>
		);
	},
);
Card.displayName = 'Card';
```

- [ ] **Step 8: Create `src/components/ui/Button.tsx`**

```tsx
import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { TONE_BG, type Tone } from './Card';

type Size = 'sm' | 'md' | 'lg';

type Props = HTMLMotionProps<'button'> & {
	tone?: Tone;
	size?: Size;
	/** Full width. */
	block?: boolean;
	/** Fully rounded ends. */
	pill?: boolean;
};

const SIZES: Record<Size, string> = {
	sm: 'gap-1.5 px-3 py-1.5 text-xs shadow-sticker-sm',
	md: 'gap-2 px-4 py-2.5 text-sm shadow-sticker-sm',
	lg: 'gap-2 px-5 py-3.5 text-base shadow-sticker',
};

/** Sticker button: lifts on hover, pushes into the page on press. */
export const Button = forwardRef<HTMLButtonElement, Props>(
	({ tone = 'butter', size = 'md', block = false, pill = false, className = '', disabled, type = 'button', ...rest }, ref) => (
		<motion.button
			ref={ref}
			type={type}
			disabled={disabled}
			whileHover={disabled ? undefined : { y: -1 }}
			whileTap={disabled ? undefined : { x: 2, y: 2 }}
			transition={{ type: 'spring', stiffness: 700, damping: 28 }}
			className={`inline-flex items-center justify-center border-2 border-ink text-center font-extrabold leading-tight text-ink ${TONE_BG[tone]} ${SIZES[size]} ${
				pill || size === 'sm' ? 'rounded-full' : 'rounded-2xl'
			} ${block ? 'w-full' : ''} active:shadow-sticker-xs disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
			{...rest}
		/>
	),
);
Button.displayName = 'Button';
```

- [ ] **Step 9: Create `src/components/ui/Sheet.tsx`**

```tsx
import { X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { ReactNode, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';

type Props = {
	open: boolean;
	onClose: () => void;
	title: ReactNode;
	children: ReactNode;
};

/** Bottom sheet on phones (drag the handle down to dismiss); centred dialog from 640px up. */
export const Sheet = ({ open, onClose, title, children }: Props) => {
	const titleId = useId();
	const dragControls = useDragControls();
	const wide = useMediaQuery('(min-width: 640px)');

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [open, onClose]);

	return createPortal(
		<AnimatePresence>
			{open && (
				<div key='sheet' className='fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6'>
					<motion.div
						aria-hidden
						className='absolute inset-0 bg-ink/45 backdrop-blur-[2px]'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
					/>
					<motion.div
						role='dialog'
						aria-modal='true'
						aria-labelledby={titleId}
						className='relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border-2 border-b-0 border-ink bg-paper shadow-sticker-lg sm:max-w-[520px] sm:rounded-card sm:border-b-2'
						initial={wide ? { opacity: 0, scale: 0.94, y: 16 } : { y: '100%' }}
						animate={wide ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
						exit={wide ? { opacity: 0, scale: 0.96, y: 10 } : { y: '100%' }}
						transition={{ type: 'spring', stiffness: 420, damping: 38 }}
						drag={wide ? false : 'y'}
						dragControls={dragControls}
						dragListener={false}
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={{ top: 0, bottom: 0.7 }}
						onDragEnd={(_, info) => {
							if (info.offset.y > 110 || info.velocity.y > 650) onClose();
						}}
					>
						<div
							className='shrink-0 cursor-grab touch-none px-5 pt-2.5 sm:cursor-default sm:pt-5'
							onPointerDown={e => { if (!wide) dragControls.start(e); }}
						>
							<div aria-hidden className='mx-auto mb-2 h-1.5 w-11 rounded-full bg-ink/20 sm:hidden' />
							<div className='flex items-center justify-between gap-3 pb-3'>
								<h2 id={titleId} className='font-display text-display-md font-extrabold'>{title}</h2>
								<button
									type='button'
									aria-label='Close'
									onPointerDown={e => e.stopPropagation()}
									onClick={onClose}
									className='press grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
								>
									<X size={16} weight='bold' />
								</button>
							</div>
						</div>
						<div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]'>
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>,
		document.body,
	);
};
```

- [ ] **Step 10: Create `src/components/ui/Fab.tsx`**

```tsx
import { motion } from 'motion/react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import type { Tone } from './Card';

type Props = { label: string; onClick: () => void; tone?: Tone; children: ReactNode };

/** Floating action button above the tab bar, aligned to the right edge of the content column. */
export const Fab = ({ label, onClick, tone = 'butter', children }: Props) =>
	createPortal(
		<motion.div
			className='fixed bottom-[calc(96px+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-304px))] z-30'
			initial={{ scale: 0, rotate: -15 }}
			animate={{ scale: 1, rotate: 0 }}
			transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 }}
		>
			<Button tone={tone} size='lg' pill aria-label={label} onClick={onClick}>
				{children}
			</Button>
		</motion.div>,
		document.body,
	);
```

- [ ] **Step 11: Create `src/components/ui/Reveal.tsx`**

```tsx
import { motion } from 'motion/react';
import { ReactNode } from 'react';

type Props = { children: ReactNode; className?: string; delay?: number; rotate?: number };

/** Springs content in the first time it scrolls into view. */
export const Reveal = ({ children, className = '', delay = 0, rotate = 0 }: Props) => (
	<motion.div
		className={className}
		initial={{ opacity: 0, y: 22, scale: 0.96, rotate: rotate * 3 }}
		whileInView={{ opacity: 1, y: 0, scale: 1, rotate }}
		viewport={{ once: true, margin: '0px 0px -32px 0px' }}
		transition={{ type: 'spring', stiffness: 240, damping: 22, delay }}
	>
		{children}
	</motion.div>
);
```

- [ ] **Step 12: Create `src/components/ui/AnimatedNumber.tsx`**

```tsx
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';

/** Counts up to `value` on mount and glides between values after that. */
export const AnimatedNumber = ({ value, className = '' }: { value: number; className?: string }) => {
	const reduce = useReducedMotion();
	const count = useMotionValue(reduce ? value : 0);
	const text = useTransform(count, v => Math.round(v).toString());

	useEffect(() => {
		if (reduce) {
			count.set(value);
			return;
		}
		const controls = animate(count, value, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1] });
		return () => controls.stop();
	}, [count, value, reduce]);

	return <motion.span className={`tabular-nums ${className}`}>{text}</motion.span>;
};
```

- [ ] **Step 13: Create `src/components/ui/Spinner.tsx`**

```tsx
import { motion } from 'motion/react';

/** Three bouncing butter dots. */
export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
	<div role='status' aria-label={label} className='flex items-center justify-center gap-1.5 py-10'>
		{[0, 1, 2].map(i => (
			<motion.span
				key={i}
				className='block h-3 w-3 rounded-full border-2 border-ink bg-butter'
				animate={{ y: [0, -9, 0] }}
				transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
			/>
		))}
	</div>
);
```

- [ ] **Step 14: Create `src/components/ui/EmptyState.tsx`**

```tsx
import { motion } from 'motion/react';
import { ReactNode } from 'react';
import type { EmojiName } from '../../emoji';
import { Card } from './Card';
import { Emoji } from './Emoji';

type Props = { emoji: EmojiName; title: string; body?: string; children?: ReactNode };

export const EmptyState = ({ emoji, title, body, children }: Props) => (
	<Card className='flex flex-col items-center px-6 py-10 text-center'>
		<motion.div
			animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }}
			transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
		>
			<Emoji name={emoji} size={68} />
		</motion.div>
		<p className='mt-4 font-display text-display-md font-extrabold'>{title}</p>
		{body && <p className='mt-1.5 max-w-xs text-sm font-semibold text-muted'>{body}</p>}
		{children}
	</Card>
);
```

- [ ] **Step 15: Create `src/components/ui/ResultBar.tsx`**

```tsx
import { motion } from 'motion/react';

type Props = { label: string; count: number; total: number; color: string; mine?: boolean };

/** One option's share of the vote, with a springy fill. */
export const ResultBar = ({ label, count, total, color, mine = false }: Props) => {
	const pct = total > 0 ? Math.round((count / total) * 100) : 0;
	return (
		<div>
			<div className='mb-1 flex items-baseline justify-between gap-2 text-[13px] font-extrabold'>
				<span className='flex min-w-0 items-center gap-1.5'>
					<span className='truncate'>{label}</span>
					{mine && <span className='rounded-full bg-ink px-1.5 py-px text-[10px] text-white'>You</span>}
				</span>
				<span className='tabular-nums text-muted'>{pct}%</span>
			</div>
			<div className='h-3.5 overflow-hidden rounded-full border-2 border-ink bg-white'>
				<motion.div
					className='h-full rounded-r-full'
					style={{ backgroundColor: color }}
					initial={{ width: '0%' }}
					animate={{ width: `${pct}%` }}
					transition={{ type: 'spring', stiffness: 110, damping: 20, delay: 0.1 }}
				/>
			</div>
		</div>
	);
};
```

- [ ] **Step 16: Create `src/components/ui/ErrorNote.tsx`**

```tsx
import { ReactNode } from 'react';

export const ErrorNote = ({ children }: { children: ReactNode }) => (
	<p role='alert' className='rounded-2xl border-2 border-danger bg-white px-4 py-3 text-sm font-bold text-danger'>
		{children}
	</p>
);
```

- [ ] **Step 17: Append helpers to `src/utils.ts`**

Keep every existing export (`ICON_OPTIONS`, `formatDate`, `getVoterId`) unchanged and append:

```ts
/** Parses a Postgres `date` ('YYYY-MM-DD') at local noon so it never slips a day across time zones. */
export const parseDay = (value: string): Date =>
	/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);

export const formatDay = (value: string, style: 'short' | 'long' = 'short'): string =>
	parseDay(value).toLocaleDateString(
		undefined,
		style === 'long'
			? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
			: { day: 'numeric', month: 'short', year: 'numeric' },
	);

export function relativeTime(iso: string): string {
	const diff  = Date.now() - new Date(iso).getTime();
	const mins  = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days  = Math.floor(diff / 86400000);
	if (mins  < 1)  return 'just now';
	if (mins  < 60) return `${mins}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days  < 7)  return `${days}d ago`;
	return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** An error whose message is written for guests and safe to show them. */
export class FriendlyError extends Error {}

/** Guest-safe message: FriendlyError text, otherwise the fallback (raw errors go to the console). */
export function errorMessage(err: unknown, fallback: string): string {
	if (err instanceof FriendlyError) return err.message;
	console.error(err);
	return fallback;
}
```

- [ ] **Step 18: Verify**

```bash
npx tsc --noEmit
npm run build
```

Expected: tsc prints nothing; build succeeds.

- [ ] **Step 19: Commit**

```bash
git add src/lib src/hooks/useGuestName.ts src/hooks/useMediaQuery.ts src/components/ui src/utils.ts
git commit -m "feat: storybook UI kit — cards, buttons, sheets, reveal, confetti, guest name"
```

---

### Task 3: App shell, tab bar, login, image viewer; remove Shower and pre-shower mode

**Files:**
- Modify: `src/config.ts`, `src/types.ts`, `src/components/HomeTab.tsx` (temporary edit), `src/components/ErrorBoundary.tsx`
- Rewrite: `App.tsx`, `src/components/TabBar.tsx`, `src/components/AuthGate.tsx`, `src/components/ExpandedImageModal.tsx`
- Create: `src/components/Doodles.tsx`
- Delete: `src/components/ShowerTab.tsx`, `src/components/home/GamesHero.tsx`

**Interfaces:**
- Consumes: Task 2 kit.
- Produces: `TabId = 'home' | 'timeline' | 'wishes' | 'babybook'`; `TABS: { id: TabId; label: string; Icon: Icon }[]`; `PasswordForm({ onAuth, showViewOnly })`; `AuthGate({ onAuth })` (full screen only; the old `isModal`/`onClose` props are gone — the unlock modal is now a `Sheet` in `App`).
- `HomeTab` keeps the signature `({ isUnlocked }: { isUnlocked: boolean })`.
- Header is exactly **62px** tall (`h-[60px]` + 2px bottom border); later tasks use `top-[62px]` for sticky elements.

- [ ] **Step 1: Remove shower/pre-shower from `src/config.ts`**

Delete the `SHOWER_DATE` constant and the `isPreShowerMode()` function (and its doc comment). Change the title constant to:

```ts
export const APP_TITLE = 'Baby Journey';
```

Leave `EDD`, `getCurrentWeek`, `getDaysUntilEDD`, `getGuessDateRange` untouched.

- [ ] **Step 2: Remove the `ShowerPost` type from `src/types.ts`**

Delete the whole `export type ShowerPost = { … };` block. Nothing else in `types.ts` changes. (The `shower_posts` table and its rows are untouched.)

- [ ] **Step 3: Delete the Shower tab and the games-invite hero**

```bash
git rm src/components/ShowerTab.tsx src/components/home/GamesHero.tsx
```

- [ ] **Step 4: Temporary `HomeTab` signature fix**

Replace `src/components/HomeTab.tsx` with (Task 4 rewrites it properly):

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

- [ ] **Step 5: Rewrite `src/components/TabBar.tsx`**

```tsx
import { BookOpenText, Books, HandHeart, House, type Icon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

export type TabId = 'home' | 'timeline' | 'wishes' | 'babybook';

export const TABS: { id: TabId; label: string; Icon: Icon }[] = [
	{ id: 'home',     label: 'Home',      Icon: House },
	{ id: 'timeline', label: 'Timeline',  Icon: BookOpenText },
	{ id: 'wishes',   label: 'Blessings', Icon: HandHeart },
	{ id: 'babybook', label: 'Baby Book', Icon: Books },
];

type Props = { activeTab: TabId; onTabChange: (tab: TabId) => void };

/** Floating sticker tab bar; the butter pill slides between tabs. */
export const TabBar = ({ activeTab, onTabChange }: Props) => (
	<nav
		aria-label='Sections'
		className='pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
	>
		<div className='pointer-events-auto mx-auto flex max-w-[460px] gap-1 rounded-[26px] border-2 border-ink bg-white p-1.5 shadow-sticker'>
			{TABS.map(({ id, label, Icon }) => {
				const active = activeTab === id;
				return (
					<button
						key={id}
						type='button'
						onClick={() => onTabChange(id)}
						aria-current={active ? 'page' : undefined}
						className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-[18px] px-1 py-1.5 text-[11px] font-extrabold transition-colors ${
							active ? 'text-ink' : 'text-muted hover:text-ink'
						}`}
					>
						{active && (
							<motion.span
								layoutId='tab-pill'
								className='absolute inset-0 rounded-[18px] border-2 border-ink bg-butter'
								transition={{ type: 'spring', stiffness: 520, damping: 34 }}
							/>
						)}
						<motion.span
							className='relative'
							animate={active ? { y: [0, -5, 0], scale: [1, 1.18, 1] } : { y: 0, scale: 1 }}
							transition={{ duration: 0.42 }}
						>
							<Icon size={24} weight={active ? 'duotone' : 'regular'} />
						</motion.span>
						<span className='relative'>{label}</span>
					</button>
				);
			})}
		</div>
	</nav>
);
```

- [ ] **Step 6: Create `src/components/Doodles.tsx`**

```tsx
import { motion } from 'motion/react';
import type { EmojiName } from '../emoji';
import { Emoji } from './ui/Emoji';

const ITEMS: { name: EmojiName; className: string; size: number; delay: number }[] = [
	{ name: 'balloon',       className: 'left-[6%] top-[14%]',              size: 72, delay: 0 },
	{ name: 'cloud',         className: 'left-[15%] top-[36%] opacity-60',  size: 56, delay: 0.6 },
	{ name: 'teddy-bear',    className: 'left-[8%] top-[60%]',              size: 84, delay: 1.2 },
	{ name: 'star',          className: 'right-[8%] top-[15%]',             size: 52, delay: 0.9 },
	{ name: 'crescent-moon', className: 'right-[16%] top-[37%] opacity-70', size: 46, delay: 0.3 },
	{ name: 'baby-bottle',   className: 'right-[7%] top-[58%]',             size: 78, delay: 1.8 },
];

/** Decorative floating pictures in the side gutters of wide screens (≥1280px only). */
export const Doodles = () => (
	<div aria-hidden className='pointer-events-none fixed inset-0 z-0 hidden xl:block'>
		{ITEMS.map(item => (
			<motion.div
				key={item.name}
				className={`absolute ${item.className}`}
				animate={{ y: [0, -14, 0], rotate: [-5, 5, -5] }}
				transition={{ duration: 7 + item.delay, delay: item.delay, repeat: Infinity, ease: 'easeInOut' }}
			>
				<Emoji name={item.name} size={item.size} />
			</motion.div>
		))}
	</div>
);
```

- [ ] **Step 7: Rewrite `src/components/AuthGate.tsx`**

```tsx
import { Eye, Key } from '@phosphor-icons/react';
import { motion, useAnimate } from 'motion/react';
import { FormEvent, useState } from 'react';
import { Doodles } from './Doodles';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Emoji } from './ui/Emoji';

const AUTH_STORAGE_KEY = 'timeline_auth';

type AuthOutcome = 'unlocked' | 'view-only';

type FormProps = {
	onAuth: (state: AuthOutcome) => void;
	/** Show the guest option (full-screen gate) or only the password (unlock sheet). */
	showViewOnly: boolean;
};

export const PasswordForm = ({ onAuth, showViewOnly }: FormProps) => {
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [scope, animate] = useAnimate<HTMLFormElement>();

	const handleUnlock = () => {
		const expected = import.meta.env.VITE_APP_PASSWORD;
		if (!expected) console.warn('[AuthGate] VITE_APP_PASSWORD is not set.');
		if (password.trim() === (expected ?? '').trim()) {
			try { localStorage.setItem(AUTH_STORAGE_KEY, 'unlocked'); } catch { /* ignore */ }
			onAuth('unlocked');
		} else {
			setError("That's not the password. Try again?");
			setPassword('');
			void animate(scope.current, { x: [0, -10, 10, -7, 7, -3, 3, 0] }, { duration: 0.45 });
		}
	};

	const handleViewOnly = () => {
		try { localStorage.setItem(AUTH_STORAGE_KEY, 'view-only'); } catch { /* ignore */ }
		onAuth('view-only');
	};

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (password.trim()) handleUnlock();
	};

	return (
		<form ref={scope} onSubmit={onSubmit} className='space-y-3'>
			<input
				type='password'
				value={password}
				onChange={e => { setPassword(e.target.value); setError(''); }}
				placeholder='Family password'
				aria-label='Password'
				aria-invalid={Boolean(error)}
				autoComplete='current-password'
				autoFocus={!showViewOnly}
				className='field text-center'
			/>
			{error && <p role='alert' className='text-center text-sm font-bold text-danger'>{error}</p>}
			<Button type='submit' tone='butter' size='lg' block disabled={!password.trim()}>
				<Key size={18} weight='bold' />
				Unlock
			</Button>
			{showViewOnly && (
				<Button tone='white' size='lg' block onClick={handleViewOnly}>
					<Eye size={18} weight='bold' />
					View as a guest
				</Button>
			)}
		</form>
	);
};

/** Full-screen welcome gate shown until the visitor unlocks or continues as a guest. */
export const AuthGate = ({ onAuth }: { onAuth: (state: AuthOutcome) => void }) => (
	<div className='relative flex min-h-[100dvh] items-center justify-center px-4 py-10'>
		<Doodles />
		<motion.div
			className='relative z-10 w-full max-w-sm'
			initial={{ opacity: 0, y: 24, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ type: 'spring', stiffness: 220, damping: 22 }}
		>
			<Card className='px-6 pb-7 pt-9 text-center'>
				<div className='relative mx-auto h-28 w-28'>
					<motion.div
						className='absolute -left-8 top-1'
						animate={{ y: [0, -8, 0], rotate: [-8, 4, -8] }}
						transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
					>
						<Emoji name='balloon' size={40} eager />
					</motion.div>
					<motion.div
						className='absolute -right-7 top-0'
						animate={{ scale: [1, 1.2, 1], rotate: [0, 20, 0] }}
						transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
					>
						<Emoji name='glowing-star' size={30} eager />
					</motion.div>
					<motion.div
						animate={{ y: [0, -6, 0], rotate: [-3, 3, -3] }}
						transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
					>
						<Emoji name='baby' size={112} eager />
					</motion.div>
				</div>
				<h1 className='mt-4 font-display text-display-xl font-extrabold'>Our Baby Journey</h1>
				<p className='mx-auto mt-2 max-w-[17rem] text-sm font-semibold leading-relaxed text-muted'>
					Family can unlock to add memories. Everyone else, come on in as a guest.
				</p>
				<div className='mt-6'>
					<PasswordForm onAuth={onAuth} showViewOnly />
				</div>
			</Card>
		</motion.div>
	</div>
);
```

- [ ] **Step 8: Rewrite `src/components/ExpandedImageModal.tsx`**

Same props and the **same touch/keyboard logic** as today (swipe, pinch-zoom 1–5×, Escape/arrow keys, tap backdrop to close or reset zoom); only the markup, icons, and entrance change.

```tsx
import { CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

type Props = {
	images:       string[];
	initialIndex: number;
	onClose:      () => void;
	title?:       string;
};

const ROUND_BUTTON = 'press grid h-11 w-11 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm';

export const ExpandedImageModal = ({ images, initialIndex, onClose, title }: Props) => {
	const [index, setIndex] = useState(initialIndex);
	const [scale, setScale] = useState(1);
	const isMulti = images.length > 1;

	const swipeStart = useRef<{ x: number; y: number } | null>(null);
	const pinchDist  = useRef<number | null>(null);
	const pinchBase  = useRef(1);
	const touchMode  = useRef<'swipe' | 'pinch' | null>(null);

	useEffect(() => { setIndex(initialIndex); }, [initialIndex]);
	useEffect(() => { setScale(1); }, [index]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') { if (scale > 1) setScale(1); else onClose(); }
			if (e.key === 'ArrowLeft'  && isMulti && scale <= 1) setIndex(i => (i - 1 + images.length) % images.length);
			if (e.key === 'ArrowRight' && isMulti && scale <= 1) setIndex(i => (i + 1) % images.length);
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [onClose, isMulti, images.length, scale]);

	if (!images.length) return null;

	const navigate = (dir: 1 | -1) => {
		if (scale > 1) return;
		setIndex(i => (i + dir + images.length) % images.length);
	};

	const getDist = (touches: React.TouchList) =>
		Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 2) {
			touchMode.current = 'pinch';
			pinchDist.current = getDist(e.touches);
			pinchBase.current = scale;
		} else {
			touchMode.current  = 'swipe';
			swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (e.touches.length === 2 && touchMode.current === 'pinch' && pinchDist.current !== null) {
			setScale(Math.max(1, Math.min(5, pinchBase.current * (getDist(e.touches) / pinchDist.current))));
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchMode.current === 'pinch') {
			setScale(s => (s < 1.15 ? 1 : s));
			pinchDist.current = null;
			if (e.touches.length === 0) touchMode.current = null;
			return;
		}
		if (touchMode.current === 'swipe' && swipeStart.current && isMulti && scale <= 1) {
			const dx = e.changedTouches[0].clientX - swipeStart.current.x;
			const dy = e.changedTouches[0].clientY - swipeStart.current.y;
			swipeStart.current = null;
			touchMode.current  = null;
			if (Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
		}
	};

	return (
		<motion.div
			role='dialog'
			aria-modal='true'
			aria-label='Photo viewer'
			className='fixed inset-0 z-[60] flex cursor-pointer items-center justify-center bg-ink/85 p-4 backdrop-blur-sm'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.18 }}
			onClick={() => (scale > 1 ? setScale(1) : onClose())}
		>
			<motion.div
				className='relative flex max-h-[88vh] max-w-full items-center justify-center'
				style={{ touchAction: 'none' }}
				initial={{ scale: 0.94, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 320, damping: 28 }}
				onClick={e => e.stopPropagation()}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
			>
				<img
					key={index}
					src={images[index]}
					alt={`${title ?? 'Memory'} — photo ${index + 1} of ${images.length}`}
					style={{ transform: `scale(${scale})`, transition: scale === 1 ? 'transform 0.2s ease' : 'none' }}
					className='max-h-[88vh] max-w-full cursor-auto select-none rounded-2xl border-[3px] border-white object-contain shadow-2xl'
					draggable={false}
				/>

				<button type='button' aria-label='Close' onClick={onClose} className={`${ROUND_BUTTON} absolute -right-3 -top-3 z-10`}>
					<X size={20} weight='bold' />
				</button>

				{isMulti && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:-left-14'>
							<button type='button' aria-label='Previous photo' onClick={() => navigate(-1)} className={ROUND_BUTTON}>
								<CaretLeft size={20} weight='bold' />
							</button>
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:-right-14'>
							<button type='button' aria-label='Next photo' onClick={() => navigate(1)} className={ROUND_BUTTON}>
								<CaretRight size={20} weight='bold' />
							</button>
						</div>
						<div className='pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-white px-3 py-1 text-sm font-extrabold tabular-nums'>
							{index + 1} / {images.length}
						</div>
					</>
				)}
			</motion.div>

			{isMulti && (
				<div className='absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2' onClick={e => e.stopPropagation()}>
					{images.map((_, i) => (
						<button
							key={i}
							type='button'
							onClick={() => setIndex(i)}
							aria-label={`View photo ${i + 1}`}
							className={`h-2.5 rounded-full border-2 border-white transition-all duration-200 ${i === index ? 'w-6 bg-butter' : 'w-2.5 bg-white/40'}`}
						/>
					))}
				</div>
			)}
		</motion.div>
	);
};
```

- [ ] **Step 9: Restyle `src/components/ErrorBoundary.tsx`**

Keep the class, state, `getDerivedStateFromError`, and `componentDidCatch` exactly as they are. Replace only the `if (this.state.hasError)` return value with:

```tsx
			return (
				<div className='flex min-h-screen items-center justify-center p-6'>
					<div className='w-full max-w-sm rounded-card border-2 border-ink bg-white p-8 text-center shadow-sticker'>
						<p className='font-display text-2xl font-extrabold'>Oops, something broke</p>
						<p className='mt-2 text-sm font-semibold text-muted'>{this.state.message}</p>
						<button
							type='button'
							onClick={() => this.setState({ hasError: false, message: '' })}
							className='press mt-6 rounded-2xl border-2 border-ink bg-butter px-5 py-3 font-extrabold shadow-sticker-sm'
						>
							Try again
						</button>
					</div>
				</div>
			);
```

- [ ] **Step 10: Rewrite `App.tsx`**

The milestone data layer (`fetchMilestones`, pagination, `handleSaveMilestone`, `handleDeleteMilestone`, auth storage) is copied **unchanged** from the current file. New: MotionConfig, sticky header, direction-aware tab transitions, Doodles, unlock Sheet, confetti on unlock, `#shower` cleanup.

```tsx
import { Key, LockSimple } from '@phosphor-icons/react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthGate, PasswordForm } from './src/components/AuthGate';
import { BabyBookTab } from './src/components/BabyBookTab';
import { Doodles } from './src/components/Doodles';
import { ExpandedImageModal } from './src/components/ExpandedImageModal';
import { HomeTab } from './src/components/HomeTab';
import { MemoryModal } from './src/components/MemoryModal';
import { TABS, TabBar, type TabId } from './src/components/TabBar';
import { TimelineTab } from './src/components/TimelineTab';
import { WishesTab } from './src/components/WishesTab';
import { Button } from './src/components/ui/Button';
import { Emoji } from './src/components/ui/Emoji';
import { Sheet } from './src/components/ui/Sheet';
import { celebrate } from './src/lib/celebrate';
import { supabase } from './src/supabaseClient';
import { Milestone, NewEvent } from './src/types';
import { PAGE_SIZE } from './src/constants';
import { APP_TITLE, getDaysUntilEDD } from './src/config';

const AUTH_STORAGE_KEY = 'timeline_auth';
type AuthState = 'unlocked' | 'view-only' | null;

const pageVariants = {
	enter:  (dir: number) => ({ opacity: 0, x: dir * 28 }),
	center: { opacity: 1, x: 0 },
	exit:   (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

const App = () => {
	const [milestones, setMilestones]   = useState<Milestone[]>([]);
	const [isLoading, setIsLoading]     = useState(true);
	const [error, setError]             = useState<string | null>(null);
	const [page, setPage]               = useState(0);
	const [hasMore, setHasMore]         = useState(true);
	const [activeTab, setActiveTab]     = useState<TabId>('home');
	const [direction, setDirection]     = useState(1);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [showUnlock, setShowUnlock]   = useState(false);
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
	const isUnlocked = authState === 'unlocked';

	useEffect(() => {
		// Printed shower QR codes point at /#shower. That tab is gone, so tidy the URL and stay on Home.
		if (window.location.hash === '#shower') {
			try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch { /* ignore */ }
		}
	}, []);

	const changeTab = (next: TabId) => {
		if (next === activeTab) return;
		const order = TABS.map(t => t.id);
		setDirection(order.indexOf(next) > order.indexOf(activeTab) ? 1 : -1);
		setActiveTab(next);
		window.scrollTo({ top: 0 });
	};

	const handleAuth = (state: 'unlocked' | 'view-only') => {
		setAuthState(state);
		if (state === 'unlocked') celebrate();
	};
	const handleLock = () => {
		try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch { /* ignore */ }
		setAuthState(null);
	};
	const closeUnlock = useCallback(() => setShowUnlock(false), []);

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
		} catch (err: unknown) {
			console.error(err);
			setError("Couldn't load the memories. Check your connection and try again.");
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

	if (authState === null) {
		return (
			<MotionConfig reducedMotion='user'>
				<AuthGate onAuth={handleAuth} />
			</MotionConfig>
		);
	}

	return (
		<MotionConfig reducedMotion='user'>
			<div className='min-h-screen'>
				<Doodles />

				<header className='sticky top-0 z-30 border-b-2 border-ink/10 bg-paper/85 backdrop-blur-md'>
					<div className='mx-auto flex h-[60px] max-w-[640px] items-center justify-between gap-3 px-4'>
						<button
							type='button'
							onClick={() => changeTab('home')}
							className='flex items-center gap-1.5 font-display text-[22px] font-extrabold tracking-tight'
						>
							{APP_TITLE}
							<motion.span
								className='inline-flex'
								animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.15, 1] }}
								transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 3.5 }}
							>
								<Emoji name='sparkles' size={24} eager />
							</motion.span>
						</button>
						<div className='flex items-center gap-2'>
							{daysLeft > 0 && (
								<span className='hidden items-center rounded-full border-2 border-ink bg-peach px-3 py-1 text-xs font-extrabold tabular-nums sm:inline-flex'>
									{daysLeft} days to go
								</span>
							)}
							{isUnlocked ? (
								<Button size='sm' tone='white' onClick={handleLock}>
									<LockSimple size={14} weight='bold' />
									Lock
								</Button>
							) : (
								<Button size='sm' tone='white' onClick={() => setShowUnlock(true)}>
									<Key size={14} weight='bold' />
									Unlock
								</Button>
							)}
						</div>
					</div>
				</header>

				<main className='relative z-10 mx-auto max-w-[640px] px-4 pb-40 pt-4'>
					<AnimatePresence mode='wait' initial={false} custom={direction}>
						<motion.div
							key={activeTab}
							custom={direction}
							variants={pageVariants}
							initial='enter'
							animate='center'
							exit='exit'
							transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
						>
							{activeTab === 'home' && <HomeTab isUnlocked={isUnlocked} />}
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
							{activeTab === 'wishes' && <WishesTab />}
							{activeTab === 'babybook' && <BabyBookTab isUnlocked={isUnlocked} />}
						</motion.div>
					</AnimatePresence>
				</main>

				<TabBar activeTab={activeTab} onTabChange={changeTab} />

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
				<Sheet open={showUnlock} onClose={closeUnlock} title='Unlock editing'>
					<PasswordForm
						showViewOnly={false}
						onAuth={state => { handleAuth(state); setShowUnlock(false); }}
					/>
				</Sheet>
			</div>
		</MotionConfig>
	);
};

export default App;
```

- [ ] **Step 11: Verify no stale references**

```bash
grep -rn "isPreShowerMode\|SHOWER_DATE\|ShowerTab\|ShowerPost\|GamesHero\|preShower\|'shower'" --include=*.ts --include=*.tsx App.tsx main.tsx src
```

Expected: no output.

- [ ] **Step 12: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 13: Commit**

```bash
git add App.tsx src/components/TabBar.tsx src/components/Doodles.tsx src/components/AuthGate.tsx src/components/ExpandedImageModal.tsx src/components/ErrorBoundary.tsx src/components/HomeTab.tsx src/config.ts src/types.ts
git commit -m "feat: storybook app shell — sliding tab bar, transitions, new login; remove shower tab and pre-shower mode"
```

---

### Task 4: Home — hero, fact ticker, poll deck, tiles and sheets

**Files:**
- Modify: `src/data/funPolls.ts`
- Create: `src/data/polls.ts`, `src/data/fruitImages.ts`, `src/hooks/usePolls.ts`, `src/hooks/useGuesses.ts`
- Create: `src/components/home/HeroCard.tsx`, `FactTicker.tsx`, `PollDeck.tsx`, `HomeTiles.tsx`, `ScoreSheet.tsx`, `GuessPanel.tsx`
- Rewrite: `src/components/HomeTab.tsx`
- Delete: `src/components/home/CountdownHero.tsx`, `FruitTracker.tsx`, `WeeklyFacts.tsx`, `PollWidget.tsx`, `TraitPolls.tsx`, `FunPolls.tsx`, `GuessingGame.tsx`

**Interfaces:**
- Consumes: kit from Task 2; `getCurrentWeek`, `getDaysUntilEDD`, `EDD`, `getGuessDateRange` from `src/config.ts`; `getFruitForWeek` + `FruitEntry` from `src/data/fruitData.ts`; `getFactsForWeek` from `src/data/weeklyFacts.ts`.
- Produces: `usePolls()` → `{ state: PollsState; voteGender(choice, name); voteTrait(trait, side); voteFun(poll, side) }`; `useGuesses()` → `{ guesses, loading, myGuess, hasWinner, submit(name, date), revealWinner() }`.
- DB semantics that MUST be preserved exactly:
  - `votes`: `insert({ voter_id, choice, voter_name })`, one per `voter_id`, never updated; name required.
  - `trait_votes`: `upsert({ voter_id, trait, choice }, { onConflict: 'voter_id,trait' })`.
  - `fun_poll_votes`: `upsert({ voter_id, poll, choice }, { onConflict: 'voter_id,poll' })`.
  - `guesses`: `upsert({ voter_id, guesser_name, guess_date, is_winner: false }, { onConflict: 'voter_id' })`; date must be within `getGuessDateRange()`; reveal sets `is_winner = true` where `guess_date` equals `birth_capsule.birth_date` (earliest capsule row).

- [ ] **Step 1: Update `src/data/funPolls.ts`**

Poll ids and labels are unchanged (they match the DB check constraint). Questions lose their trailing native emoji; each poll gains a Fluent picture.

```ts
import type { EmojiName } from '../emoji';

export type FunPollId = 'sleep' | 'diaper' | 'inherit' | 'pushover' | 'googler';
export type FunPollChoice = 'aditi' | 'kartik';

export type FunPollDef = {
	id: FunPollId;
	question: string;
	aditiLabel: string;
	kartikLabel: string;
	emoji: EmojiName;
};

export const FUN_POLLS: FunPollDef[] = [
	{ id: 'sleep',    question: 'Whose sleep schedule will baby ruin first?',      aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'sleeping-face' },
	{ id: 'diaper',   question: 'Who will cry more during diaper changes?',        aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'loudly-crying-face' },
	{ id: 'inherit',  question: 'What will baby inherit?',                         aditiLabel: "Aditi's patience", kartikLabel: "Kartik's appetite", emoji: 'dna' },
	{ id: 'pushover', question: 'Who will baby have wrapped around their finger?', aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'melting-face' },
	{ id: 'googler',  question: 'Who googles "is this normal?" at 3am more?',      aditiLabel: 'Aditi',            kartikLabel: 'Kartik',            emoji: 'magnifying-glass' },
];
```

- [ ] **Step 2: Create `src/data/polls.ts`**

```ts
import type { EmojiName } from '../emoji';
import { FUN_POLLS, type FunPollId } from './funPolls';

export type Side = 'aditi' | 'kartik';
export type Gender = 'boy' | 'girl';
export type TraitId = 'eyes' | 'nose' | 'hair' | 'smile';

export const TRAIT_IDS: TraitId[] = ['eyes', 'nose', 'hair', 'smile'];

export type SideResult = { mine: Side | null; counts: Record<Side, number> };

export type PollsState = {
	loading: boolean;
	gender: { mine: Gender | null; boys: number; girls: number };
	traits: Record<TraitId, SideResult>;
	fun: Record<FunPollId, SideResult>;
};

export type PollItem =
	| { kind: 'gender'; id: 'gender'; tag: string; question: string; emoji: EmojiName }
	| { kind: 'trait'; id: TraitId; tag: string; question: string; emoji: EmojiName }
	| { kind: 'fun'; id: FunPollId; tag: string; question: string; emoji: EmojiName; aditiLabel: string; kartikLabel: string };

const TRAITS: { id: TraitId; question: string; emoji: EmojiName }[] = [
	{ id: 'eyes',  question: 'Whose eyes will baby have?',  emoji: 'eyes' },
	{ id: 'nose',  question: 'Whose nose will baby have?',  emoji: 'nose' },
	{ id: 'hair',  question: 'Whose hair will baby have?',  emoji: 'person-curly-hair' },
	{ id: 'smile', question: 'Whose smile will baby have?', emoji: 'smiling-face-with-smiling-eyes' },
];

/** Deck order: boy/girl, then the four look-alike traits, then Aditi vs Kartik. */
export const POLL_ITEMS: PollItem[] = [
	{ kind: 'gender', id: 'gender', tag: 'Boy or girl?', question: 'What do you think baby is?', emoji: 'thinking-face' },
	...TRAITS.map(t => ({ kind: 'trait' as const, id: t.id, tag: 'Who will baby look like?', question: t.question, emoji: t.emoji })),
	...FUN_POLLS.map(p => ({
		kind: 'fun' as const,
		id: p.id,
		tag: 'Aditi vs Kartik',
		question: p.question,
		emoji: p.emoji,
		aditiLabel: p.aditiLabel,
		kartikLabel: p.kartikLabel,
	})),
];

/** Each fun poll is one point for whoever leads it; ties count for neither. */
export function scoreFun(fun: Record<FunPollId, SideResult>): { aditi: number; kartik: number; started: number } {
	let aditi = 0;
	let kartik = 0;
	let started = 0;
	for (const poll of FUN_POLLS) {
		const { counts } = fun[poll.id];
		if (counts.aditi + counts.kartik === 0) continue;
		started++;
		if (counts.aditi > counts.kartik) aditi++;
		else if (counts.kartik > counts.aditi) kartik++;
	}
	return { aditi, kartik, started };
}
```

- [ ] **Step 3: Create `src/data/fruitImages.ts`**

```ts
import type { EmojiName } from '../emoji';
import type { FruitEntry } from './fruitData';

/** Maps each fruitData emoji to its Fluent 3D picture. */
const FRUIT_IMAGES: Record<string, EmojiName> = {
	'🌱': 'seedling',   '🌿': 'herb',        '💚': 'green-heart', '🫐': 'blueberries',  '🫘': 'beans',
	'🍇': 'grapes',     '🍊': 'tangerine',   '🍂': 'fallen-leaf', '🍋': 'lemon',        '🍑': 'peach',
	'🍎': 'red-apple',  '🥑': 'avocado',     '🍐': 'pear',        '🫑': 'bell-pepper',  '🥭': 'mango',
	'🍌': 'banana',     '🥕': 'carrot',      '🍈': 'melon',       '🌽': 'ear-of-corn',  '🥦': 'broccoli',
	'🥔': 'potato',     '🍆': 'eggplant',    '🎃': 'jack-o-lantern', '🥬': 'leafy-green', '🥥': 'coconut',
	'🍍': 'pineapple',  '🍉': 'watermelon',
};

export const fruitImage = (entry: FruitEntry): EmojiName => FRUIT_IMAGES[entry.emoji] ?? 'baby';
```

Verify every week maps (must print `missing: none`):

```bash
node -e "const fs=require('fs');const d=fs.readFileSync('src/data/fruitData.ts','utf8');const m=fs.readFileSync('src/data/fruitImages.ts','utf8');const used=[...new Set([...d.matchAll(/emoji:\s*'([^']+)'/g)].map(x=>x[1]))];const missing=used.filter(e=>!m.includes(\"'\"+e+\"'\"));console.log('missing:',missing.length?missing.join(' '):'none')"
```

- [ ] **Step 4: Create `src/hooks/usePolls.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getVoterId } from '../utils';
import { FUN_POLLS, type FunPollId } from '../data/funPolls';
import { TRAIT_IDS, type Gender, type PollsState, type Side, type SideResult, type TraitId } from '../data/polls';

const emptySide = (): SideResult => ({ mine: null, counts: { aditi: 0, kartik: 0 } });

const initialState = (): PollsState => ({
	loading: true,
	gender: { mine: null, boys: 0, girls: 0 },
	traits: Object.fromEntries(TRAIT_IDS.map(t => [t, emptySide()])) as Record<TraitId, SideResult>,
	fun: Object.fromEntries(FUN_POLLS.map(p => [p.id, emptySide()])) as Record<FunPollId, SideResult>,
});

const isSide = (value: unknown): value is Side => value === 'aditi' || value === 'kartik';

/** Moves this visitor's vote to `side`, adjusting counts. */
const applySide = (result: SideResult, side: Side): SideResult => {
	const counts = { ...result.counts };
	if (result.mine) counts[result.mine] = Math.max(0, counts[result.mine] - 1);
	counts[side]++;
	return { mine: side, counts };
};

/** All ten polls (boy/girl, traits, Aditi vs Kartik) with realtime counts and optimistic voting. */
export function usePolls() {
	const voterId = useRef(getVoterId()).current;
	const [state, setState] = useState<PollsState>(initialState);
	const stateRef = useRef(state);
	stateRef.current = state;

	const load = useCallback(async () => {
		const [genderRes, traitRes, funRes] = await Promise.all([
			supabase.from('votes').select('choice, voter_id'),
			supabase.from('trait_votes').select('trait, choice, voter_id'),
			supabase.from('fun_poll_votes').select('poll, choice, voter_id'),
		]);
		const next = initialState();
		next.loading = false;
		for (const row of genderRes.data ?? []) {
			if (row.choice === 'boy') next.gender.boys++;
			else if (row.choice === 'girl') next.gender.girls++;
			else continue;
			if (row.voter_id === voterId) next.gender.mine = row.choice as Gender;
		}
		for (const row of traitRes.data ?? []) {
			const result = next.traits[row.trait as TraitId];
			if (!result || !isSide(row.choice)) continue;
			result.counts[row.choice]++;
			if (row.voter_id === voterId) result.mine = row.choice;
		}
		for (const row of funRes.data ?? []) {
			const result = next.fun[row.poll as FunPollId];
			if (!result || !isSide(row.choice)) continue;
			result.counts[row.choice]++;
			if (row.voter_id === voterId) result.mine = row.choice;
		}
		setState(next);
	}, [voterId]);

	useEffect(() => {
		void load();
		let timer: ReturnType<typeof setTimeout> | undefined;
		const refresh = () => {
			clearTimeout(timer);
			timer = setTimeout(() => { void load(); }, 250);
		};
		const channel = supabase
			.channel('polls-realtime')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, refresh)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'trait_votes' }, refresh)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'fun_poll_votes' }, refresh)
			.subscribe();
		return () => {
			clearTimeout(timer);
			void supabase.removeChannel(channel);
		};
	}, [load]);

	/** Boy/girl: one vote per device, never changed. Name is required. */
	const voteGender = useCallback(async (choice: Gender, name: string) => {
		const before = stateRef.current.gender;
		if (before.mine) return;
		setState(prev => ({
			...prev,
			gender: {
				mine: choice,
				boys: prev.gender.boys + (choice === 'boy' ? 1 : 0),
				girls: prev.gender.girls + (choice === 'girl' ? 1 : 0),
			},
		}));
		const { error } = await supabase.from('votes').insert({ voter_id: voterId, choice, voter_name: name });
		if (error) {
			setState(prev => ({ ...prev, gender: before }));
			throw error;
		}
	}, [voterId]);

	const voteTrait = useCallback(async (trait: TraitId, side: Side) => {
		const before = stateRef.current.traits[trait];
		setState(prev => ({ ...prev, traits: { ...prev.traits, [trait]: applySide(prev.traits[trait], side) } }));
		const { error } = await supabase
			.from('trait_votes')
			.upsert({ voter_id: voterId, trait, choice: side }, { onConflict: 'voter_id,trait' });
		if (error) {
			setState(prev => ({ ...prev, traits: { ...prev.traits, [trait]: before } }));
			throw error;
		}
	}, [voterId]);

	const voteFun = useCallback(async (poll: FunPollId, side: Side) => {
		const before = stateRef.current.fun[poll];
		setState(prev => ({ ...prev, fun: { ...prev.fun, [poll]: applySide(prev.fun[poll], side) } }));
		const { error } = await supabase
			.from('fun_poll_votes')
			.upsert({ voter_id: voterId, poll, choice: side }, { onConflict: 'voter_id,poll' });
		if (error) {
			setState(prev => ({ ...prev, fun: { ...prev.fun, [poll]: before } }));
			throw error;
		}
	}, [voterId]);

	return { state, voteGender, voteTrait, voteFun };
}
```

- [ ] **Step 5: Create `src/hooks/useGuesses.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { FriendlyError, getVoterId } from '../utils';
import { getGuessDateRange } from '../config';
import { Guess } from '../types';

export const GUESS_RANGE = getGuessDateRange();

export const formatGuessDate = (value: string): string =>
	new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const byCreated = (a: Guess, b: Guess) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

/** Guess-the-birthday: everyone's guesses, this visitor's guess, and the unlocked winner reveal. */
export function useGuesses() {
	const voterId = useRef(getVoterId()).current;
	const [guesses, setGuesses] = useState<Guess[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data } = await supabase.from('guesses').select('*').order('created_at', { ascending: true });
			if (cancelled) return;
			setGuesses(data ?? []);
			setLoading(false);
		})();
		return () => { cancelled = true; };
	}, []);

	const submit = useCallback(async (name: string, date: string) => {
		if (date < GUESS_RANGE.min || date > GUESS_RANGE.max) {
			throw new FriendlyError(`Pick a date between ${formatGuessDate(GUESS_RANGE.min)} and ${formatGuessDate(GUESS_RANGE.max)}.`);
		}
		const { data, error } = await supabase
			.from('guesses')
			.upsert({ voter_id: voterId, guesser_name: name, guess_date: date, is_winner: false }, { onConflict: 'voter_id' })
			.select()
			.single();
		if (error) throw error;
		setGuesses(prev => [...prev.filter(g => g.voter_id !== voterId), data as Guess].sort(byCreated));
	}, [voterId]);

	const revealWinner = useCallback(async () => {
		const { data: capsule } = await supabase
			.from('birth_capsule')
			.select('birth_date')
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle();
		if (!capsule?.birth_date) throw new FriendlyError('Fill in the birth date in the Baby Book first.');
		const birthDate = capsule.birth_date as string;
		const { error } = await supabase.from('guesses').update({ is_winner: true }).eq('guess_date', birthDate);
		if (error) throw error;
		setGuesses(prev => prev.map(g => ({ ...g, is_winner: g.guess_date === birthDate })));
	}, []);

	const myGuess = guesses.find(g => g.voter_id === voterId) ?? null;
	const hasWinner = guesses.some(g => g.is_winner);

	return { guesses, loading, myGuess, hasWinner, submit, revealWinner };
}
```

- [ ] **Step 6: Create `src/components/home/HeroCard.tsx`**

```tsx
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';
import { EDD, getCurrentWeek, getDaysUntilEDD } from '../../config';
import { getFruitForWeek } from '../../data/fruitData';
import { fruitImage } from '../../data/fruitImages';
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

	return (
		<Card tone='peach' className='flex items-center gap-4 p-4 sm:gap-5 sm:p-5'>
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
		</Card>
	);
};
```

- [ ] **Step 7: Create `src/components/home/FactTicker.tsx`**

```tsx
import { CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { getCurrentWeek } from '../../config';
import { getFactsForWeek } from '../../data/weeklyFacts';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';

/** One of this week's three facts; tap to cycle. */
export const FactTicker = () => {
	const { facts } = getFactsForWeek(getCurrentWeek());
	const [index, setIndex] = useState(0);

	return (
		<Card
			interactive
			onClick={() => setIndex(i => (i + 1) % facts.length)}
			aria-label={`Fact ${index + 1} of ${facts.length}: ${facts[index]}. Next fact`}
			className='flex items-center gap-3 px-3.5 py-3'
		>
			<div className='grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-ink bg-mint'>
				<Emoji name='light-bulb' size={24} eager />
			</div>
			<div className='relative flex min-h-[40px] flex-1 items-center overflow-hidden'>
				<AnimatePresence mode='wait' initial={false}>
					<motion.p
						key={index}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.2 }}
						className='text-[13.5px] font-bold leading-snug'
					>
						{facts[index]}
					</motion.p>
				</AnimatePresence>
			</div>
			<span className='flex shrink-0 items-center gap-0.5 text-xs font-extrabold tabular-nums text-muted'>
				{index + 1}/{facts.length}
				<CaretRight size={12} weight='bold' />
			</span>
		</Card>
	);
};
```

- [ ] **Step 8: Create `src/components/home/PollDeck.tsx`**

```tsx
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
```

- [ ] **Step 9: Create `src/components/home/HomeTiles.tsx`**

```tsx
import { motion } from 'motion/react';
import type { FunPollId } from '../../data/funPolls';
import { scoreFun, type SideResult } from '../../data/polls';
import { formatGuessDate } from '../../hooks/useGuesses';
import type { Guess } from '../../types';
import { Card } from '../ui/Card';
import { Emoji } from '../ui/Emoji';

export const GuessTile = ({ count, myGuess, onOpen }: { count: number; myGuess: Guess | null; onOpen: () => void }) => (
	<Card tone='butter' interactive onClick={onOpen} aria-label='Open guess the day' style={{ rotate: -1.2 }} className='p-3.5'>
		<Emoji name='tear-off-calendar' size={38} />
		<p className='mt-2 font-display text-[17px] font-extrabold leading-tight'>Guess the day</p>
		<p className='mt-0.5 text-xs font-bold text-ink/65'>
			{myGuess ? `You picked ${formatGuessDate(myGuess.guess_date)}` : count === 1 ? '1 guess so far' : `${count} guesses so far`}
		</p>
	</Card>
);

export const ScoreTile = ({ fun, onOpen }: { fun: Record<FunPollId, SideResult>; onOpen: () => void }) => {
	const { aditi, kartik, started } = scoreFun(fun);
	const hasLeader = aditi !== kartik;
	return (
		<Card tone='lav' interactive onClick={onOpen} aria-label='Open Aditi vs Kartik scores' style={{ rotate: 1.2 }} className='p-3.5'>
			<motion.div
				className='inline-block'
				animate={hasLeader ? { rotate: [0, -12, 10, 0], y: [0, -3, 0] } : { rotate: 0, y: 0 }}
				transition={{ duration: 1, repeat: hasLeader ? Infinity : 0, repeatDelay: 2.5 }}
			>
				<Emoji name='crown' size={38} />
			</motion.div>
			<p className='mt-2 font-display text-[17px] font-extrabold leading-tight tabular-nums'>
				{started ? `${aditi} – ${kartik}` : 'Who wins?'}
			</p>
			<p className='mt-0.5 text-xs font-bold text-ink/65'>Aditi vs Kartik</p>
		</Card>
	);
};
```

- [ ] **Step 10: Create `src/components/home/ScoreSheet.tsx`**

```tsx
import { motion } from 'motion/react';
import { FUN_POLLS, type FunPollId } from '../../data/funPolls';
import { scoreFun, type SideResult } from '../../data/polls';
import { BAR } from '../../lib/palette';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Emoji } from '../ui/Emoji';
import { ResultBar } from '../ui/ResultBar';

const SideScore = ({ name, score, bg, leading }: { name: string; score: number; bg: string; leading: boolean }) => (
	<div className='flex flex-col items-center'>
		<div className='h-9'>
			{leading && (
				<motion.div
					initial={{ y: -12, opacity: 0, rotate: -20 }}
					animate={{ y: 0, opacity: 1, rotate: 0 }}
					transition={{ type: 'spring', stiffness: 400, damping: 14 }}
				>
					<Emoji name='crown' size={32} />
				</motion.div>
			)}
		</div>
		<div className={`grid h-16 w-16 place-items-center rounded-full border-2 border-ink shadow-sticker-sm ${bg}`}>
			<AnimatedNumber value={score} className='font-display text-3xl font-extrabold' />
		</div>
		<p className='mt-2 font-display text-base font-extrabold'>{name}</p>
	</div>
);

export const ScoreSheet = ({ fun }: { fun: Record<FunPollId, SideResult> }) => {
	const { aditi, kartik } = scoreFun(fun);
	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-card border-2 border-ink bg-white p-4 text-center shadow-sticker-sm'>
				<SideScore name='Aditi' score={aditi} bg='bg-lav' leading={aditi > kartik} />
				<span className='font-display text-lg font-extrabold text-muted'>vs</span>
				<SideScore name='Kartik' score={kartik} bg='bg-mint' leading={kartik > aditi} />
			</div>
			<p className='text-center text-xs font-bold text-muted'>Each poll is a point for whoever's leading it.</p>
			{FUN_POLLS.map(poll => {
				const { counts, mine } = fun[poll.id];
				const total = counts.aditi + counts.kartik;
				return (
					<div key={poll.id} className='rounded-2xl border-2 border-ink bg-white p-3.5'>
						<div className='mb-3 flex items-center gap-2.5'>
							<Emoji name={poll.emoji} size={30} />
							<p className='font-display text-[15px] font-extrabold leading-snug'>{poll.question}</p>
						</div>
						<div className='space-y-2'>
							<ResultBar label={poll.aditiLabel} count={counts.aditi} total={total} color={BAR.aditi} mine={mine === 'aditi'} />
							<ResultBar label={poll.kartikLabel} count={counts.kartik} total={total} color={BAR.kartik} mine={mine === 'kartik'} />
						</div>
						<p className='mt-1.5 text-right text-[11px] font-bold text-muted'>{total === 1 ? '1 vote' : `${total} votes`}</p>
					</div>
				);
			})}
		</div>
	);
};
```

- [ ] **Step 11: Create `src/components/home/GuessPanel.tsx`**

```tsx
import { PencilSimple } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { EDD } from '../../config';
import { GUESS_RANGE, formatGuessDate, type useGuesses } from '../../hooks/useGuesses';
import { saveGuestName, useGuestName } from '../../hooks/useGuestName';
import { burstFrom, celebrate } from '../../lib/celebrate';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';
import { Spinner } from '../ui/Spinner';

type Props = { data: ReturnType<typeof useGuesses>; isUnlocked: boolean };

export const GuessPanel = ({ data, isUnlocked }: Props) => {
	const { guesses, loading, myGuess, hasWinner, submit, revealWinner } = data;
	const remembered = useGuestName();
	const [editing, setEditing] = useState(false);
	const [name, setName] = useState(myGuess?.guesser_name ?? remembered);
	const [date, setDate] = useState(myGuess?.guess_date ?? '');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (loading) return <Spinner label='Loading guesses' />;

	const showForm = !myGuess || editing;
	const due = new Date(`${EDD}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!name.trim() || !date) return;
		const submitButton = e.currentTarget.querySelector('button[type=submit]');
		setBusy(true);
		setError(null);
		try {
			await submit(name.trim(), date);
			saveGuestName(name);
			burstFrom(submitButton);
			setEditing(false);
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't save your guess. Try again?"));
		} finally {
			setBusy(false);
		}
	};

	const onReveal = async () => {
		setError(null);
		try {
			await revealWinner();
			celebrate();
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't reveal the winner. Try again?"));
		}
	};

	return (
		<div className='space-y-4'>
			<p className='text-sm font-semibold text-muted'>Pick the day you think baby arrives. The due date is {due}.</p>

			{showForm ? (
				<form onSubmit={e => void onSubmit(e)} className='space-y-3'>
					<div>
						<label className='field-label' htmlFor='guess-name'>Your name</label>
						<input id='guess-name' className='field' autoComplete='name' required value={name} onChange={e => setName(e.target.value)} />
					</div>
					<div>
						<label className='field-label' htmlFor='guess-date'>Your guess</label>
						<input
							id='guess-date'
							type='date'
							className='field'
							required
							min={GUESS_RANGE.min}
							max={GUESS_RANGE.max}
							value={date}
							onChange={e => setDate(e.target.value)}
						/>
					</div>
					<div className='flex gap-2.5'>
						{editing && (
							<Button tone='white' size='lg' onClick={() => { setEditing(false); setError(null); }}>
								Cancel
							</Button>
						)}
						<Button type='submit' tone='butter' size='lg' className='flex-1' disabled={busy || !name.trim() || !date}>
							<Emoji name='bullseye' size={22} />
							{busy ? 'Saving…' : 'Place my guess'}
						</Button>
					</div>
				</form>
			) : myGuess && (
				<div className='flex items-center justify-between gap-3 rounded-2xl border-2 border-ink bg-butter px-4 py-3 shadow-sticker-sm'>
					<div>
						<p className='eyebrow text-ink/60'>Your guess</p>
						<p className='font-display text-display-md font-extrabold'>{formatGuessDate(myGuess.guess_date)}</p>
					</div>
					<Button
						size='sm'
						tone='white'
						onClick={() => { setName(myGuess.guesser_name); setDate(myGuess.guess_date); setEditing(true); }}
					>
						<PencilSimple size={14} weight='bold' />
						Edit
					</Button>
				</div>
			)}

			{isUnlocked && !hasWinner && guesses.length > 0 && (
				<Button tone='pink' block onClick={() => void onReveal()}>
					<Emoji name='party-popper' size={20} />
					Reveal the winner
				</Button>
			)}

			{error && <ErrorNote>{error}</ErrorNote>}

			<section aria-label='All guesses'>
				<p className='field-label'>{guesses.length === 1 ? '1 guess' : `${guesses.length} guesses`}</p>
				{guesses.length === 0 ? (
					<p className='rounded-2xl border-2 border-dashed border-ink/25 px-4 py-6 text-center text-sm font-bold text-muted'>
						No guesses yet. Be the first!
					</p>
				) : (
					<ul className='space-y-2'>
						{guesses.map((g, i) => (
							<motion.li
								key={g.id}
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: Math.min(i * 0.03, 0.4) }}
								className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 ${
									g.is_winner ? 'border-ink bg-butter shadow-sticker-sm' : 'border-ink/15 bg-white'
								}`}
							>
								<div className='min-w-0'>
									<p className='truncate text-xs font-bold text-muted'>{g.guesser_name}</p>
									<p className='font-display text-base font-extrabold'>{formatGuessDate(g.guess_date)}</p>
								</div>
								{g.is_winner && <Emoji name='crown' size={28} alt='Winner' />}
							</motion.li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
};
```

- [ ] **Step 12: Rewrite `src/components/HomeTab.tsx`**

```tsx
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { useGuesses } from '../hooks/useGuesses';
import { usePolls } from '../hooks/usePolls';
import { riseIn, stagger } from '../lib/motion';
import { FactTicker } from './home/FactTicker';
import { GuessPanel } from './home/GuessPanel';
import { GuessTile, ScoreTile } from './home/HomeTiles';
import { HeroCard } from './home/HeroCard';
import { PollDeck } from './home/PollDeck';
import { ScoreSheet } from './home/ScoreSheet';
import { Emoji } from './ui/Emoji';
import { Sheet } from './ui/Sheet';

export const HomeTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const polls = usePolls();
	const guesses = useGuesses();
	const [sheet, setSheet] = useState<'guess' | 'score' | null>(null);
	const closeSheet = useCallback(() => setSheet(null), []);

	return (
		<>
			<motion.div variants={stagger} initial='hidden' animate='show' className='space-y-5'>
				<motion.div variants={riseIn}><HeroCard /></motion.div>
				<motion.div variants={riseIn}><FactTicker /></motion.div>
				<motion.div variants={riseIn}><PollDeck polls={polls} /></motion.div>
				<motion.div variants={riseIn} className='grid grid-cols-2 gap-3.5 pt-1'>
					<GuessTile count={guesses.guesses.length} myGuess={guesses.myGuess} onOpen={() => setSheet('guess')} />
					<ScoreTile fun={polls.state.fun} onOpen={() => setSheet('score')} />
				</motion.div>
			</motion.div>

			<Sheet
				open={sheet === 'guess'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Guess the day <Emoji name='tear-off-calendar' size={26} /></span>}
			>
				<GuessPanel data={guesses} isUnlocked={isUnlocked} />
			</Sheet>
			<Sheet
				open={sheet === 'score'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Aditi vs Kartik <Emoji name='crown' size={26} /></span>}
			>
				<ScoreSheet fun={polls.state.fun} />
			</Sheet>
		</>
	);
};
```

- [ ] **Step 13: Delete the old Home components**

```bash
git rm src/components/home/CountdownHero.tsx src/components/home/FruitTracker.tsx src/components/home/WeeklyFacts.tsx src/components/home/PollWidget.tsx src/components/home/TraitPolls.tsx src/components/home/FunPolls.tsx src/components/home/GuessingGame.tsx
```

- [ ] **Step 14: Verify**

```bash
npx tsc --noEmit
npm run build
grep -rn "lucide-react" src/components/home src/components/HomeTab.tsx src/hooks src/data || echo "none"
```

Expected: tsc silent, build succeeds, grep prints `none`.

- [ ] **Step 15: Commit**

```bash
git add src/data src/hooks/usePolls.ts src/hooks/useGuesses.ts src/components/home src/components/HomeTab.tsx
git commit -m "feat: storybook home — hero ring, fact ticker, swipeable poll deck, guess and score sheets"
```

---

### Task 5: Timeline — month groups, compact polaroid cards, memory sheet, edit form

**Files:**
- Create: `src/components/timeline/timelineIcons.tsx`, `MemoryCard.tsx`, `PhotoCarousel.tsx`, `MemoryView.tsx`, `MemoryForm.tsx`
- Rewrite: `src/components/TimelineTab.tsx`
- Modify: `App.tsx`, `src/utils.ts` (remove `formatDate`), `src/constants.ts` (remove `FADE_IN_*`)
- Delete: `src/components/TimelineItem.tsx`, `src/components/MemoryModal.tsx`, `src/icons.tsx`, `src/hooks/useSwipe.ts`

**Interfaces:**
- `TimelineTab` props are unchanged: `milestones, isLoading, error, hasMore, isUnlocked, onLoadMore, onImageClick(images, idx, title), onEditClick(m), onAddClick`.
- `MemoryForm({ editingMilestone, onSave, onDelete })` — same save/delete/upload logic as `MemoryModal`, rendered inside `Sheet` by `App`.
- `timelineIcon(type: IconType) → { Icon: Icon; bg: string }` (fallback `camera`).
- Milestone order (ascending by date, then id) and pagination are unchanged.

- [ ] **Step 1: Create `src/components/timeline/timelineIcons.tsx`**

```tsx
import { Baby, Camera, Footprints, Gift, Heart, Moon, MusicNotes, Smiley, Star, type Icon } from '@phosphor-icons/react';
import type { IconType } from '../../types';

const ICONS: Record<IconType, { Icon: Icon; bg: string }> = {
	heart:      { Icon: Heart,      bg: 'bg-pink' },
	baby:       { Icon: Baby,       bg: 'bg-sky' },
	star:       { Icon: Star,       bg: 'bg-butter' },
	smile:      { Icon: Smiley,     bg: 'bg-peach' },
	gift:       { Icon: Gift,       bg: 'bg-mint' },
	moon:       { Icon: Moon,       bg: 'bg-lav' },
	music:      { Icon: MusicNotes, bg: 'bg-pink' },
	footprints: { Icon: Footprints, bg: 'bg-peach' },
	camera:     { Icon: Camera,     bg: 'bg-lav' },
};

export const timelineIcon = (type: IconType) => ICONS[type] ?? ICONS.camera;
```

- [ ] **Step 2: Create `src/components/timeline/MemoryCard.tsx`**

Compact layout: text on the left, a small tilted polaroid on the right. Tapping opens the memory sheet; the edit button sits outside the card (no nested interactive elements).

```tsx
import { PencilSimple } from '@phosphor-icons/react';
import { memo, useState } from 'react';
import { Milestone, getImages } from '../../types';
import { formatDay } from '../../utils';
import { Card } from '../ui/Card';
import { Reveal } from '../ui/Reveal';
import { timelineIcon } from './timelineIcons';

type Props = {
	milestone: Milestone;
	index: number;
	isUnlocked: boolean;
	onOpen: (m: Milestone) => void;
	onEdit: (m: Milestone) => void;
};

export const MemoryCard = memo(({ milestone, index, isUnlocked, onOpen, onEdit }: Props) => {
	const images = getImages(milestone);
	const { Icon, bg } = timelineIcon(milestone.icon);
	const tilt = index % 2 === 0 ? -2.5 : 2.5;
	const [loaded, setLoaded] = useState(false);

	return (
		<Reveal className='relative mb-5'>
			<div aria-hidden className={`absolute -left-[38px] top-3 z-[1] grid h-8 w-8 place-items-center rounded-full border-2 border-ink ${bg}`}>
				<Icon size={17} weight='duotone' />
			</div>
			<Card interactive onClick={() => onOpen(milestone)} aria-label={`Open memory: ${milestone.title}`} className='flex gap-3 p-3.5'>
				<div className='min-w-0 flex-1'>
					<p className='eyebrow text-muted'>{formatDay(milestone.date)}</p>
					<h3 className='mt-1 font-display text-[17px] font-extrabold leading-snug'>{milestone.title}</h3>
					{milestone.description && (
						<p className='mt-1.5 line-clamp-3 text-[13.5px] font-semibold leading-relaxed text-ink/75'>{milestone.description}</p>
					)}
				</div>
				{images.length > 0 && (
					<div
						className='relative w-[104px] shrink-0 self-start rounded-[4px] border border-ink/10 bg-white p-1 pb-3 shadow-[0_6px_14px_-8px_rgba(43,35,64,0.45)] sm:w-[132px]'
						style={{ transform: `rotate(${tilt}deg)` }}
					>
						<div className='relative aspect-square overflow-hidden rounded-[2px] bg-dot/50'>
							{!loaded && <div className='absolute inset-0 animate-pulse bg-dot/70' />}
							<img
								src={images[0]}
								alt=''
								loading='lazy'
								decoding='async'
								draggable={false}
								onLoad={() => setLoaded(true)}
								className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
							/>
						</div>
						{images.length > 1 && (
							<span className='absolute -right-2 -top-2 rounded-full border-2 border-ink bg-butter px-1.5 text-[11px] font-extrabold tabular-nums'>
								+{images.length - 1}
							</span>
						)}
					</div>
				)}
			</Card>
			{isUnlocked && (
				<button
					type='button'
					aria-label={`Edit ${milestone.title}`}
					onClick={() => onEdit(milestone)}
					className='press absolute -bottom-2 right-3 z-[2] grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-white shadow-sticker-sm'
				>
					<PencilSimple size={14} weight='bold' />
				</button>
			)}
		</Reveal>
	);
});
MemoryCard.displayName = 'MemoryCard';
```

- [ ] **Step 3: Create `src/components/timeline/PhotoCarousel.tsx`**

```tsx
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

type Props = { images: string[]; title: string; onOpen: (index: number) => void };

const slide = {
	enter:  (dir: number) => ({ x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0, opacity: dir === 0 ? 0 : 1 }),
	center: { x: 0, opacity: 1 },
	exit:   (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 1 }),
};

const ARROW = 'press grid h-9 w-9 place-items-center rounded-full border-2 border-ink bg-white/95 shadow-sticker-sm';

/** Swipeable photos for the memory sheet; tap a photo to open it full screen. */
export const PhotoCarousel = ({ images, title, onOpen }: Props) => {
	const [[index, dir], setView] = useState<[number, number]>([0, 0]);
	const multi = images.length > 1;
	const go = (step: number) => setView(([i]) => [(i + step + images.length) % images.length, step]);

	return (
		<div>
			<div className='relative aspect-[4/3] overflow-hidden rounded-2xl border-2 border-ink bg-dot/40 shadow-sticker-sm'>
				<AnimatePresence initial={false} custom={dir}>
					<motion.img
						key={index}
						src={images[index]}
						alt={`${title} — photo ${index + 1} of ${images.length}`}
						custom={dir}
						variants={slide}
						initial='enter'
						animate='center'
						exit='exit'
						transition={{ type: 'spring', stiffness: 300, damping: 32 }}
						drag={multi ? 'x' : false}
						dragConstraints={{ left: 0, right: 0 }}
						dragElastic={0.5}
						onDragEnd={(_, info) => {
							if (info.offset.x < -60) go(1);
							else if (info.offset.x > 60) go(-1);
						}}
						onTap={() => onOpen(index)}
						draggable={false}
						className='absolute inset-0 h-full w-full cursor-zoom-in select-none object-cover'
					/>
				</AnimatePresence>
				{multi && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Previous photo' onClick={() => go(-1)} className={ARROW}>
								<CaretLeft size={16} weight='bold' />
							</button>
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2'>
							<button type='button' aria-label='Next photo' onClick={() => go(1)} className={ARROW}>
								<CaretRight size={16} weight='bold' />
							</button>
						</div>
					</>
				)}
			</div>
			{multi && (
				<div className='mt-3 flex justify-center gap-1.5'>
					{images.map((_, i) => (
						<button key={i} type='button' aria-label={`Photo ${i + 1}`} onClick={() => go(i - index)} className='grid h-5 place-items-center'>
							<motion.span
								className={`block h-2 rounded-full ${i === index ? 'bg-ink' : 'bg-ink/20'}`}
								animate={{ width: i === index ? 18 : 8 }}
								transition={{ type: 'spring', stiffness: 500, damping: 30 }}
							/>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
```

- [ ] **Step 4: Create `src/components/timeline/MemoryView.tsx`**

```tsx
import { PencilSimple } from '@phosphor-icons/react';
import { Milestone, getImages } from '../../types';
import { formatDay } from '../../utils';
import { Button } from '../ui/Button';
import { PhotoCarousel } from './PhotoCarousel';
import { timelineIcon } from './timelineIcons';

type Props = {
	milestone: Milestone;
	isUnlocked: boolean;
	onImageClick: (images: string[], index: number) => void;
	onEdit: () => void;
};

/** Full memory: every photo, the whole story. Shown inside a Sheet. */
export const MemoryView = ({ milestone, isUnlocked, onImageClick, onEdit }: Props) => {
	const images = getImages(milestone);
	const { Icon, bg } = timelineIcon(milestone.icon);
	return (
		<div className='space-y-4 pb-2'>
			<div className='flex items-center gap-2'>
				<span className={`grid h-8 w-8 place-items-center rounded-full border-2 border-ink ${bg}`}>
					<Icon size={17} weight='duotone' />
				</span>
				<span className='eyebrow text-muted'>{formatDay(milestone.date, 'long')}</span>
			</div>
			{images.length > 0 && <PhotoCarousel images={images} title={milestone.title} onOpen={i => onImageClick(images, i)} />}
			{milestone.description && (
				<p className='whitespace-pre-line text-[15px] font-semibold leading-relaxed text-ink/85'>{milestone.description}</p>
			)}
			{isUnlocked && (
				<Button tone='white' onClick={onEdit}>
					<PencilSimple size={16} weight='bold' />
					Edit memory
				</Button>
			)}
		</div>
	);
};
```

- [ ] **Step 5: Create `src/components/timeline/MemoryForm.tsx`**

All state and logic (initialisation from `editingMilestone`, blob URL lifecycle, sequential uploads with 1-based failure indices, promoting uploaded URLs before the DB save, delete confirmation) are copied from `MemoryModal.tsx`. Removed: the overlay, the header, and the Escape handler (the `Sheet` provides these).

```tsx
import { CameraPlus, Trash, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { uploadToImageKit } from '../../imagekit';
import { Milestone, NewEvent, getImages } from '../../types';
import { ICON_OPTIONS, errorMessage } from '../../utils';
import { MAX_IMAGES } from '../../constants';
import { Button } from '../ui/Button';
import { ErrorNote } from '../ui/ErrorNote';
import { timelineIcon } from './timelineIcons';

type Props = {
	editingMilestone: Milestone | null;
	onSave:   (event: NewEvent) => Promise<void>;
	onDelete: (id: number) => Promise<void>;
};

const REMOVE = 'absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-white disabled:opacity-50';

export const MemoryForm = ({ editingMilestone, onSave, onDelete }: Props) => {
	const [localEvent, setLocalEvent] = useState<NewEvent>({
		title: '', date: '', description: '', image: null, images: [], icon: 'camera',
	});
	// URLs already saved in the DB
	const [existingImages, setExistingImages] = useState<string[]>([]);
	// Files picked in this session, not yet uploaded
	const [newFiles, setNewFiles] = useState<Array<{ file: File; previewUrl: string }>>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const [deleteConfirming, setDeleteConfirming] = useState(false);
	const [operationError, setOperationError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const totalCount = existingImages.length + newFiles.length;
	const canAddMore = totalCount < MAX_IMAGES;

	useEffect(() => {
		setDeleteConfirming(false);
		setOperationError(null);
		setExistingImages(editingMilestone ? getImages(editingMilestone) : []);
		setNewFiles([]);
		setLocalEvent(
			editingMilestone
				? {
					title:       editingMilestone.title,
					date:        editingMilestone.date,
					description: editingMilestone.description,
					image:       editingMilestone.image,
					images:      [],  // handleSubmit re-merges existingImages + uploaded URLs
					icon:        editingMilestone.icon,
				}
				: { title: '', date: '', description: '', image: null, images: [], icon: 'camera' },
		);
	}, [editingMilestone]);

	// Revoke blob URLs when the session ends. Depends on editingMilestone, not newFiles,
	// so URLs still on screen are never revoked early.
	useEffect(() => {
		return () => {
			newFiles.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
		};
	}, [editingMilestone]); // eslint-disable-line react-hooks/exhaustive-deps

	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		if (!files.length) return;
		const toAdd = files.slice(0, MAX_IMAGES - totalCount);
		setNewFiles(prev => [...prev, ...toAdd.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))]);
		e.target.value = '';
	};

	const handleRemoveExisting = (i: number) => setExistingImages(prev => prev.filter((_, idx) => idx !== i));

	const handleRemoveNewFile = (i: number) =>
		setNewFiles(prev => {
			URL.revokeObjectURL(prev[i].previewUrl);
			return prev.filter((_, idx) => idx !== i);
		});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setIsSaving(true);
		setOperationError(null);
		try {
			let allImages = existingImages;
			if (newFiles.length > 0) {
				const uploadedUrls: string[] = [];
				const failures: number[] = [];
				for (let i = 0; i < newFiles.length; i++) {
					setUploadingIndex(i);
					try {
						uploadedUrls.push(await uploadToImageKit(newFiles[i].file));
					} catch {
						failures.push(i + 1);
					}
				}
				setUploadingIndex(null);
				if (failures.length > 0) {
					setOperationError(
						`Photo${failures.length > 1 ? 's' : ''} ${failures.join(', ')} failed to upload. Remove ${failures.length > 1 ? 'them' : 'it'} and try again.`,
					);
					return;
				}
				newFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
				allImages = [...existingImages, ...uploadedUrls];
				setExistingImages(allImages);
				setNewFiles([]);
			}
			await onSave({ ...localEvent, images: allImages });
		} catch (err: unknown) {
			setOperationError(errorMessage(err, "Couldn't save this memory. Try again?"));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!editingMilestone) return;
		setOperationError(null);
		try {
			await onDelete(editingMilestone.id);
		} catch (err: unknown) {
			setDeleteConfirming(false);
			setOperationError(errorMessage(err, "Couldn't delete this memory. Try again?"));
		}
	};

	return (
		<form onSubmit={e => void handleSubmit(e)} className='space-y-5 pb-2'>
			<div>
				<label className='field-label' htmlFor='memory-title'>What happened?</label>
				<input
					id='memory-title'
					className='field'
					required
					placeholder='First kicks!'
					value={localEvent.title}
					onChange={e => setLocalEvent(prev => ({ ...prev, title: e.target.value }))}
				/>
			</div>
			<div>
				<label className='field-label' htmlFor='memory-date'>When</label>
				<input
					id='memory-date'
					type='date'
					className='field'
					required
					value={localEvent.date}
					onChange={e => setLocalEvent(prev => ({ ...prev, date: e.target.value }))}
				/>
			</div>
			<div>
				<label className='field-label' htmlFor='memory-story'>The story</label>
				<textarea
					id='memory-story'
					className='field min-h-[120px] resize-none'
					placeholder='It felt like little butterflies…'
					value={localEvent.description}
					onChange={e => setLocalEvent(prev => ({ ...prev, description: e.target.value }))}
				/>
			</div>

			<fieldset>
				<legend className='field-label'>Icon</legend>
				<div className='flex flex-wrap gap-2'>
					{ICON_OPTIONS.map(name => {
						const { Icon, bg } = timelineIcon(name);
						const selected = localEvent.icon === name;
						return (
							<motion.button
								key={name}
								type='button'
								aria-label={name}
								aria-pressed={selected}
								onClick={() => setLocalEvent(prev => ({ ...prev, icon: name }))}
								whileTap={{ scale: 0.9 }}
								animate={{ scale: selected ? 1.1 : 1, rotate: selected ? 6 : 0 }}
								transition={{ type: 'spring', stiffness: 500, damping: 20 }}
								className={`grid h-11 w-11 place-items-center rounded-full border-2 ${selected ? `border-ink ${bg} shadow-sticker-sm` : 'border-ink/20 bg-white'}`}
							>
								<Icon size={20} weight='duotone' />
							</motion.button>
						);
					})}
				</div>
			</fieldset>

			<div>
				<p className='field-label'>Photos {totalCount > 0 && <span className='normal-case tracking-normal'>({totalCount}/{MAX_IMAGES})</span>}</p>
				<input type='file' accept='image/*' multiple ref={fileInputRef} onChange={handleImageChange} className='hidden' />
				{totalCount > 0 && (
					<div className='mb-3 grid grid-cols-3 gap-2.5'>
						{existingImages.map((url, i) => (
							<div key={`existing-${i}`} className='relative aspect-square overflow-hidden rounded-xl border-2 border-ink bg-white'>
								<img src={url} alt={`Photo ${i + 1}`} className='h-full w-full object-cover' />
								<button type='button' aria-label={`Remove photo ${i + 1}`} disabled={isSaving} onClick={() => handleRemoveExisting(i)} className={REMOVE}>
									<X size={12} weight='bold' />
								</button>
							</div>
						))}
						{newFiles.map(({ previewUrl }, i) => (
							<div key={`new-${i}`} className='relative aspect-square overflow-hidden rounded-xl border-2 border-dashed border-ink bg-white'>
								<img src={previewUrl} alt={`New photo ${i + 1}`} className='h-full w-full object-cover' />
								{isSaving && uploadingIndex === i ? (
									<div className='absolute inset-0 grid place-items-center bg-ink/30'>
										<div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
									</div>
								) : !isSaving ? (
									<button type='button' aria-label={`Remove new photo ${i + 1}`} onClick={() => handleRemoveNewFile(i)} className={REMOVE}>
										<X size={12} weight='bold' />
									</button>
								) : null}
							</div>
						))}
					</div>
				)}
				{canAddMore && (
					<button
						type='button'
						disabled={isSaving}
						onClick={() => fileInputRef.current?.click()}
						className='flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/40 bg-white/60 py-5 text-sm font-extrabold transition-colors hover:bg-white disabled:opacity-50'
					>
						<CameraPlus size={26} weight='duotone' />
						{totalCount === 0 ? 'Add photos' : 'Add more photos'}
					</button>
				)}
			</div>

			{operationError && <ErrorNote>{operationError}</ErrorNote>}

			<Button type='submit' tone='butter' size='lg' block disabled={isSaving}>
				{isSaving ? 'Saving…' : 'Save memory'}
			</Button>

			{editingMilestone && (
				deleteConfirming ? (
					<div className='flex items-center justify-between gap-2 rounded-2xl border-2 border-danger bg-white p-3'>
						<span className='text-sm font-bold text-danger'>Delete this memory for good?</span>
						<div className='flex gap-2'>
							<Button size='sm' tone='white' onClick={() => setDeleteConfirming(false)}>Keep</Button>
							<Button size='sm' tone='pink' onClick={() => void handleDelete()}>Delete</Button>
						</div>
					</div>
				) : (
					<button
						type='button'
						onClick={() => setDeleteConfirming(true)}
						className='mx-auto flex items-center gap-1.5 text-sm font-bold text-danger'
					>
						<Trash size={16} weight='bold' />
						Delete memory
					</button>
				)
			)}
		</form>
	);
};
```

- [ ] **Step 6: Rewrite `src/components/TimelineTab.tsx`**

```tsx
import { CalendarBlank, Plus } from '@phosphor-icons/react';
import { useCallback, useMemo, useState } from 'react';
import { Milestone } from '../types';
import { parseDay } from '../utils';
import { MemoryCard } from './timeline/MemoryCard';
import { MemoryView } from './timeline/MemoryView';
import { Button } from './ui/Button';
import { Emoji } from './ui/Emoji';
import { EmptyState } from './ui/EmptyState';
import { ErrorNote } from './ui/ErrorNote';
import { Fab } from './ui/Fab';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';

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
}: Props) => {
	const [viewing, setViewing] = useState<Milestone | null>(null);
	const [viewOpen, setViewOpen] = useState(false);
	const closeView = useCallback(() => setViewOpen(false), []);
	const openView = useCallback((m: Milestone) => { setViewing(m); setViewOpen(true); }, []);

	const groups = useMemo(() => {
		const out: { key: string; label: string; items: { milestone: Milestone; index: number }[] }[] = [];
		milestones.forEach((milestone, index) => {
			const d = parseDay(milestone.date);
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			const last = out[out.length - 1];
			if (last && last.key === key) last.items.push({ milestone, index });
			else out.push({ key, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), items: [{ milestone, index }] });
		});
		return out;
	}, [milestones]);

	return (
		<div className='pb-4'>
			<div className='mb-2 px-1'>
				<h2 className='flex items-center gap-2 font-display text-display-lg font-extrabold'>
					Our story <Emoji name='open-book' size={30} eager />
				</h2>
				{milestones.length > 0 && (
					<p className='text-sm font-semibold text-muted'>
						{milestones.length === 1 ? '1 memory' : `${milestones.length} memories`} so far
					</p>
				)}
			</div>

			{isLoading && milestones.length === 0 && <Spinner label='Loading memories' />}
			{error && <ErrorNote>{error}</ErrorNote>}
			{!isLoading && !error && milestones.length === 0 && (
				<EmptyState
					emoji='open-book'
					title='No memories yet'
					body={isUnlocked ? 'Tap “Memory” to add the first one.' : 'Check back soon for the first chapter.'}
				/>
			)}

			{groups.map(group => (
				<section key={group.key} aria-label={group.label}>
					<div className='sticky top-[62px] z-20 py-2'>
						<span className='inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3 py-1 text-xs font-extrabold shadow-sticker-sm'>
							<CalendarBlank size={14} weight='bold' />
							{group.label}
						</span>
					</div>
					<div className='relative pl-[46px]'>
						<div aria-hidden className='absolute bottom-3 left-[16px] top-1 border-l-[2.5px] border-dashed border-ink/25' />
						{group.items.map(({ milestone, index }) => (
							<MemoryCard
								key={milestone.id}
								milestone={milestone}
								index={index}
								isUnlocked={isUnlocked}
								onOpen={openView}
								onEdit={onEditClick}
							/>
						))}
					</div>
				</section>
			))}

			{hasMore && !isLoading && (
				<div className='mt-2 flex justify-center'>
					<Button tone='white' onClick={onLoadMore}>Load more memories</Button>
				</div>
			)}

			{isUnlocked && (
				<Fab label='Add a memory' onClick={onAddClick}>
					<Plus size={18} weight='bold' />
					Memory
				</Fab>
			)}

			<Sheet open={viewOpen} onClose={closeView} title={viewing?.title ?? ''}>
				{viewing && (
					<MemoryView
						milestone={viewing}
						isUnlocked={isUnlocked}
						onImageClick={(images, idx) => onImageClick(images, idx, viewing.title)}
						onEdit={() => { setViewOpen(false); onEditClick(viewing); }}
					/>
				)}
			</Sheet>
		</div>
	);
};
```

- [ ] **Step 7: Wire the memory form into `App.tsx`**

Make exactly these edits:

1. Replace the import `import { MemoryModal } from './src/components/MemoryModal';` with
   `import { MemoryForm } from './src/components/timeline/MemoryForm';`
2. After `const closeUnlock = useCallback(...)` add:
   ```tsx
   const closeMemoryForm = useCallback(() => setIsModalOpen(false), []);
   ```
3. In `handleSaveMilestone`: inside the `else` (insert) branch, directly after `if (error) throw error;` add `celebrate();`. At the end of the callback **delete** the line `setEditingMilestone(null);` (keep `setIsModalOpen(false);`) — the editing target is set every time the form opens, and clearing it here would flip the sheet title and reset the fields mid-exit.
4. In `handleDeleteMilestone` also **delete** the line `setEditingMilestone(null);` (keep `setIsModalOpen(false);`).
5. Replace the whole `{isModalOpen && (<MemoryModal … />)}` block with:
   ```tsx
   <Sheet open={isModalOpen} onClose={closeMemoryForm} title={editingMilestoneState ? 'Edit memory' : 'New memory'}>
   	<MemoryForm
   		editingMilestone={editingMilestoneState}
   		onSave={handleSaveMilestone}
   		onDelete={handleDeleteMilestone}
   	/>
   </Sheet>
   ```

- [ ] **Step 8: Remove what the timeline no longer uses**

- In `src/utils.ts` delete `DATE_FORMATTER` and `formatDate` (the `formatDay`/`parseDay` helpers replace them).
- In `src/constants.ts` delete `FADE_IN_STEP_S` and `FADE_IN_MAX_S` (keep `MAX_IMAGES`, `PAGE_SIZE`).
- Delete the old files:

```bash
git rm src/components/TimelineItem.tsx src/components/MemoryModal.tsx src/icons.tsx src/hooks/useSwipe.ts
grep -rn "formatDate\|FADE_IN\|useSwipe\|renderIcon\|MemoryModal\|TimelineItem" --include=*.ts --include=*.tsx App.tsx src || echo "none"
```

Expected: `none`.

- [ ] **Step 9: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 10: Commit**

```bash
git add App.tsx src/components/timeline src/components/TimelineTab.tsx src/utils.ts src/constants.ts
git commit -m "feat: storybook timeline — month groups, compact polaroid cards, memory sheet and edit form"
```

---

### Task 6: Blessings — sticky-note wall, compose sheet, animated reactions

**Files:**
- Rewrite: `src/components/WishesTab.tsx`, `src/components/wishes/ReactionBar.tsx`
- Create: `src/components/wishes/BlessingNote.tsx`, `src/components/wishes/ComposeBlessing.tsx`

**Interfaces:**
- DB semantics preserved: load `wishes` ordered by `created_at desc`; insert `{ author_name, message, category }` with an optimistic note replaced by the returned row, removed on failure; `ReactionBar` hidden while a note is pending; reactions insert/delete on `wish_reactions` with optimistic update and rollback (logic identical to today).
- `ComposeBlessing({ onSend })`, `BlessingDraft = { name: string; message: string; category: 'blessing' | 'advice' }`.
- Reaction emoji values stored in the DB (`❤️ 😂 🥹 🎉`) are unchanged; they are only *displayed* as Fluent pictures.

- [ ] **Step 1: Rewrite `src/components/wishes/ReactionBar.tsx`**

State, loading, and the `toggle` function are identical to the current file; only the rendering changes.

```tsx
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { EmojiName } from '../../emoji';
import { supabase } from '../../supabaseClient';
import { getVoterId } from '../../utils';
import { Emoji } from '../ui/Emoji';

const EMOJIS = ['❤️', '😂', '🥹', '🎉'] as const;
type Reaction = typeof EMOJIS[number];

const PICTURE: Record<Reaction, EmojiName> = {
	'❤️': 'red-heart',
	'😂': 'face-with-tears-of-joy',
	'🥹': 'face-holding-back-tears',
	'🎉': 'party-popper',
};

const EMPTY: Record<Reaction, number> = { '❤️': 0, '😂': 0, '🥹': 0, '🎉': 0 };

export const ReactionBar = ({ wishId }: { wishId: string }) => {
	const voterId = useRef(getVoterId());
	const [counts, setCounts] = useState<Record<Reaction, number>>({ ...EMPTY });
	const [mine, setMine] = useState<Set<Reaction>>(new Set());
	const [toggling, setToggling] = useState<Reaction | null>(null);

	useEffect(() => {
		(async () => {
			const { data } = await supabase.from('wish_reactions').select('voter_id, emoji').eq('wish_id', wishId);
			if (!data) return;
			const c: Record<Reaction, number> = { ...EMPTY };
			const m = new Set<Reaction>();
			for (const row of data) {
				c[row.emoji as Reaction] = (c[row.emoji as Reaction] ?? 0) + 1;
				if (row.voter_id === voterId.current) m.add(row.emoji as Reaction);
			}
			setCounts(c);
			setMine(m);
		})();
	}, [wishId]);

	const toggle = async (emoji: Reaction) => {
		if (toggling) return;
		setToggling(emoji);
		const isActive = mine.has(emoji);

		setCounts(prev => ({ ...prev, [emoji]: Math.max(0, prev[emoji] + (isActive ? -1 : 1)) }));
		setMine(prev => {
			const next = new Set(prev);
			isActive ? next.delete(emoji) : next.add(emoji);
			return next;
		});

		try {
			if (isActive) {
				const { error } = await supabase.from('wish_reactions').delete()
					.eq('voter_id', voterId.current)
					.eq('wish_id', wishId)
					.eq('emoji', emoji);
				if (error) throw error;
			} else {
				const { error } = await supabase.from('wish_reactions').insert({ voter_id: voterId.current, wish_id: wishId, emoji });
				if (error) throw error;
			}
		} catch {
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
		<div className='mt-2.5 flex flex-wrap gap-1'>
			{EMOJIS.map(emoji => {
				const count = counts[emoji];
				const active = mine.has(emoji);
				return (
					<motion.button
						key={emoji}
						type='button'
						onClick={() => void toggle(emoji)}
						disabled={toggling !== null}
						whileTap={{ scale: 0.85 }}
						aria-pressed={active}
						aria-label={`React with ${emoji}${count > 0 ? ` (${count})` : ''}`}
						className={`flex items-center gap-0.5 rounded-full border-[1.5px] px-1.5 py-0.5 transition-colors ${
							active ? 'border-ink bg-white shadow-sticker-xs' : 'border-ink/20 bg-white/60'
						}`}
					>
						<motion.span
							key={active ? 'on' : 'off'}
							className='inline-flex'
							initial={{ scale: active ? 1.7 : 1 }}
							animate={{ scale: 1 }}
							transition={{ type: 'spring', stiffness: 500, damping: 12 }}
						>
							<Emoji name={PICTURE[emoji]} size={16} />
						</motion.span>
						{count > 0 && (
							<motion.span
								key={count}
								initial={{ y: -6, opacity: 0 }}
								animate={{ y: 0, opacity: 1 }}
								className='text-[11px] font-extrabold tabular-nums'
							>
								{count}
							</motion.span>
						)}
					</motion.button>
				);
			})}
		</div>
	);
};
```

- [ ] **Step 2: Create `src/components/wishes/BlessingNote.tsx`**

```tsx
import { motion } from 'motion/react';
import type { Wish } from '../../types';
import { relativeTime } from '../../utils';
import { TONE_BG, type Tone } from '../ui/Card';
import { Emoji } from '../ui/Emoji';
import { ReactionBar } from './ReactionBar';

const BLESSING_TONES: Tone[] = ['lav', 'butter', 'pink'];
const ADVICE_TONES: Tone[] = ['mint', 'sky', 'peach'];

/** Stable across the optimistic → saved swap (the id changes, the text doesn't). */
const hash = (s: string) => {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return Math.abs(h);
};

export const BlessingNote = ({ wish, pending }: { wish: Wish; pending: boolean }) => {
	const seed = hash(wish.author_name + wish.message);
	const tone = (wish.category === 'advice' ? ADVICE_TONES : BLESSING_TONES)[seed % 3];
	const tilt = ((seed % 7) - 3) * 0.5;

	return (
		<motion.article
			initial={{ opacity: 0, scale: 0.8, rotate: tilt * 4, y: 16 }}
			whileInView={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
			viewport={{ once: true, margin: '0px 0px -24px 0px' }}
			transition={{ type: 'spring', stiffness: 260, damping: 20 }}
			className={`relative mb-4 break-inside-avoid rounded-2xl border-2 border-ink px-3.5 pb-3 pt-5 shadow-sticker-sm ${TONE_BG[tone]}`}
		>
			<span aria-hidden className='absolute -top-2.5 left-1/2 h-4 w-12 -translate-x-1/2 -rotate-3 border border-ink/20 bg-white/70' />
			{wish.category && (
				<Emoji
					name={wish.category === 'blessing' ? 'folded-hands' : 'light-bulb'}
					size={22}
					alt={wish.category === 'blessing' ? 'Blessing' : 'Advice'}
					className='absolute right-2 top-2'
				/>
			)}
			<p className='whitespace-pre-line break-words pr-5 text-[14px] font-bold leading-snug'>{wish.message}</p>
			<p className='mt-2.5 font-display text-[14px] font-extrabold'>— {wish.author_name}</p>
			<p className='text-[11px] font-bold text-ink/55'>{relativeTime(wish.created_at)}</p>
			{!pending && <ReactionBar wishId={wish.id} />}
		</motion.article>
	);
};
```

- [ ] **Step 3: Create `src/components/wishes/ComposeBlessing.tsx`**

```tsx
import { motion } from 'motion/react';
import { FormEvent, useState } from 'react';
import { saveGuestName, useGuestName } from '../../hooks/useGuestName';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';

export type BlessingDraft = { name: string; message: string; category: 'blessing' | 'advice' };

const OPTIONS = [
	{ id: 'blessing', label: 'Blessing', emoji: 'folded-hands', bg: 'bg-lav' },
	{ id: 'advice',   label: 'Advice',   emoji: 'light-bulb',   bg: 'bg-mint' },
] as const;

/** The blessing form, shown inside a Sheet. `onSend` resolves when saved and throws on failure. */
export const ComposeBlessing = ({ onSend }: { onSend: (draft: BlessingDraft) => Promise<void> }) => {
	const remembered = useGuestName();
	const [category, setCategory] = useState<'blessing' | 'advice'>('blessing');
	const [name, setName] = useState(remembered);
	const [message, setMessage] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		const n = name.trim();
		const m = message.trim();
		if (!n || !m) return;
		setBusy(true);
		setError(null);
		try {
			await onSend({ name: n, message: m, category });
			saveGuestName(n);
		} catch (err: unknown) {
			setError(errorMessage(err, "Couldn't send your blessing. Try again?"));
			setBusy(false);
		}
	};

	return (
		<form onSubmit={e => void submit(e)} className='space-y-4 pb-2'>
			<div role='radiogroup' aria-label='Type' className='grid grid-cols-2 gap-2.5'>
				{OPTIONS.map(option => {
					const active = category === option.id;
					return (
						<motion.button
							key={option.id}
							type='button'
							role='radio'
							aria-checked={active}
							onClick={() => setCategory(option.id)}
							whileTap={{ scale: 0.96 }}
							className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-ink px-3 py-3 text-sm font-extrabold transition-colors ${
								active ? `${option.bg} shadow-sticker-sm` : 'bg-white text-muted'
							}`}
						>
							<Emoji name={option.emoji} size={22} />
							{option.label}
						</motion.button>
					);
				})}
			</div>
			<div>
				<label className='field-label' htmlFor='blessing-name'>Your name</label>
				<input id='blessing-name' className='field' autoComplete='name' required value={name} onChange={e => setName(e.target.value)} />
			</div>
			<div>
				<label className='field-label' htmlFor='blessing-message'>{category === 'blessing' ? 'Your blessing' : 'Your advice'}</label>
				<textarea
					id='blessing-message'
					className='field min-h-[130px] resize-none'
					required
					placeholder={category === 'blessing' ? 'May you always be surrounded by love…' : 'Sleep when the baby sleeps…'}
					value={message}
					onChange={e => setMessage(e.target.value)}
				/>
			</div>
			{error && <ErrorNote>{error}</ErrorNote>}
			<Button type='submit' tone='butter' size='lg' block disabled={busy || !name.trim() || !message.trim()}>
				<Emoji name='love-letter' size={22} />
				{busy ? 'Sending…' : 'Send with love'}
			</Button>
		</form>
	);
};
```

- [ ] **Step 4: Rewrite `src/components/WishesTab.tsx`**

```tsx
import { Plus } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmojiName } from '../emoji';
import { celebrate } from '../lib/celebrate';
import { supabase } from '../supabaseClient';
import { Wish } from '../types';
import { errorMessage } from '../utils';
import { Emoji } from './ui/Emoji';
import { EmptyState } from './ui/EmptyState';
import { ErrorNote } from './ui/ErrorNote';
import { Fab } from './ui/Fab';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';
import { BlessingNote } from './wishes/BlessingNote';
import { ComposeBlessing, type BlessingDraft } from './wishes/ComposeBlessing';

type Filter = 'all' | 'blessing' | 'advice';

const FILTERS: { id: Filter; label: string; emoji?: EmojiName }[] = [
	{ id: 'all',      label: 'All' },
	{ id: 'blessing', label: 'Blessings', emoji: 'folded-hands' },
	{ id: 'advice',   label: 'Advice',    emoji: 'light-bulb' },
];

export const WishesTab = () => {
	const [wishes, setWishes] = useState<Wish[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [filter, setFilter] = useState<Filter>('all');
	const [composing, setComposing] = useState(false);
	const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
	// Keeps a note's React key stable when its optimistic id is swapped for the saved id.
	const stableKeys = useRef(new Map<string, string>());

	useEffect(() => {
		(async () => {
			try {
				const { data, error } = await supabase.from('wishes').select('*').order('created_at', { ascending: false });
				if (error) throw error;
				setWishes(data ?? []);
			} catch (err: unknown) {
				setLoadError(errorMessage(err, "Couldn't load the blessings. Try again in a moment."));
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const closeCompose = useCallback(() => setComposing(false), []);

	const handleSend = async ({ name, message, category }: BlessingDraft) => {
		const optimistic: Wish = {
			id: crypto.randomUUID(),
			author_name: name,
			message,
			category,
			created_at: new Date().toISOString(),
		};
		setWishes(prev => [optimistic, ...prev]);
		setPendingIds(prev => new Set(prev).add(optimistic.id));
		try {
			const { data, error } = await supabase
				.from('wishes')
				.insert({ author_name: name, message, category })
				.select()
				.single();
			if (error) throw error;
			stableKeys.current.set(data.id, optimistic.id);
			setWishes(prev => prev.map(w => (w.id === optimistic.id ? data : w)));
			setFilter('all');
			setComposing(false);
			celebrate();
		} catch (err: unknown) {
			setWishes(prev => prev.filter(w => w.id !== optimistic.id));
			throw err;
		} finally {
			setPendingIds(prev => {
				const next = new Set(prev);
				next.delete(optimistic.id);
				return next;
			});
		}
	};

	const visible = wishes.filter(w => filter === 'all' || w.category === filter);

	return (
		<div className='pb-4'>
			<div className='mb-3 flex items-center gap-3 px-1'>
				<Emoji name='folded-hands' size={44} eager />
				<div>
					<h2 className='font-display text-display-lg font-extrabold'>Blessings &amp; advice</h2>
					<p className='text-sm font-semibold text-muted'>Ashirwad and wisdom for the little one</p>
				</div>
			</div>

			<div className='sticky top-[62px] z-20 -mx-4 mb-3 flex gap-2 px-4 py-2'>
				{FILTERS.map(f => {
					const active = filter === f.id;
					return (
						<button
							key={f.id}
							type='button'
							onClick={() => setFilter(f.id)}
							aria-pressed={active}
							className='relative inline-flex items-center rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-[13px] font-extrabold shadow-sticker-xs'
						>
							{active && (
								<motion.span
									layoutId='filter-pill'
									className='absolute inset-0 rounded-full bg-ink'
									transition={{ type: 'spring', stiffness: 520, damping: 34 }}
								/>
							)}
							<span className={`relative flex items-center gap-1.5 ${active ? 'text-white' : ''}`}>
								{f.emoji && <Emoji name={f.emoji} size={16} />}
								{f.label}
							</span>
						</button>
					);
				})}
			</div>

			{isLoading && <Spinner label='Loading blessings' />}
			{loadError && <ErrorNote>{loadError}</ErrorNote>}
			{!isLoading && !loadError && visible.length === 0 && (
				<EmptyState
					emoji='folded-hands'
					title={filter === 'all' ? 'No blessings yet' : 'Nothing here yet'}
					body='Be the first to bless the little one.'
				/>
			)}

			<div className='columns-2 gap-3.5 sm:gap-4'>
				{visible.map(w => (
					<BlessingNote key={stableKeys.current.get(w.id) ?? w.id} wish={w} pending={pendingIds.has(w.id)} />
				))}
			</div>

			<Fab label='Write a blessing' onClick={() => setComposing(true)}>
				<Plus size={18} weight='bold' />
				Bless
			</Fab>

			<Sheet
				open={composing}
				onClose={closeCompose}
				title={<span className='flex items-center gap-2'>Send a blessing <Emoji name='love-letter' size={26} /></span>}
			>
				<ComposeBlessing onSend={handleSend} />
			</Sheet>
		</div>
	);
};
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/WishesTab.tsx src/components/wishes
git commit -m "feat: storybook blessings — sticky-note wall, compose sheet, animated reactions"
```

---

### Task 7: Baby Book, capsule form, seal stamp; drop lucide-react

**Files:**
- Rewrite: `src/components/BabyBookTab.tsx`
- Create: `src/components/babybook/BirthCapsuleForm.tsx`, `src/components/babybook/SealStamp.tsx`
- Delete: `src/components/BirthCapsuleModal.tsx`
- Modify: `package.json` (uninstall `lucide-react`)

**Interfaces:**
- DB semantics preserved: load the earliest `birth_capsule` row (`order created_at asc, limit 1, maybeSingle`); form **inserts** exactly the same payload keys as `BirthCapsuleModal` (insert-only, never update); once a capsule exists there is no UI path to edit it.

- [ ] **Step 1: Create `src/components/babybook/SealStamp.tsx`**

```tsx
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Emoji } from '../ui/Emoji';

/** A "Sealed with love" rubber stamp that slams onto the screen, then fades. */
export const SealStamp = ({ show, onDone }: { show: boolean; onDone: () => void }) => {
	useEffect(() => {
		if (!show) return;
		const timer = setTimeout(onDone, 2000);
		return () => clearTimeout(timer);
	}, [show, onDone]);

	return createPortal(
		<AnimatePresence>
			{show && (
				<motion.div
					key='stamp'
					className='pointer-events-none fixed inset-0 z-[70] grid place-items-center'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<motion.div
						role='status'
						aria-label='Birth capsule sealed'
						initial={{ scale: 2.6, rotate: -24, opacity: 0 }}
						animate={{ scale: 1, rotate: -9, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 380, damping: 16 }}
						className='grid h-44 w-44 place-items-center rounded-full border-[5px] border-double border-danger bg-paper/95 text-center shadow-sticker-lg'
					>
						<div>
							<Emoji name='ribbon' size={44} eager />
							<p className='mt-1 font-display text-xl font-extrabold uppercase leading-tight text-danger'>
								Sealed
								<br />
								with love
							</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body,
	);
};
```

- [ ] **Step 2: Create `src/components/babybook/BirthCapsuleForm.tsx`**

State, `lines()`, `set()`, and the `handleSubmit` payload are copied from `BirthCapsuleModal.tsx` unchanged (insert-only). Only markup changes; `birth_date` becomes `type='date'` (same `YYYY-MM-DD` value), weight/length get `inputMode='decimal'`.

```tsx
import { FormEvent, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { BirthCapsule } from '../../types';
import { errorMessage } from '../../utils';
import { Button } from '../ui/Button';
import { Emoji } from '../ui/Emoji';
import { ErrorNote } from '../ui/ErrorNote';

type Props = { onSaved: (capsule: BirthCapsule) => void };

export const BirthCapsuleForm = ({ onSaved }: Props) => {
	const [form, setForm] = useState({
		birth_date: '', birth_time: '', weight_kg: '', length_cm: '', location: '',
		baby_name: '', name_meaning: '', nicknames: '', letter_to_baby: '', visitors: '',
		headlines: '', sports_results: '', top_song: '', top_movie: '', famous_birthdays: '',
		weather: '', notes: '',
	});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const lines = (text: string): string[] => text.split('\n').map(l => l.trim()).filter(Boolean);

	const set = (key: keyof typeof form) =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(prev => ({ ...prev, [key]: e.target.value }));

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
				baby_name:        form.baby_name      || null,
				name_meaning:     form.name_meaning   || null,
				nicknames:        lines(form.nicknames),
				letter_to_baby:   form.letter_to_baby || null,
				visitors:         lines(form.visitors),
				headlines:        lines(form.headlines),
				sports_results:   lines(form.sports_results),
				top_song:         form.top_song       || null,
				top_movie:        form.top_movie      || null,
				famous_birthdays: lines(form.famous_birthdays),
				weather:          form.weather        || null,
				notes:            form.notes          || null,
			};
			const { data, error } = await supabase.from('birth_capsule').insert(payload).select().single();
			if (error) throw error;
			onSaved(data);
		} catch (err: unknown) {
			setSaveError(errorMessage(err, "Couldn't seal the capsule. Try again?"));
		} finally {
			setIsSaving(false);
		}
	};

	const field = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
		<div>
			<label className='field-label' htmlFor={`capsule-${key}`}>{label}</label>
			<input id={`capsule-${key}`} className='field' value={form[key]} onChange={set(key)} {...props} />
		</div>
	);

	const area = (key: keyof typeof form, label: string, placeholder: string, rows = 3) => (
		<div>
			<label className='field-label' htmlFor={`capsule-${key}`}>{label}</label>
			<textarea id={`capsule-${key}`} className='field resize-none' rows={rows} placeholder={placeholder} value={form[key]} onChange={set(key)} />
		</div>
	);

	const heading = (emoji: Parameters<typeof Emoji>[0]['name'], text: string) => (
		<h3 className='flex items-center gap-2 pt-2 font-display text-[17px] font-extrabold'>
			<Emoji name={emoji} size={24} />
			{text}
		</h3>
	);

	return (
		<form onSubmit={e => void handleSubmit(e)} className='space-y-4 pb-2'>
			<p className='rounded-2xl border-2 border-ink bg-butter px-4 py-3 text-sm font-bold'>
				This can only be filled in once. It's sealed for good after you save.
			</p>

			{heading('baby', 'The big day')}
			<div className='grid grid-cols-2 gap-3'>
				{field('birth_date', 'Birth date', { type: 'date' })}
				{field('birth_time', 'Birth time', { placeholder: '3:42 AM' })}
			</div>
			<div className='grid grid-cols-2 gap-3'>
				{field('weight_kg', 'Weight (kg)', { inputMode: 'decimal', placeholder: '3.4' })}
				{field('length_cm', 'Length (cm)', { inputMode: 'decimal', placeholder: '50' })}
			</div>
			{field('location', 'Where', { placeholder: 'Hospital, city' })}

			{heading('ribbon', "Baby's identity")}
			{field('baby_name', 'Full name', { placeholder: "Baby's full name" })}
			{field('name_meaning', 'What the name means', { placeholder: 'The story behind it…' })}
			{area('nicknames', 'Nicknames (one per line)', 'Bug\nMunchkin', 2)}
			{area('letter_to_baby', 'Letter to baby', 'Dear little one…', 5)}
			{area('visitors', 'Who was there (one per line)', 'Nani\nDadaji')}

			{heading('newspaper', 'The world that day')}
			{area('headlines', 'World headlines (one per line)', 'Headline one\nHeadline two')}
			{area('sports_results', 'Sports results (one per line)', 'India won…')}
			{field('top_song', '#1 song', { placeholder: 'Song – Artist' })}
			{field('top_movie', '#1 movie', { placeholder: 'Movie title' })}
			{area('famous_birthdays', 'Famous birthdays — same date (one per line)', 'Name (born year)')}
			{field('weather', 'Weather', { placeholder: 'Sunny, 28°C' })}
			{area('notes', 'Anything else', 'Notes for the future…')}

			{saveError && <ErrorNote>{saveError}</ErrorNote>}
			<Button type='submit' tone='butter' size='lg' block disabled={isSaving}>
				<Emoji name='ribbon' size={22} />
				{isSaving ? 'Sealing…' : 'Seal the birth capsule'}
			</Button>
		</form>
	);
};
```

- [ ] **Step 3: Rewrite `src/components/BabyBookTab.tsx`**

```tsx
import { PencilSimple } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { getBirthstone, getZodiacSign } from '../data/zodiacData';
import type { EmojiName } from '../emoji';
import { celebrate } from '../lib/celebrate';
import { floatLoop } from '../lib/motion';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';
import { BirthCapsuleForm } from './babybook/BirthCapsuleForm';
import { SealStamp } from './babybook/SealStamp';
import { Button } from './ui/Button';
import { Card, type Tone } from './ui/Card';
import { Emoji } from './ui/Emoji';
import { Reveal } from './ui/Reveal';
import { Sheet } from './ui/Sheet';
import { Spinner } from './ui/Spinner';

const Section = ({ emoji, title, tone = 'white', children }: { emoji: EmojiName; title: string; tone?: Tone; children: ReactNode }) => (
	<Reveal>
		<Card tone={tone} className='p-4'>
			<h3 className='mb-2.5 flex items-center gap-2 font-display text-[17px] font-extrabold'>
				<Emoji name={emoji} size={26} />
				{title}
			</h3>
			{children}
		</Card>
	</Reveal>
);

const List = ({ items }: { items: string[] }) => (
	<ul className='space-y-1.5'>
		{items.map((item, i) => (
			<li key={i} className='flex gap-2 text-[14px] font-semibold leading-snug'>
				<span aria-hidden className='mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink' />
				{item}
			</li>
		))}
	</ul>
);

const Chip = ({ children }: { children: ReactNode }) => (
	<span className='inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-extrabold'>{children}</span>
);

const ComingSoon = ({ isUnlocked, onFill }: { isUnlocked: boolean; onFill: () => void }) => (
	<Card className='overflow-hidden px-6 pb-8 pt-10 text-center'>
		<div className='relative mx-auto h-32 w-48'>
			<motion.div className='absolute left-0 top-9' {...floatLoop(3.4, 0.2)}>
				<Emoji name='baby-bottle' size={52} eager />
			</motion.div>
			<div className='absolute left-1/2 top-0 -translate-x-1/2'>
				<motion.div {...floatLoop(3)}>
					<Emoji name='teddy-bear' size={96} eager />
				</motion.div>
			</div>
			<motion.div className='absolute right-0 top-11' {...floatLoop(3.8, 0.6)}>
				<Emoji name='ribbon' size={44} eager />
			</motion.div>
		</div>
		<h2 className='mt-4 font-display text-display-lg font-extrabold'>Baby Book coming soon</h2>
		<p className='mx-auto mt-2 max-w-xs text-sm font-semibold leading-relaxed text-muted'>
			When baby arrives, this becomes a keepsake of the big day — the headlines, the weather, famous birthdays, and a letter from Mum and Dad.
		</p>
		{isUnlocked && (
			<div className='mt-6'>
				<Button tone='butter' size='lg' onClick={onFill}>
					<PencilSimple size={18} weight='bold' />
					Fill in the birth capsule
				</Button>
			</div>
		)}
	</Card>
);

const CapsuleView = ({ capsule }: { capsule: BirthCapsule }) => {
	const zodiac = capsule.birth_date ? getZodiacSign(capsule.birth_date) : null;
	const birthstone = capsule.birth_date ? getBirthstone(capsule.birth_date) : null;
	const hasIdentity = Boolean(capsule.baby_name || capsule.name_meaning || (capsule.nicknames?.length ?? 0) > 0 || zodiac || birthstone);

	return (
		<div className='space-y-4'>
			<Card tone='peach' className='relative overflow-hidden p-5'>
				<motion.div className='absolute -right-1 -top-1' {...floatLoop(3.2)}>
					<Emoji name='baby' size={84} eager />
				</motion.div>
				<p className='eyebrow text-ink/60'>Baby arrived on</p>
				<h2 className='mt-1 max-w-[70%] font-display text-display-xl font-extrabold'>
					{capsule.birth_date
						? new Date(`${capsule.birth_date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
						: 'The big day!'}
				</h2>
				{capsule.birth_time && <p className='mt-1 text-sm font-bold text-ink/70'>at {capsule.birth_time}</p>}
				{(capsule.weight_kg || capsule.length_cm || capsule.location) && (
					<div className='mt-4 flex flex-wrap gap-2'>
						{capsule.weight_kg && <Chip>Weight · {capsule.weight_kg} kg</Chip>}
						{capsule.length_cm && <Chip>Length · {capsule.length_cm} cm</Chip>}
						{capsule.location && <Chip>{capsule.location}</Chip>}
					</div>
				)}
			</Card>

			{hasIdentity && (
				<Section emoji='ribbon' title="Baby's identity" tone='butter'>
					{capsule.baby_name && <p className='font-display text-display-lg font-extrabold'>{capsule.baby_name}</p>}
					{capsule.name_meaning && <p className='mt-1 text-sm font-semibold italic text-ink/75'>{capsule.name_meaning}</p>}
					{capsule.nicknames?.length > 0 && (
						<div className='mt-3 flex flex-wrap gap-2'>{capsule.nicknames.map((n, i) => <Chip key={i}>{n}</Chip>)}</div>
					)}
					{(zodiac || birthstone) && (
						<div className='mt-3 flex flex-wrap gap-2'>
							{zodiac && <Chip>{zodiac.emoji} {zodiac.name}</Chip>}
							{birthstone && <Chip><Emoji name='gem-stone' size={14} />{birthstone.name}</Chip>}
						</div>
					)}
				</Section>
			)}
			{capsule.letter_to_baby && (
				<Section emoji='love-letter' title='A letter to you' tone='lav'>
					<p className='whitespace-pre-line text-[15px] font-semibold leading-relaxed'>{capsule.letter_to_baby}</p>
				</Section>
			)}
			{capsule.visitors?.length > 0 && <Section emoji='hugging-face' title='Who was there' tone='mint'><List items={capsule.visitors} /></Section>}
			{capsule.headlines?.length > 0 && <Section emoji='newspaper' title='World headlines'><List items={capsule.headlines} /></Section>}
			{capsule.sports_results?.length > 0 && <Section emoji='soccer-ball' title='Sports' tone='mint'><List items={capsule.sports_results} /></Section>}
			{(capsule.top_song || capsule.top_movie) && (
				<Section emoji='musical-notes' title='Culture' tone='pink'>
					<div className='space-y-2 text-[14px] font-semibold'>
						{capsule.top_song && <p className='flex items-center gap-2'><Emoji name='musical-notes' size={18} />{capsule.top_song}</p>}
						{capsule.top_movie && <p className='flex items-center gap-2'><Emoji name='clapper-board' size={18} />{capsule.top_movie}</p>}
					</div>
				</Section>
			)}
			{capsule.famous_birthdays?.length > 0 && <Section emoji='birthday-cake' title='Famous birthdays' tone='lav'><List items={capsule.famous_birthdays} /></Section>}
			{capsule.weather && (
				<Section emoji='sun-behind-small-cloud' title='Weather' tone='sky'>
					<p className='text-[14px] font-semibold'>{capsule.weather}</p>
				</Section>
			)}
			{capsule.notes && (
				<Section emoji='memo' title='Notes'>
					<p className='whitespace-pre-line text-[14px] font-semibold leading-relaxed'>{capsule.notes}</p>
				</Section>
			)}
		</div>
	);
};

// Birth capsule is permanently sealed after first save — no UI edit path. Fix mistakes via a direct Supabase row edit.
export const BabyBookTab = ({ isUnlocked }: { isUnlocked: boolean }) => {
	const [capsule, setCapsule] = useState<BirthCapsule | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [filling, setFilling] = useState(false);
	const [sealed, setSealed] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await supabase
					.from('birth_capsule')
					.select('*')
					.order('created_at', { ascending: true })
					.limit(1)
					.maybeSingle();
				setCapsule(data ?? null);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	const closeForm = useCallback(() => setFilling(false), []);
	const stampDone = useCallback(() => setSealed(false), []);
	const onSaved = (saved: BirthCapsule) => {
		setCapsule(saved);
		setFilling(false);
		setSealed(true);
		celebrate();
	};

	if (isLoading) return <Spinner label='Loading the baby book' />;

	return (
		<div className='pb-4'>
			{capsule ? <CapsuleView capsule={capsule} /> : <ComingSoon isUnlocked={isUnlocked} onFill={() => setFilling(true)} />}
			<Sheet open={filling} onClose={closeForm} title={<span className='flex items-center gap-2'>Birth capsule <Emoji name='ribbon' size={26} /></span>}>
				<BirthCapsuleForm onSaved={onSaved} />
			</Sheet>
			<SealStamp show={sealed} onDone={stampDone} />
		</div>
	);
};
```

- [ ] **Step 4: Delete the old modal and uninstall lucide**

```bash
git rm src/components/BirthCapsuleModal.tsx
grep -rn "lucide-react" --include=*.ts --include=*.tsx App.tsx main.tsx src || echo "none"
```

Expected: `none`. Then:

```bash
npm uninstall lucide-react
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/components/BabyBookTab.tsx src/components/babybook
git commit -m "feat: storybook baby book — illustrated placeholder, capsule sheet, seal stamp; drop lucide-react"
```

---

### Task 8: Home extras — "on time" chips and latest memory

**Files:**
- Modify: `src/components/home/HeroCard.tsx`, `src/components/HomeTab.tsx`, `App.tsx`
- Create: `src/hooks/useLatestMemory.ts`, `src/components/home/LatestMemoryCard.tsx`

**Interfaces:**
- Consumes: `getZodiacSign`, `getBirthstone` from `src/data/zodiacData.ts`; `MemoryView` from `src/components/timeline/MemoryView.tsx` and `timelineIcon` from `timelineIcons.tsx` (Task 5); `parseDay`, `formatDay` from `src/utils.ts`.
- `HomeTab` props become `{ isUnlocked; onImageClick(images, index, title); onEditMemory(m); onOpenTimeline() }`.
- `useLatestMemory()` → `Milestone | null` — a **read-only** query: `milestones` ordered by `id desc`, `limit 1`, `maybeSingle()`.

- [ ] **Step 1: Add the "right on time" chips to `src/components/home/HeroCard.tsx`**

1. Add the import:
   ```tsx
   import { getBirthstone, getZodiacSign } from '../../data/zodiacData';
   ```
2. Add this constant below `formatWeight`:
   ```tsx
   const CHIP = 'inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-extrabold';
   ```
3. In the not-yet-arrived branch, after the `const due = …` line add:
   ```tsx
   const zodiac = getZodiacSign(EDD);
   const stone = getBirthstone(EDD);
   const weekday = new Date(`${EDD}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long' });
   ```
4. Replace that branch's `return (…)` with (the ring/text row is unchanged, now wrapped in a div, with the chip row added under it):
   ```tsx
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
   				<span className={CHIP}><span aria-hidden>{zodiac.emoji}{'︎'}</span>{zodiac.name}</span>
   				<span className={CHIP}><Emoji name='gem-stone' size={16} />{stone.name}</span>
   			</div>
   		</div>
   	</Card>
   );
   ```

- [ ] **Step 2: Create `src/hooks/useLatestMemory.ts`**

```ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Milestone } from '../types';

/** The most recently added memory (highest id), independent of the timeline's pagination. Read-only. */
export function useLatestMemory(): Milestone | null {
	const [latest, setLatest] = useState<Milestone | null>(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data } = await supabase
				.from('milestones')
				.select('*')
				.order('id', { ascending: false })
				.limit(1)
				.maybeSingle();
			if (!cancelled) setLatest(data ?? null);
		})();
		return () => { cancelled = true; };
	}, []);
	return latest;
}
```

- [ ] **Step 3: Create `src/components/home/LatestMemoryCard.tsx`**

```tsx
import { CaretRight } from '@phosphor-icons/react';
import { Milestone, getImages } from '../../types';
import { formatDay, parseDay } from '../../utils';
import { Card } from '../ui/Card';
import { timelineIcon } from '../timeline/timelineIcons';

const DAY_MS = 86_400_000;

const whenLabel = (date: string) => {
	const days = Math.floor((Date.now() - parseDay(date).getTime()) / DAY_MS);
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	if (days > 1 && days < 30) return `${days} days ago`;
	return formatDay(date);
};

/** Compact "what's new" card for returning visitors. */
export const LatestMemoryCard = ({ memory, onOpen }: { memory: Milestone; onOpen: () => void }) => {
	const images = getImages(memory);
	const { Icon, bg } = timelineIcon(memory.icon);
	const age = Math.floor((Date.now() - parseDay(memory.date).getTime()) / DAY_MS);
	const isNew = age >= 0 && age <= 14;

	return (
		<Card interactive onClick={onOpen} aria-label={`Latest memory: ${memory.title}. Open`} className='flex items-center gap-3 p-3'>
			{images.length > 0 ? (
				<div className='w-16 shrink-0 -rotate-3 rounded-[3px] border border-ink/10 bg-white p-1 pb-2.5 shadow-[0_5px_12px_-7px_rgba(43,35,64,0.5)]'>
					<img
						src={images[0]}
						alt=''
						loading='lazy'
						decoding='async'
						draggable={false}
						className='aspect-square w-full rounded-[2px] object-cover'
					/>
				</div>
			) : (
				<div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-ink ${bg}`}>
					<Icon size={26} weight='duotone' />
				</div>
			)}
			<div className='min-w-0 flex-1'>
				<p className='eyebrow flex items-center gap-1.5 text-muted'>
					Latest memory
					{isNew && <span className='rounded-full border-2 border-ink bg-butter px-1.5 py-px text-[10px] tracking-normal text-ink'>New</span>}
				</p>
				<p className='mt-0.5 truncate font-display text-base font-extrabold'>{memory.title}</p>
				<p className='text-xs font-bold text-muted'>{whenLabel(memory.date)}</p>
			</div>
			<CaretRight size={18} weight='bold' className='shrink-0' />
		</Card>
	);
};
```

- [ ] **Step 4: Update `src/components/HomeTab.tsx`**

Replace the file with:

```tsx
import { ArrowRight } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useCallback, useState } from 'react';
import { useGuesses } from '../hooks/useGuesses';
import { useLatestMemory } from '../hooks/useLatestMemory';
import { usePolls } from '../hooks/usePolls';
import { riseIn, stagger } from '../lib/motion';
import { Milestone } from '../types';
import { FactTicker } from './home/FactTicker';
import { GuessPanel } from './home/GuessPanel';
import { GuessTile, ScoreTile } from './home/HomeTiles';
import { HeroCard } from './home/HeroCard';
import { LatestMemoryCard } from './home/LatestMemoryCard';
import { PollDeck } from './home/PollDeck';
import { ScoreSheet } from './home/ScoreSheet';
import { MemoryView } from './timeline/MemoryView';
import { Button } from './ui/Button';
import { Emoji } from './ui/Emoji';
import { Sheet } from './ui/Sheet';

type Props = {
	isUnlocked: boolean;
	onImageClick: (images: string[], index: number, title: string) => void;
	onEditMemory: (m: Milestone) => void;
	onOpenTimeline: () => void;
};

export const HomeTab = ({ isUnlocked, onImageClick, onEditMemory, onOpenTimeline }: Props) => {
	const polls = usePolls();
	const guesses = useGuesses();
	const latest = useLatestMemory();
	const [sheet, setSheet] = useState<'guess' | 'score' | 'memory' | null>(null);
	const closeSheet = useCallback(() => setSheet(null), []);

	return (
		<>
			<motion.div variants={stagger} initial='hidden' animate='show' className='space-y-5'>
				<motion.div variants={riseIn}><HeroCard /></motion.div>
				<motion.div variants={riseIn}><FactTicker /></motion.div>
				{latest && (
					<motion.div variants={riseIn}>
						<LatestMemoryCard memory={latest} onOpen={() => setSheet('memory')} />
					</motion.div>
				)}
				<motion.div variants={riseIn}><PollDeck polls={polls} /></motion.div>
				<motion.div variants={riseIn} className='grid grid-cols-2 gap-3.5 pt-1'>
					<GuessTile count={guesses.guesses.length} myGuess={guesses.myGuess} onOpen={() => setSheet('guess')} />
					<ScoreTile fun={polls.state.fun} onOpen={() => setSheet('score')} />
				</motion.div>
			</motion.div>

			<Sheet
				open={sheet === 'guess'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Guess the day <Emoji name='tear-off-calendar' size={26} /></span>}
			>
				<GuessPanel data={guesses} isUnlocked={isUnlocked} />
			</Sheet>
			<Sheet
				open={sheet === 'score'}
				onClose={closeSheet}
				title={<span className='flex items-center gap-2'>Aditi vs Kartik <Emoji name='crown' size={26} /></span>}
			>
				<ScoreSheet fun={polls.state.fun} />
			</Sheet>
			<Sheet open={sheet === 'memory'} onClose={closeSheet} title={latest?.title ?? ''}>
				{latest && (
					<div className='space-y-4'>
						<MemoryView
							milestone={latest}
							isUnlocked={isUnlocked}
							onImageClick={(images, index) => onImageClick(images, index, latest.title)}
							onEdit={() => { setSheet(null); onEditMemory(latest); }}
						/>
						<Button tone='white' block onClick={() => { setSheet(null); onOpenTimeline(); }}>
							See the whole story
							<ArrowRight size={16} weight='bold' />
						</Button>
					</div>
				)}
			</Sheet>
		</>
	);
};
```

- [ ] **Step 5: Pass the new props from `App.tsx`**

Replace `{activeTab === 'home' && <HomeTab isUnlocked={isUnlocked} />}` with:

```tsx
{activeTab === 'home' && (
	<HomeTab
		isUnlocked={isUnlocked}
		onImageClick={(images, idx, title) => setExpandedGallery({ images, index: idx, title })}
		onEditMemory={m => { setEditingMilestone(m); setIsModalOpen(true); }}
		onOpenTimeline={() => changeTab('timeline')}
	/>
)}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add App.tsx src/components/HomeTab.tsx src/components/home/HeroCard.tsx src/components/home/LatestMemoryCard.tsx src/hooks/useLatestMemory.ts
git commit -m "feat: home extras — right-on-time chips and latest memory card"
```

---

### Task 9: Visual QA and whole-branch review (controller)

**Files:** none unless QA finds defects.

- [ ] **Step 1: Production build sanity**

```bash
npm run build
```

Note the size of the largest JS chunk in the output (expect well under 250 kB gzip).

- [ ] **Step 2: Local preview against the live read-only data**

Create `.env.local` (git-ignored) with the site's *public* client config (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — the same values shipped in the production bundle). Start `npm run dev` via the preview tooling. Browse as **"View as a guest" only** and do **not** submit any vote, guess, blessing, or reaction (that would write real data).

- [ ] **Step 3: Screenshot every screen**

At 375×812 and 1280×800: login, Home (top + deck), Guess sheet, Score sheet, Timeline (top, a month boundary, memory sheet), Blessings (wall + compose sheet), Baby Book. Check: no overlap/clipping, sticky chips sit flush under the header, tab pill slides, pictures load, text is readable, Home ≈1 screen.

- [ ] **Step 4: Delete `.env.local`**

- [ ] **Step 5: Whole-branch review** of `git merge-base main HEAD..HEAD` with the Global Constraints above; fix Critical/Important findings in one pass.

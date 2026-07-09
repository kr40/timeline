# Baby Book — One-Time Capsule + Identity Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the birth capsule fillable exactly once and permanently sealed afterward, add 5 new baby-identity fields plus computed zodiac/birthstone badges, and ship two small bundled fixes (Home tab reorder, guess-date range) already applied to the working tree.

**Architecture:** 3 sequential tasks — migration + types, modal form changes, and display/lock behavior. A 4th task verifies and pushes. The two bundled fixes (`HomeTab.tsx` reorder, `getGuessDateRange()` in `config.ts` + its use in `GuessingGame.tsx`) are already implemented and uncommitted in the working tree — Task 1 commits them alongside the migration.

**Tech Stack:** React 18, TypeScript strict, Vite, Tailwind CSS v3, Supabase (PostgreSQL).

## Global Constraints

- All source files use **tabs** for indentation (not spaces)
- TypeScript strict — no implicit `any`; `catch (err: unknown)` with type guard preferred over `catch (err: any)`
- Mobile-first: `max-w-[600px]` centered
- Color palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`, text-primary `#1A1A2E`, text-muted `#6B7280`
- Font tokens: `font-poppins` (headings), `font-nunito` (body)
- Zodiac and birthstone are computed client-side from `birth_date` — never stored in the DB
- No external libraries for date range computation or zodiac/birthstone lookups
- The birth capsule form is submittable exactly once — no UI path may ever reopen it after a row exists in `birth_capsule`

---

### Task 1: Migration + Types + Commit Bundled Fixes

**Files:**
- Create: `supabase/migrations/20260709_add_birth_capsule_identity_fields.sql`
- Modify: `src/types.ts` — extend `BirthCapsule` type with 5 new fields
- Commit (already modified, uncommitted): `src/config.ts` (adds `getGuessDateRange()`), `src/components/home/GuessingGame.tsx` (uses the range), `src/components/HomeTab.tsx` (reorder)

**Interfaces:**
- Produces: `BirthCapsule` type gains `baby_name`, `name_meaning`, `nicknames`, `letter_to_baby`, `visitors` — all nullable/optional, consumed by Tasks 2 and 3

- [ ] **Step 1: Create the migration SQL file**

```sql
-- supabase/migrations/20260709_add_birth_capsule_identity_fields.sql

alter table birth_capsule
  add column baby_name      text,
  add column name_meaning   text,
  add column nicknames      text[],
  add column letter_to_baby text,
  add column visitors       text[];
```

- [ ] **Step 2: Run the migration**

Go to your Supabase project → SQL Editor → paste the contents of `supabase/migrations/20260709_add_birth_capsule_identity_fields.sql` → Run. Verify the 5 new columns appear on `birth_capsule` in Table Editor.

- [ ] **Step 3: Extend `BirthCapsule` type in `src/types.ts`**

Find the existing `BirthCapsule` type:

```ts
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

Replace it with:

```ts
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
	baby_name:        string | null;
	name_meaning:     string | null;
	nicknames:        string[];
	letter_to_baby:   string | null;
	visitors:         string[];
	created_at:       string;
};
```

- [ ] **Step 4: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit — includes the already-modified bundled fixes**

```
git add supabase/migrations/20260709_add_birth_capsule_identity_fields.sql src/types.ts src/config.ts src/components/home/GuessingGame.tsx src/components/HomeTab.tsx
git commit -m "feat: add birth capsule identity fields migration, reorder home tab, restrict guess date range"
```

---

### Task 2: Zodiac/Birthstone Utility + Modal Form Changes

**Files:**
- Create: `src/data/zodiacData.ts`
- Modify: `src/components/BirthCapsuleModal.tsx` — add identity fields to the form, remove the update/edit code path (capsule is insert-only going forward)

**Interfaces:**
- Consumes: `BirthCapsule` type from `../types` (extended in Task 1)
- Produces: `getZodiacSign(birthDate: string): { emoji: string; name: string }` and `getBirthstone(birthDate: string): { emoji: string; name: string }` exported from `src/data/zodiacData.ts` — consumed by Task 3

- [ ] **Step 1: Create `src/data/zodiacData.ts`**

```ts
type Sign = { emoji: string; name: string };

const ZODIAC_RANGES: { name: string; emoji: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
	{ name: 'Capricorn',  emoji: '♑', startMonth: 12, startDay: 22, endMonth: 1,  endDay: 19 },
	{ name: 'Aquarius',   emoji: '♒', startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 18 },
	{ name: 'Pisces',     emoji: '♓', startMonth: 2,  startDay: 19, endMonth: 3,  endDay: 20 },
	{ name: 'Aries',      emoji: '♈', startMonth: 3,  startDay: 21, endMonth: 4,  endDay: 19 },
	{ name: 'Taurus',     emoji: '♉', startMonth: 4,  startDay: 20, endMonth: 5,  endDay: 20 },
	{ name: 'Gemini',     emoji: '♊', startMonth: 5,  startDay: 21, endMonth: 6,  endDay: 20 },
	{ name: 'Cancer',     emoji: '♋', startMonth: 6,  startDay: 21, endMonth: 7,  endDay: 22 },
	{ name: 'Leo',        emoji: '♌', startMonth: 7,  startDay: 23, endMonth: 8,  endDay: 22 },
	{ name: 'Virgo',      emoji: '♍', startMonth: 8,  startDay: 23, endMonth: 9,  endDay: 22 },
	{ name: 'Libra',      emoji: '♎', startMonth: 9,  startDay: 23, endMonth: 10, endDay: 22 },
	{ name: 'Scorpio',    emoji: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
	{ name: 'Sagittarius',emoji: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

const BIRTHSTONES: Record<number, Sign> = {
	1:  { emoji: '💎', name: 'Garnet' },
	2:  { emoji: '💎', name: 'Amethyst' },
	3:  { emoji: '💎', name: 'Aquamarine' },
	4:  { emoji: '💎', name: 'Diamond' },
	5:  { emoji: '💎', name: 'Emerald' },
	6:  { emoji: '💎', name: 'Pearl' },
	7:  { emoji: '💎', name: 'Ruby' },
	8:  { emoji: '💎', name: 'Peridot' },
	9:  { emoji: '💎', name: 'Sapphire' },
	10: { emoji: '💎', name: 'Opal' },
	11: { emoji: '💎', name: 'Topaz' },
	12: { emoji: '💎', name: 'Turquoise' },
};

export function getZodiacSign(birthDate: string): Sign {
	const d = new Date(birthDate + 'T12:00:00');
	const month = d.getMonth() + 1;
	const day = d.getDate();

	for (const range of ZODIAC_RANGES) {
		const { startMonth, startDay, endMonth, endDay } = range;
		if (startMonth === endMonth) {
			if (month === startMonth && day >= startDay && day <= endDay) return { emoji: range.emoji, name: range.name };
		} else if (startMonth > endMonth) {
			// wraps around year boundary (Capricorn: Dec 22 – Jan 19)
			if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
				return { emoji: range.emoji, name: range.name };
			}
		} else {
			if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
				return { emoji: range.emoji, name: range.name };
			}
		}
	}
	return { emoji: '♑', name: 'Capricorn' };
}

export function getBirthstone(birthDate: string): Sign {
	const d = new Date(birthDate + 'T12:00:00');
	return BIRTHSTONES[d.getMonth() + 1];
}
```

- [ ] **Step 2: Replace `src/components/BirthCapsuleModal.tsx` entirely**

The modal becomes insert-only (no `existing` prop, no update path) since the capsule can never be edited after creation. Replace the full file:

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';

type Props = {
	onClose: () => void;
	onSaved: (capsule: BirthCapsule) => void;
};

export const BirthCapsuleModal = ({ onClose, onSaved }: Props) => {
	const [form, setForm] = useState({
		birth_date:       '',
		birth_time:       '',
		weight_kg:        '',
		length_cm:        '',
		location:         '',
		baby_name:        '',
		name_meaning:     '',
		nicknames:        '',
		letter_to_baby:   '',
		visitors:         '',
		headlines:        '',
		sports_results:   '',
		top_song:         '',
		top_movie:        '',
		famous_birthdays: '',
		weather:          '',
		notes:            '',
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
			setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const inputCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-full bg-slate-50 focus:outline-none focus:border-[#FF8C69] transition-colors';
	const textareaCls = 'w-full px-4 py-2.5 text-sm border-2 border-slate-100 rounded-2xl bg-slate-50 focus:outline-none focus:border-[#FF8C69] resize-none transition-colors';
	const labelCls = 'block text-xs font-bold text-[#6B7280] mb-1.5 pl-1';
	const sectionLabelCls = 'font-poppins font-bold text-sm text-[#1A1A2E] pt-2';

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
					<p className='text-xs font-bold text-[#FF8C69] bg-[#FF8C69]/10 rounded-2xl px-4 py-2.5'>
						⚠️ This can only be filled in once — it will be permanently sealed after saving.
					</p>

					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Birth Date</label><input className={inputCls} value={form.birth_date} onChange={set('birth_date')} placeholder='2026-11-09' /></div>
						<div><label className={labelCls}>Birth Time</label><input className={inputCls} value={form.birth_time} onChange={set('birth_time')} placeholder='3:42 AM' /></div>
					</div>
					<div className='grid grid-cols-2 gap-3'>
						<div><label className={labelCls}>Weight (kg)</label><input className={inputCls} value={form.weight_kg} onChange={set('weight_kg')} placeholder='3.4' /></div>
						<div><label className={labelCls}>Length (cm)</label><input className={inputCls} value={form.length_cm} onChange={set('length_cm')} placeholder='50' /></div>
					</div>
					<div><label className={labelCls}>Location</label><input className={inputCls} value={form.location} onChange={set('location')} placeholder='Dubai Hospital' /></div>

					<p className={sectionLabelCls}>Baby's Identity 👶</p>
					<div><label className={labelCls}>Full Name</label><input className={inputCls} value={form.baby_name} onChange={set('baby_name')} placeholder='Baby full name' /></div>
					<div><label className={labelCls}>Name Meaning</label><input className={inputCls} value={form.name_meaning} onChange={set('name_meaning')} placeholder='What the name means...' /></div>
					<div><label className={labelCls}>Nicknames (one per line)</label><textarea className={textareaCls} rows={2} value={form.nicknames} onChange={set('nicknames')} placeholder={'Bug\nMunchkin'} /></div>
					<div><label className={labelCls}>Letter to Baby</label><textarea className={textareaCls} rows={4} value={form.letter_to_baby} onChange={set('letter_to_baby')} placeholder='Dear baby...' /></div>
					<div><label className={labelCls}>Who Was There (one per line)</label><textarea className={textareaCls} rows={3} value={form.visitors} onChange={set('visitors')} placeholder={'Grandma\nGrandpa\nFamily dog Max'} /></div>

					<p className={sectionLabelCls}>The World That Day 🌍</p>
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
						{isSaving ? 'Saving...' : 'Seal Birth Capsule 🌟'}
					</button>
				</form>
			</div>
		</div>
	);
};
```

- [ ] **Step 3: TypeScript check (expected to show one known error)**

```
npx tsc --noEmit
```

Expected: exactly one error, in `src/components/BabyBookTab.tsx`, reporting that an `existing` prop does not exist on `BirthCapsuleModal`'s props. This is expected and correct — `BabyBookTab.tsx` still calls the old three-prop signature and is fixed in Task 3, which runs next in the same session. Do not attempt to fix `BabyBookTab.tsx` in this task. If you see any OTHER error, stop and investigate before committing.

- [ ] **Step 4: Commit**

```
git add src/data/zodiacData.ts src/components/BirthCapsuleModal.tsx
git commit -m "feat: add zodiac/birthstone utility, add identity fields to birth capsule form, remove edit path"
```

---

### Task 3: Baby Book Tab — Lock Behavior + New Display Sections

**Files:**
- Modify: `src/components/BabyBookTab.tsx` — remove edit button, rename fill button, add 3 new display sections

**Interfaces:**
- Consumes: `getZodiacSign`, `getBirthstone` from `../data/zodiacData` (Task 2); `BirthCapsule` extended type (Task 1); `BirthCapsuleModal` new insert-only signature (Task 2)

- [ ] **Step 1: Replace `src/components/BabyBookTab.tsx` entirely**

```tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { BirthCapsule } from '../types';
import { BirthCapsuleModal } from './BirthCapsuleModal';
import { getZodiacSign, getBirthstone } from '../data/zodiacData';

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
		(async () => {
			try {
				const { data } = await supabase.from('birth_capsule').select('*').limit(1).maybeSingle();
				setCapsule(data ?? null);
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	if (isLoading) return (
		<div className='flex justify-center py-16'>
			<div className='w-8 h-8 border-2 border-[#FF8C69] border-t-transparent rounded-full animate-spin' />
		</div>
	);

	const zodiac    = capsule?.birth_date ? getZodiacSign(capsule.birth_date) : null;
	const birthstone = capsule?.birth_date ? getBirthstone(capsule.birth_date) : null;
	const hasIdentity = Boolean(capsule?.baby_name || capsule?.name_meaning || (capsule?.nicknames?.length ?? 0) > 0 || zodiac || birthstone);

	return (
		<div className='space-y-4 pb-4'>
			{!capsule ? (
				<div className='rounded-3xl bg-white border border-slate-100 shadow-md p-8 text-center'>
					<div className='text-6xl mb-4'>📚</div>
					<h2 className='font-poppins font-extrabold text-xl text-[#1A1A2E] mb-2'>Baby Book Coming Soon ✨</h2>
					<p className='text-sm text-[#6B7280] font-semibold leading-relaxed max-w-xs mx-auto'>
						Fill this in when baby arrives — headlines, sports scores, famous birthdays, and all the details of the big day ✨
					</p>
					{isUnlocked && (
						<button onClick={() => setShowModal(true)}
							className='mt-6 px-6 py-3 rounded-full font-poppins font-bold text-white bg-[#FF8C69] hover:bg-[#e87a57] active:scale-95 transition-all text-sm'>
							📝 Fill In Birth Capsule
						</button>
					)}
				</div>
			) : (
				<>
					<div className='rounded-3xl bg-gradient-to-br from-[#FF8C69] to-[#e8744f] p-6 text-white shadow-lg shadow-[#FF8C69]/30'>
						<div>
							<p className='text-white/70 text-xs font-bold uppercase tracking-widest mb-1'>Baby arrived on</p>
							<h2 className='font-poppins font-extrabold text-2xl leading-tight'>
								{capsule.birth_date
									? new Date(capsule.birth_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
									: 'The big day!'}
							</h2>
							{capsule.birth_time && <p className='text-white/80 font-semibold text-sm mt-0.5'>at {capsule.birth_time}</p>}
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

					{hasIdentity && (
						<div className='rounded-3xl border p-5 bg-[#FF8C69]/10 border-[#FF8C69]/20'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>Baby's Identity 👶</h3>
							{capsule.baby_name && (
								<p className='font-poppins font-extrabold text-xl text-[#1A1A2E]'>{capsule.baby_name}</p>
							)}
							{capsule.name_meaning && (
								<p className='text-sm text-[#6B7280] font-semibold italic mt-1'>{capsule.name_meaning}</p>
							)}
							{capsule.nicknames?.length > 0 && (
								<div className='flex gap-2 flex-wrap mt-3'>
									{capsule.nicknames.map((nick, i) => (
										<span key={i} className='bg-white text-[#FF8C69] text-xs font-bold px-3 py-1 rounded-full'>{nick}</span>
									))}
								</div>
							)}
							{(zodiac || birthstone) && (
								<div className='flex gap-2 mt-3'>
									{zodiac && (
										<span className='bg-white/70 text-[#1A1A2E] text-xs font-bold px-3 py-1.5 rounded-full'>
											{zodiac.emoji} {zodiac.name}
										</span>
									)}
									{birthstone && (
										<span className='bg-white/70 text-[#1A1A2E] text-xs font-bold px-3 py-1.5 rounded-full'>
											{birthstone.emoji} {birthstone.name}
										</span>
									)}
								</div>
							)}
						</div>
					)}

					{capsule.letter_to_baby && (
						<div className='rounded-3xl border p-5 bg-[#B39DDB]/10 border-[#B39DDB]/20'>
							<h3 className='font-poppins font-bold text-[#1A1A2E] text-sm mb-3'>💌 A Letter To You</h3>
							<p className='text-sm text-[#1A1A2E] font-semibold leading-relaxed whitespace-pre-line'>{capsule.letter_to_baby}</p>
						</div>
					)}

					{capsule.visitors?.length > 0 && (
						<CapsuleSection title='Who Was There 👪' items={capsule.visitors} color='mint' />
					)}

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
					onClose={() => setShowModal(false)}
					onSaved={updated => { setCapsule(updated); setShowModal(false); }}
				/>
			)}
		</div>
	);
};
```

Key changes from the current file:
- `Pencil` import removed (no longer used)
- The pencil edit button in the hero card is gone entirely — once `capsule` exists, there is no path back into `BirthCapsuleModal`
- Pre-fill button text changed from `+ Add Birth Details` to `📝 Fill In Birth Capsule`
- `BirthCapsuleModal` no longer receives an `existing` prop (matches Task 2's new signature)
- Three new sections added: Baby's Identity (peach), Letter To You (lavender), Who Was There (mint) — each only rendered when it has data

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```
git add src/components/BabyBookTab.tsx
git commit -m "feat: lock birth capsule after first save, add identity/letter/visitors sections"
```

---

### Task 4: Final Check + Push to GitHub

**Files:** None — verification and deployment only.

- [ ] **Step 1: Full TypeScript check**

```
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Verify the migration reminder**

Confirm `supabase/migrations/20260709_add_birth_capsule_identity_fields.sql` has already been run in the Supabase dashboard (Task 1, Step 2). If not, run it now before merging.

- [ ] **Step 3: Verify no stray uncommitted changes**

```
git status
```

Should be clean (all changes committed across Tasks 1–3).

- [ ] **Step 4: Push and merge to main**

Follow the same process as prior phases: merge the feature branch into `main` with `--no-ff`, then `git push origin main`. This triggers a Netlify redeploy automatically.

- [ ] **Step 5: Final verification checklist**

Confirm on the deployed site:
- [ ] Baby Book pre-birth placeholder shows "📝 Fill In Birth Capsule" (no plus sign)
- [ ] After filling in the form once, no edit/pencil button ever appears again (check both view-only and unlocked mode)
- [ ] Baby's Identity, Letter To You, and Who Was There sections render correctly when data is present, and are hidden when empty
- [ ] Zodiac and birthstone badges show correct values for the entered birth date
- [ ] Home tab shows "This Week in Pregnancy" directly below "Baby this week"
- [ ] Guess-the-birthday date picker only allows October–November 2026 dates

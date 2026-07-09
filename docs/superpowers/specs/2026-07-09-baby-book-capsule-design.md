# Baby Book — One-Time Birth Capsule + Identity Fields

**Date:** 2026-07-09
**Branch base:** main (post phase 2 interactive features)

## Overview

The Baby Book tab's birth capsule form currently behaves like a repeatable "add/edit" form (labeled "+ Add Birth Details", with a permanent pencil-edit affordance). This gives the impression that entries can be added multiple times or edited indefinitely. This change makes the birth capsule a genuine **one-time keepsake**: fillable exactly once by an unlocked parent, then permanently sealed and read-only. It also expands the fields captured, drawing on traditional baby memory book conventions, while staying scoped to **birth-day identity details** (not duplicating the ongoing Timeline tab's milestone tracking).

Two small, unrelated fixes are bundled into the same release:
1. Reorder the Home tab so "This Week in Pregnancy" sits directly below "Baby this week" (previously separated by the polls/guessing game).
2. Restrict the "Guess the Birthday" date picker to the month before the EDD's month through the EDD's month (currently October–November 2026), computed from `config.ts`, not hardcoded.

---

## 1. One-Time Lock Behavior

- The birth capsule can be submitted **exactly once**. After the first successful save:
  - The tab shows the capsule as a permanent, read-only display.
  - No edit button, pencil icon, or any other affordance to reopen the form is ever shown again — in view-only OR unlocked mode.
  - Fixing a mistake after the fact requires a direct database edit (documented in code comments, not exposed in the UI).
- Before the first save, the pre-fill placeholder shows a **"📝 Fill In Birth Capsule"** button (unlocked only) — no plus sign, since this is explicitly a one-time action, not an "add" action.

### Implementation

`BabyBookTab.tsx` already gates on `capsule === null` to decide placeholder vs. capsule display. The only change needed:
- Remove the `Pencil` "Edit Birth Capsule" button entirely from the post-save capsule view (currently shown when `isUnlocked`).
- Rename the pre-save button text/icon from `+ Add Birth Details` to `📝 Fill In Birth Capsule`.
- No new lock column needed — the existing "does a row exist" check is already sufficient, since removing the edit button makes the row permanently immutable from the UI regardless of `isUnlocked`.

---

## 2. New Fields — Baby's Identity

Added to the one-time `BirthCapsuleModal` form, in a new "Baby's Identity" section of the form (grouped separately from the existing birth-day/culture/headline fields):

| Field | Type | Input | Notes |
|---|---|---|---|
| Full name | `text` | single-line input | |
| Name meaning | `text` | single-line input | The story/meaning behind the name |
| Nicknames | `text[]` | newline-separated textarea | Same UI pattern as Headlines/Famous Birthdays |
| Letter to Baby | `text` | multi-line textarea | Freeform love letter from parents |
| Who Was There | `text[]` | newline-separated textarea | First visitors, siblings, pets meeting baby |

**Zodiac sign and birthstone are NOT stored** — they are computed client-side from `birth_date` at display time:
- Zodiac: standard Western tropical date ranges (Capricorn Dec 22–Jan 19, Aquarius Jan 20–Feb 18, Pisces Feb 19–Mar 20, Aries Mar 21–Apr 19, Taurus Apr 20–May 20, Gemini May 21–Jun 20, Cancer Jun 21–Jul 22, Leo Jul 23–Aug 22, Virgo Aug 23–Sep 22, Libra Sep 23–Oct 22, Scorpio Oct 23–Nov 21, Sagittarius Nov 22–Dec 21).
- Birthstone: traditional monthly list (Jan Garnet, Feb Amethyst, Mar Aquamarine, Apr Diamond, May Emerald, Jun Pearl, Jul Ruby, Aug Peridot, Sep Sapphire, Oct Opal, Nov Topaz, Dec Turquoise).

## 3. Layout — Baby Book Tab (Post-Birth)

Order of sections after save:

1. **Hero card** (unchanged) — birth date/time + weight/length/location stat pills, peach gradient
2. **NEW: Baby's Identity card** (peach tint) — full name (large, Poppins), name meaning (italic subtext), nickname badges (pill chips), zodiac badge + birthstone badge (side by side, emoji-prefixed)
3. **NEW: Letter to Baby card** (lavender tint) — styled as a handwritten note: quote-style border, serif-leaning treatment via larger line-height, "💌 A Letter To You" heading
4. **NEW: Who Was There card** (mint tint) — bullet list, "👪 Who Was There" heading
5. World Headlines 📰 (existing, unchanged)
6. Sports ⚽ (existing, unchanged)
7. Culture 🎵🎬 — top song/movie (existing, unchanged)
8. Famous Birthdays 🎂 (existing, unchanged)
9. Weather ☀️ (existing, unchanged)
10. Notes 📝 (existing, unchanged)

All new sections follow the existing `CapsuleSection`-style card conventions (rounded-3xl, tinted background, Poppins heading). Sections with no data (e.g., no nicknames entered) are omitted entirely, consistent with existing behavior for other optional fields.

---

## 4. Data Model

Migration adds 5 nullable columns to the existing single-row `birth_capsule` table:

```sql
alter table birth_capsule
  add column baby_name      text,
  add column name_meaning   text,
  add column nicknames      text[],
  add column letter_to_baby text,
  add column visitors       text[];
```

No new tables. `BirthCapsule` type in `src/types.ts` gains 5 corresponding fields (all nullable/optional, matching the existing pattern for other optional columns like `weather` and `notes`).

---

## 5. Unrelated Bundled Fixes

### 5a. Home tab component order

`HomeTab.tsx` order changes from:
```
CountdownHero, FruitTracker, PollWidget, TraitPolls, GuessingGame, WeeklyFacts
```
to:
```
CountdownHero, FruitTracker, WeeklyFacts, PollWidget, TraitPolls, GuessingGame
```

### 5b. Guess-the-birthday date range

New `getGuessDateRange()` in `src/config.ts` (already implemented in this session) returns `{ min, max }` ISO date strings: the 1st of the month before the EDD's month, through the last day of the EDD's month. Applied as `min`/`max` on the date `<input>` in `GuessingGame.tsx`, plus a client-side guard in `submit()` that rejects out-of-range dates before hitting Supabase (already implemented).

---

## Auth & Permissions (updated)

| Action | View-only | Unlocked |
|--------|-----------|----------|
| View birth capsule (any state) | ✅ | ✅ |
| Fill in birth capsule (first time only) | ❌ | ✅ (once only, ever) |
| Edit birth capsule after first save | ❌ | ❌ (no UI path — permanently sealed) |

---

## Global Constraints

- React 18 + TypeScript strict — no implicit `any`
- Tabs indentation throughout
- Mobile-first
- Color palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`
- Font: `font-poppins` (headings), `font-nunito` (body)
- Zodiac/birthstone computed client-side, not stored in DB
- No external libraries for date range computation or zodiac/birthstone lookups
- `BirthCapsuleModal` remains a single form (no multi-step wizard) — new fields are added as additional form sections, consistent with existing form structure

## Out of Scope

- Any in-UI mechanism to unlock/re-edit the capsule after first save (deliberately absent — sealing is the point)
- Photo/footprint/handprint uploads for the capsule (existing `MemoryModal` image upload pattern is timeline-specific; not extended here)
- Delivery method / gestational week / doctor name fields (explicitly declined by user)
- Family tree / multi-generation photos (explicitly out of scope — full first-year memory book scope, not birth-day capsule scope)

# Baby Timeline — Phase 2: Interactive Features

**Date:** 2026-07-08
**Branch base:** main (post v2 redesign)

## Overview

Four new interactive features plus two cross-cutting improvements:

1. **Fingerprint deduplication** — replaces the localStorage-only voter ID with a stable browser fingerprint, applied globally across all voting/polling surfaces
2. **Trait polls** — four one-tap polls on the Home tab predicting which parent's features baby will inherit
3. **Birth date guessing game** — visitors guess the exact birth date; post-birth admin reveals the winner
4. **Emoji reactions on wishes** — four emoji reactions on each guestbook card
5. **Q&A tab** — visitors ask named questions; parents answer from unlocked mode
6. **Aesthetic consistency pass** — applies the Modern Playful design system to AuthGate, MemoryModal, and ExpandedImageModal

---

## 1. Fingerprint-based Deduplication (Global Fix)

### Problem

The existing `timeline_vote_id` approach stores a random UUID in `localStorage`. This is bypassed by incognito mode, clearing browser data, or switching browsers on the same device.

### Solution

Derive a stable **browser fingerprint** from device signals that survive cache clears:

```ts
function getBrowserFingerprint(): string {
	const raw = [
		navigator.userAgent,
		screen.width,
		screen.height,
		Intl.DateTimeFormat().resolvedOptions().timeZone,
		navigator.language,
		navigator.platform,
	].join('|');

	// djb2 hash
	let hash = 5381;
	for (let i = 0; i < raw.length; i++) {
		hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
	}
	return Math.abs(hash).toString(36);
}
```

Cache the result in `localStorage` under `timeline_fp` so it is computed once per browser session. Exported from `src/utils.ts` as `getVoterId()` — replaces the old `getOrCreateVoterId()` in `PollWidget.tsx` and is used by all new interactive features.

The fingerprint does not uniquely identify a person across genuinely different devices (which is fine — a family member on their own phone should be able to vote). It prevents repeated voting from the same browser regardless of incognito or cache clearing.

---

## 2. Trait Polls (Home Tab)

### UI

A 2×2 grid of compact cards placed on the Home tab, between the PollWidget and the guessing game. Each card:
- Emoji + question label (e.g. "👀 Whose eyes?")
- Three pill buttons: **Mum · Dad · Mix**
- After voting: pill buttons replaced by percentage bars + total count
- If already voted on load (fingerprint found in DB): shows results directly

Four traits: **eyes, nose, hair, smile**

### Data

**Supabase table:**
```sql
create table trait_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  trait       text not null check (trait in ('eyes', 'nose', 'hair', 'smile')),
  choice      text not null check (choice in ('mum', 'dad', 'mix')),
  created_at  timestamptz default now(),
  unique (voter_id, trait)
);
```

### Files

- Create: `src/components/home/TraitPolls.tsx` — renders all 4 trait cards; fetches counts and checks voter status on mount; subscribes to Supabase realtime on `trait_votes`
- Modify: `src/components/HomeTab.tsx` — import and render `<TraitPolls />` after PollWidget

---

## 3. Birth Date Guessing Game (Home Tab)

### UI

A card on the Home tab below TraitPolls:
- Heading: "Guess the Birthday 🎯"
- **Pre-guess state:** name text input + date picker + "Place My Guess!" button
- **Post-guess state (fingerprint already in DB):** "Your guess: [date]" with small edit pencil to update
- **Guesses feed:** scrollable list beneath the form — each entry: guesser name + date, sorted by `created_at` ascending
- **Post-birth winner:** if `is_winner = true` on an entry, it gets a 🏆 badge. Unlocked mode shows "Reveal Winner 🎉" button (only visible if birth capsule has a `birth_date` and no winner is marked yet)

### Data

**Supabase table:**
```sql
create table guesses (
  id            uuid primary key default gen_random_uuid(),
  voter_id      text not null unique,
  guesser_name  text not null,
  guess_date    date not null,
  is_winner     boolean default false,
  created_at    timestamptz default now()
);
```

### Files

- Create: `src/components/home/GuessingGame.tsx`
- Modify: `src/components/HomeTab.tsx` — import and render `<GuessingGame isUnlocked={isUnlocked} />`
- Modify: `App.tsx` — pass `isUnlocked` prop to `HomeTab`

**Note:** `HomeTab` currently takes no props. Adding `isUnlocked: boolean` requires updating both `HomeTab.tsx` signature and the render in `App.tsx`.

---

## 4. Emoji Reactions on Wishes (Wishes Tab)

### UI

Four emoji reaction buttons added to the bottom of each wish card: ❤️ 😂 🥹 🎉

- Shows count next to each emoji (0 counts hidden until at least 1 reaction)
- Tapping toggles your reaction on/off (highlighted when active)
- Deduped by fingerprint per wish per emoji (one reaction type per device per wish, but you can react with multiple emoji on the same wish)

### Data

**Supabase table:**
```sql
create table wish_reactions (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  wish_id     uuid not null references wishes(id) on delete cascade,
  emoji       text not null check (emoji in ('❤️', '😂', '🥹', '🎉')),
  created_at  timestamptz default now(),
  unique (voter_id, wish_id, emoji)
);
```

### Files

- Create: `src/components/wishes/ReactionBar.tsx` — takes `wishId`, `voterId`, renders 4 emoji buttons with counts; fetches own reactions on mount
- Modify: `src/components/WishesTab.tsx` — import and render `<ReactionBar>` at bottom of each wish card; fetch initial reaction counts with wishes query using a join or separate fetch

---

## 5. Q&A Tab (New 5th Tab)

### UI

New tab: 💬 Q&A — inserted as the 4th tab (Baby Book moves to 5th).

**Tab order:**
1. 🏠 Home
2. 📖 Timeline
3. 💌 Wishes
4. 💬 Q&A
5. 📚 Baby Book

**Submit form (top):**
- Name field (required): "Your name"
- Question textarea (required): "Ask us anything..."
- Submit button: "Ask Away 💬"
- No deduplication on questions — same person can ask multiple questions

**Question feed (below form):**
- Sorted newest first
- Each card: asker name (bold), question text, relative timestamp
- If answered: answer displayed in a styled quote block with a peach-left-border and "— Mum & Dad 💛" attribution
- If unanswered: subtle muted "Waiting for an answer... 🌙" placeholder
- Unlocked mode: "Answer" button on unanswered cards → inline textarea + "Save Answer" button

### Data

**Supabase table:**
```sql
create table questions (
  id           uuid primary key default gen_random_uuid(),
  asker_name   text not null,
  question     text not null,
  answer       text,
  answered_at  timestamptz,
  created_at   timestamptz default now()
);
```

### Files

- Create: `src/components/QATab.tsx`
- Modify: `src/components/TabBar.tsx` — add 💬 Q&A tab (4th), shift Baby Book to 5th
- Modify: `App.tsx` — add `TabId = 'qa'`, render `<QATab isUnlocked={isUnlocked} />`
- Update type: `TabId` in `TabBar.tsx` to include `'qa'`

---

## 6. Aesthetic Consistency Pass

Apply the Modern Playful design system (peach/mint/lavender, Poppins headings, Nunito body, rounded-full inputs, rounded-3xl cards) to:

### AuthGate (`src/components/AuthGate.tsx`)
- Full-screen centered card: `rounded-3xl shadow-xl bg-white max-w-sm`
- Heading: `font-poppins font-extrabold text-2xl text-[#1A1A2E]`
- Password input: `rounded-full border-2 border-slate-200 px-5 py-3 font-nunito`
- Submit button: `rounded-full bg-[#FF8C69] text-white font-bold py-3 px-8`
- Error state: soft red pill beneath input
- Modal variant (unlock overlay): same card styling, dark backdrop

### MemoryModal (`src/components/MemoryModal.tsx`)
- Modal card: `rounded-3xl shadow-xl`
- All text inputs and textareas: `rounded-2xl border-2 border-slate-200 px-4 py-3 font-nunito`
- Save button: `rounded-full bg-[#FF8C69] text-white font-bold`
- Delete button: `rounded-full bg-[#B39DDB] text-white font-bold`
- Cancel: `rounded-full border-2 border-slate-200`

### ExpandedImageModal (`src/components/ExpandedImageModal.tsx`)
- Close button: `rounded-full bg-white/20 backdrop-blur-sm` with peach hover
- Navigation arrows: same pill style
- Title text: `font-poppins font-bold`

---

## Data Model Summary — New Tables

| Table | Purpose |
|-------|---------|
| `trait_votes` | Trait poll responses (eyes/nose/hair/smile) |
| `guesses` | Birth date guesses per visitor |
| `wish_reactions` | Emoji reactions on guestbook wishes |
| `questions` | Q&A tab questions and answers |

Migration file: `supabase/migrations/20260708_add_phase2_tables.sql`

---

## Auth & Permissions

| Action | View-only | Unlocked |
|--------|-----------|----------|
| Vote on trait polls | ✅ | ✅ |
| Place birth date guess | ✅ | ✅ |
| React to wishes | ✅ | ✅ |
| Ask a question | ✅ | ✅ |
| Answer a question | ❌ | ✅ |
| Reveal guessing game winner | ❌ | ✅ |

---

## Global Constraints

- React 18 + TypeScript strict mode — no implicit `any`
- Tabs indentation throughout all source files
- Mobile-first: max-w-[600px] centered, `sm:` for desktop
- Color palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`
- Font tokens: `font-poppins` (headings), `font-nunito` (body)
- `getVoterId()` from `src/utils.ts` used by ALL interactive features (replaces old `getOrCreateVoterId()`)
- EDD sourced only from `src/config.ts`
- No external libraries for fingerprinting, date formatting, or relative time

---

## Out of Scope

- Server-side IP deduplication
- Push notifications for new questions/wishes
- Question upvoting / sorting by popularity
- Editing or deleting questions
- Baby name suggestions (deferred — no name chosen)

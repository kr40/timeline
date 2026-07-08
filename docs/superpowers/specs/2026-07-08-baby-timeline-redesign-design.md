# Baby Timeline — Full Redesign & New Features

**Date:** 2026-07-08
**EDD:** 2026-11-09
**Current week:** 22w6d (≈ Week 23)

## Overview

A complete frontend redesign of the baby timeline app plus three new feature modules. The app is shared with family and friends as a fun, interactive pregnancy tracker that will grow into a permanent baby book after birth. The existing password gate (view-only / unlocked) is unchanged. Per-user auth is out of scope for this phase.

The redesign targets a **Modern Playful** aesthetic: white background, warm pastel accents (peach, mint, lavender), Poppins/Nunito typefaces, rounded pill buttons and card corners, soft shadows. **Mobile-first throughout** — the primary audience uses this on their phones.

---

## App Structure

### Shell

A fixed **bottom tab bar** on mobile (thumb-reachable), converting to a top nav on desktop (≥ 640px). Max content width 600px, centered. The header shrinks to a small persistent banner showing the baby title and a "X days to go" pill.

### Tabs

| # | Icon | Label | Content |
|---|------|-------|---------|
| 1 | 🏠 | Home | Hero countdown, fruit tracker, boy/girl poll, weekly stats |
| 2 | 📖 | Timeline | Redesigned milestone feed |
| 3 | 💌 | Wishes | Guestbook — family messages for baby |
| 4 | 📚 | Baby Book | Birth capsule (placeholder pre-birth) |

Tab state lives in React (`useState`). No routing library. URL does not change per tab (can be added later).

---

## Design System

### Colors

| Token | Value | Use |
|-------|-------|-----|
| `peach` | `#FF8C69` | Primary CTA, countdown accent |
| `mint` | `#6CC9C9` | Secondary accent, fruit tracker |
| `lavender` | `#B39DDB` | Tertiary, wishes tab |
| `pink-vote` | `#FF8FAB` | Girl vote button |
| `blue-vote` | `#6BAED6` | Boy vote button |
| `bg` | `#FAFAFA` | Page background |
| `card` | `#FFFFFF` | Card surfaces |
| `text-primary` | `#1A1A2E` | Headings |
| `text-muted` | `#6B7280` | Secondary text |

### Typography

- **Headings:** Poppins (Bold 700) — loaded via Google Fonts in `index.html`
- **Body:** Nunito (Regular 400, SemiBold 600) — loaded via Google Fonts
- Both are web-safe fallbacks: `system-ui, sans-serif`

### Component Patterns

- Cards: `rounded-3xl shadow-md bg-white`
- Buttons (primary): `rounded-full bg-peach text-white font-bold py-3 px-6`
- Buttons (secondary): `rounded-full border-2 border-slate-200`
- Input fields: `rounded-full border-2 px-5 py-3`
- Bottom tab bar: `fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex justify-around py-2 z-30`

---

## Features

### Tab 1 — Home

#### Countdown Hero
- Large animated number showing days until EDD (November 9, 2026).
- Sub-label: "days until baby arrives 🎉"
- Soft pulsing animation on the number (`animate-pulse` or custom keyframe).
- When EDD has passed: shows "Baby is here! 🎉" instead.
- EDD stored as a constant in a config file (`src/config.ts`): `export const EDD = '2026-11-09'`

#### Fruit Size Tracker
- Card showing current week's fruit comparison.
- Fruit determined by: `currentWeek = 40 - Math.round(daysUntilEDD / 7)`, clamped to weeks 4–40. At 22w6d this resolves to week 23.
- Static data array in `src/data/fruitData.ts` — one entry per week 4–40:
  ```ts
  { week: 23, fruit: 'Large Mango', emoji: '🥭', lengthCm: 28.9, weightG: 501, fact: 'Your baby can now hear your voice!' }
  ```
- Card displays: emoji (large), fruit name, week number, length, weight, fun fact.
- Accent color: mint.

#### Boy or Girl? Poll
- Two large pill buttons: 💙 **Boy** (blue) and 🩷 **Girl** (pink).
- After voting: buttons replaced by a percentage bar showing live split + total vote count.
- Voter's name (optional text input shown before buttons) stored with vote.
- Double-vote prevention: a UUID stored in `localStorage` (`timeline_vote_id`). If the voter's UUID already exists in the `votes` table, the poll shows results instead of buttons on load.
- Supabase real-time subscription on the `votes` table so results update live for all viewers.

#### This Week in Pregnancy
- 3 bullet points of development facts for the current week.
- Static data in `src/data/weeklyFacts.ts` — one entry per week 4–40.
- Example week 23: ["Lungs are forming air sacs", "Eyebrows and eyelashes are appearing", "Baby is about 28.9cm long"]
- No API, purely static.

---

### Tab 2 — Timeline

Existing milestone data, fully reskinned:
- Cards: `rounded-3xl shadow-md` with peach left-border accent.
- Timeline connector: soft dashed vertical line between cards.
- Photo carousel: existing logic, reskinned with rounded corners and paging dots.
- Icon badges: circular, filled with pastel color per icon type.
- Edit button (unlocked only): small floating pencil icon top-right of card — unchanged behavior.
- FAB (add memory): unchanged behavior, reskinned to peach pill button.
- No data model changes.

---

### Tab 3 — Wishes

A guestbook for family and friends.

**Posting rules:** Anyone past the password gate (view-only OR unlocked) can post a wish. No additional auth required.

**Form (shown at top of tab):**
- Name field (required): "Your name"
- Message field (required): "Leave a wish for baby..."
- Submit button: "Send Wish 💌"
- On submit: insert into `wishes` table, optimistically prepend to feed.

**Feed:**
- Scrolling list of wish cards, newest first.
- Each card: pastel-colored background (cycles through peach/mint/lavender tints), author name in bold, message, relative timestamp ("2 days ago").
- No delete/edit (wishes are permanent — baby book material).

**Supabase table: `wishes`**
```sql
create table wishes (
  id          uuid primary key default gen_random_uuid(),
  author_name text not null,
  message     text not null,
  created_at  timestamptz default now()
);
```

---

### Tab 4 — Baby Book

#### Pre-birth state
- Full-tab illustrated placeholder: soft illustration (SVG), heading "Baby Book Coming Soon ✨", subtext "Fill this in when baby arrives — headlines, sports scores, famous birthdays, and all the details of the big day."
- No interaction, just a beautiful holding screen.

#### Post-birth state (admin fills in, unlocked mode only)
An "Edit Birth Capsule" button (unlocked only) opens a modal form. Once saved, the tab displays a rich Birth Capsule card:

**Birth Capsule fields:**
- Birth date & time
- Weight (kg) and length (cm)
- Location (hospital / city)
- World headlines that day (text[], up to 5)
- Sports results that day (text[], up to 5)
- #1 song that week
- #1 movie that week
- Famous people who share the birthday (text[], up to 10)
- Weather that day
- Notes (freeform)

All fields manually entered — no external APIs.

**Supabase table: `birth_capsule`**
```sql
create table birth_capsule (
  id                uuid primary key default gen_random_uuid(),
  birth_date        date,
  birth_time        text,
  weight_kg         numeric,
  length_cm         numeric,
  location          text,
  headlines         text[],
  sports_results    text[],
  top_song          text,
  top_movie         text,
  famous_birthdays  text[],
  weather           text,
  notes             text,
  created_at        timestamptz default now()
);
```

Single row — if a row exists, show the capsule; if not, show placeholder.

---

## Data Model Summary

### New tables

| Table | Purpose |
|-------|---------|
| `votes` | Boy/girl poll entries |
| `wishes` | Guestbook messages |
| `birth_capsule` | Birth day keepsake (single row) |

### `votes` schema
```sql
create table votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  choice      text not null check (choice in ('boy', 'girl')),
  voter_name  text,
  created_at  timestamptz default now(),
  unique (voter_id)
);
```

### No changes to `milestones`
Timeline redesign is purely visual.

---

## Static Data Files

| File | Contents |
|------|---------|
| `src/config.ts` | EDD constant, app title |
| `src/data/fruitData.ts` | Week 4–40 fruit tracker entries |
| `src/data/weeklyFacts.ts` | Week 4–40 development bullet points |

---

## Auth & Permissions

| Action | View-only | Unlocked |
|--------|-----------|----------|
| View timeline | ✅ | ✅ |
| Vote on poll | ✅ | ✅ |
| Post a wish | ✅ | ✅ |
| Add/edit timeline memory | ❌ | ✅ |
| Edit birth capsule | ❌ | ✅ |

Password gate unchanged from existing implementation (`VITE_APP_PASSWORD` env var).

---

## Out of Scope (This Phase)

- Per-user username/password auth for posting memories
- Baby name suggestions / voting
- Milestone form location, people-present, mood fields
- External API integrations (news, sports) for birth capsule
- React Router / shareable per-tab URLs
- Push notifications

---

## Technical Notes

- All new components mobile-first; desktop is an enhancement via `sm:` breakpoints.
- Google Fonts (Poppins + Nunito) added to `index.html` `<head>` via `<link>` tags.
- Real-time vote updates via Supabase `channel().on('postgres_changes', ...)`.
- `src/config.ts` is the single source of truth for EDD — used by fruit tracker, countdown, and weekly facts.
- Existing `AuthGate`, `MemoryModal`, `TimelineItem`, `ExpandedImageModal` components are reskinned but not structurally changed.

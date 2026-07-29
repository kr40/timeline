# Blessings Corner, Fun Polls, Baby Shower & Pre-Shower Mode

**Date:** 2026-07-29
**Branch base:** main (post baby-book capsule)
**Baby shower date:** 2026-08-14
**Parents:** Aditi (mum), Kartik (dad)

## Overview

Four features shipping together:

1. **Blessings & Advice Corner** — the Wishes tab evolves into a culturally-rooted blessings/advice guestbook (the family is Indian; ashirwad and advice are central to how relatives engage)
2. **Fun Mini Polls** — five "Aditi vs Kartik" one-tap polls on the Home tab
3. **Baby Shower section** — a new tab where shower guests scan a QR code, land directly on an upload form, and post a photo + message; becomes a permanent shower gallery afterward
4. **Pre-Shower Mode** — until the end of August 14th, the app runs gate-free with a reduced tab set; the password gate and full app return automatically afterward

---

## 1. Blessings & Advice Corner

### Behavior

- Tab renamed from **💌 Wishes** to **🙏 Blessings** (TabBar label "Blessings", Heart icon → an appropriate Lucide icon, e.g. `HandHeart` or keep `Heart`)
- Tab heading: "Blessings & Advice Corner"; subtext invites family to leave ashirwad (blessings) and advice for baby
- Post form gains a **category picker**: two pill toggles — **🙏 Blessing** | **💡 Advice** — required for new posts, defaulting to Blessing
- Feed shows a small category chip on each categorized post; legacy posts (pre-existing wishes, `category = null`) show no chip
- Feed filter chips at top: **All** | **🙏 Blessings** | **💡 Advice** (legacy uncategorized posts appear only under All)
- Everything else unchanged: optimistic posting, pastel card tints, relative timestamps, emoji reactions (❤️ 😂 🥹 🎉) on every post including legacy ones

### Data

One new nullable column on the existing `wishes` table:

```sql
alter table wishes add column category text check (category in ('blessing', 'advice'));
```

`Wish` type gains `category: 'blessing' | 'advice' | null`.

### Files

- Modify: `src/components/WishesTab.tsx` (rename display copy, add category picker + filter; keep filename to avoid churn — internal component name may stay `WishesTab`)
- Modify: `src/components/TabBar.tsx` (label/icon)
- Modify: `src/types.ts`

---

## 2. Fun Mini Polls (Home Tab)

### Behavior

Five polls, rendered below `TraitPolls`, using the same interaction pattern (pill buttons → percentage bars + total after voting, realtime updates, fingerprint dedup via `getVoterId()`):

| id | Question | Option A | Option B |
|---|---|---|---|
| `sleep` | Whose sleep schedule will the baby ruin first? 😴 | Aditi | Kartik |
| `diaper` | Who will cry more during diaper changes? 😭 | Aditi | Kartik |
| `inherit` | What will baby inherit? 🧬 | Aditi's patience | Kartik's appetite |
| `pushover` | Who will baby have wrapped around their finger? 🫠 | Aditi | Kartik |
| `googler` | Who googles "is this normal?" at 3am more? 🔍 | Aditi | Kartik |

- Poll definitions (id, question, option labels) live in a static data file `src/data/funPolls.ts` — adding a future poll is one array entry plus extending the DB check constraint
- Stored choice is always `'aditi' | 'kartik'`; the display label varies per poll (e.g. "Aditi's patience")
- Vote color: Aditi = lavender `#B39DDB`, Kartik = mint `#6CC9C9` (distinct from the boy/girl poll's pink/blue)
- Full-width stacked cards (questions are longer than the trait polls' 2×2 grid allows)

### Data

```sql
create table fun_poll_votes (
  id          uuid primary key default gen_random_uuid(),
  voter_id    text not null,
  poll        text not null check (poll in ('sleep', 'diaper', 'inherit', 'pushover', 'googler')),
  choice      text not null check (choice in ('aditi', 'kartik')),
  created_at  timestamptz default now(),
  unique (voter_id, poll)
);
```

### Files

- Create: `src/data/funPolls.ts`, `src/components/home/FunPolls.tsx`
- Modify: `src/components/HomeTab.tsx` (render below `TraitPolls`)

---

## 3. Baby Shower Section

### Behavior

- New tab **🎉 Shower** (position: after Q&A, before Baby Book; during pre-shower mode it's the 4th of 4 visible tabs)
- **QR deep link:** the QR code on printed invites points to `<site-url>/#shower`. On app load, if `location.hash === '#shower'`, the app opens with the Shower tab active (hash cleared afterward). Works in both pre-shower mode (no gate — guest lands directly on the form) and after (gate shows first, then lands on Shower)
- **Upload form** (top of tab, everyone can post):
  - Name (required)
  - Message (required, textarea)
  - Photo (optional) — file input accepting camera capture or gallery, uploaded via the existing `uploadToImageKit` helper from `src/imagekit.ts`
  - Submit: "Share the Moment 🎉" — optimistic prepend
- **Gallery feed:** newest first; each card shows photo (if any, tap to view full-screen via existing `ExpandedImageModal`), message, author name, relative time; pastel tint cycling like the blessings feed
- **Permanent:** after the shower the tab remains as the shower memory gallery; the form stays available (late uploads welcome)
- **QR code deliverable:** generate a QR code PNG pointing at the production URL `#shower` and save it to `docs/shower-qr.png` for printing (generated once via a script or online tool during implementation — the QR itself is not app code)

### Data

```sql
create table shower_posts (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null,
  message      text not null,
  image_url    text,
  created_at   timestamptz default now()
);
```

`ShowerPost` type added to `src/types.ts`.

### Files

- Create: `src/components/ShowerTab.tsx`
- Modify: `src/components/TabBar.tsx`, `App.tsx` (new TabId `'shower'`, hash deep-link handling)

---

## 4. Pre-Shower Mode

### Behavior

**Active while `today <= 2026-08-14` (local time), i.e. until end of the shower day.**

While active:
- **No password gate** — `App.tsx` skips `AuthGate` entirely; every visitor is treated as view-only
- **Reduced tab set:** Home 🏠, Blessings 🙏, Q&A 💬, Shower 🎉 — Timeline and Baby Book tabs hidden from the tab bar
- **Header:** the lock/unlock button is hidden
- **Parents' backdoor:** tapping/clicking the app title in the header **5 times within 3 seconds** opens the existing unlock modal (`AuthGate isModal`). A successful password unlock restores the FULL app on that device: all 6 tabs, edit rights, and the lock button (which, when locked again, returns that device to the reduced pre-shower view)

After `2026-08-14` (from Aug 15 local time):
- Everything reverts to current behavior automatically: password gate on first load, full 6-tab bar (now including Shower), lock/unlock button visible

### Implementation notes

- `SHOWER_DATE = '2026-08-14'` added to `src/config.ts` with a helper `isPreShowerMode(): boolean` (compares local date; unlocked state overrides the reduced view)
- Tab visibility is computed in `App.tsx`/`TabBar.tsx` from `isPreShowerMode()` + `authState`: pre-shower AND not unlocked → reduced tabs, no gate; unlocked (any time) → full tabs
- The tap-5-times counter lives in the header title's click handler; resets after 3 seconds of inactivity
- View-only users in pre-shower mode never see the gate, but all posting features (blessings, polls, guesses, Q&A, shower uploads) work — they already only need view-only access

---

## Auth & Permissions (updated)

| Action | Pre-shower visitor (no gate) | View-only (post-shower) | Unlocked |
|---|---|---|---|
| See Home / Blessings / Q&A / Shower | ✅ | ✅ | ✅ |
| See Timeline / Baby Book | ❌ | ✅ | ✅ |
| Post blessing/advice, vote, guess, ask, shower upload | ✅ | ✅ | ✅ |
| Add/edit memories, answer Q&A, fill capsule, reveal winner | ❌ | ❌ | ✅ |

---

## Global Constraints

- React 18 + TypeScript strict — no implicit `any`; `catch (err: unknown)` with type guard
- Tabs indentation throughout
- Mobile-first, max-w-[600px]
- Palette: peach `#FF8C69`, mint `#6CC9C9`, lavender `#B39DDB`; Poppins headings, Nunito body
- `getVoterId()` for all voting dedup
- All date logic (shower date, EDD) sourced from `src/config.ts` only
- No routing library — the `#shower` hash is read once on load, not a routing system
- No external libraries added (QR code is generated as a static asset during implementation, not rendered client-side)

## Out of Scope

- Per-user identity (still future phase)
- Editing/deleting shower posts or blessings (permanent, like wishes)
- Multiple QR codes / per-guest links
- Shower RSVP or event logistics (the tab is a memory wall, not an event manager)

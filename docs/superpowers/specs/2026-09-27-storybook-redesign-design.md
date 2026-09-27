# Storybook Redesign

**Date:** 2026-09-27
**Direction chosen:** C · Storybook (bold ink outlines, sticker cards, cream dotted paper), refined to feel minimal
**Mockups:** `scratchpad/directions.html` (A/B/C comparison), `scratchpad/storybook.html` (approved direction across tabs + laptop)

## Goal

The site feels plain, flat, and long. Measured on a 375×812 phone: Home is 3.6 screens, Timeline 10.6, Blessings 3.1, with no motion anywhere. Redesign every screen in the Storybook style, cut scrolling sharply, and add polished, purposeful animation — without changing any data or removing any existing feature except the Shower tab.

## Hard constraints

- **No data is touched.** No migrations, no DELETE/UPDATE of existing rows, no table drops. `milestones`, `votes`, `trait_votes`, `fun_poll_votes`, `guesses`, `wishes`, `wish_reactions`, `birth_capsule`, `shower_posts`, `questions` all remain exactly as they are. This is a presentation-layer change only.
- **Every existing behaviour is preserved**: password unlock + view-only, milestone add/edit/delete + multi-photo upload + pagination + ascending date order, boy/girl vote (name required, one vote per device, cannot be changed), trait + fun polls (fingerprint dedup, upsert), realtime vote counts, guess-the-birthday (name required, Oct–Nov range, edit own guess, unlocked winner reveal), blessings (category, filter, optimistic insert, reactions), sealed birth capsule (insert-only, never editable in UI), full-screen image viewer with swipe and pinch-zoom.
- Mobile-first. Must also look intentional on laptops and large monitors.
- Respect `prefers-reduced-motion`: all motion reduces to simple fades or none.

## Removals

- **Shower tab** — removed from the UI (tab, component, type). The `shower_posts` table and every row in it stay untouched in Supabase. Old `#shower` QR links simply land on Home.
- **Pre-shower mode** — `SHOWER_DATE`, `isPreShowerMode()`, the reduced tab set, the tap-5-times title gesture, and `GamesHero` are deleted. The shower has passed, so this code is permanently inert.
- **Dead code** — `FloatingBackground.tsx`, `lucide-react` (replaced by Phosphor), old keyframes in `index.css`, unused `FADE_IN_*` constants.

Tabs after redesign: **Home · Timeline · Blessings · Baby Book**.

## Visual system

| Token | Value | Use |
|---|---|---|
| `ink` | `#2B2340` | All outlines, primary text, offset shadows |
| `muted` | `#756B86` | Secondary text |
| `paper` | `#FFFBF2` | Page background, with a `#EADFCC` 1.3px dot grid every 18px |
| `peach` | `#FFD6C7` | Hero, warm accents |
| `mint` | `#CBF1EC` | Kartik, advice, facts |
| `lav` | `#E6DBFF` | Aditi, blessings |
| `butter` | `#FFE680` | Active tab, primary buttons, highlights |
| `pink` | `#FFD6E5` | Girl, love |
| `sky` | `#D3E8FF` | Boy |
| `danger` | `#C23B55` | Errors only |

- **Card:** white (or one pastel), `2px solid ink`, radius 22px, offset shadow `4px 4px 0 ink`. At most one pastel per card.
- **Press effect** (every tappable card/button): on press, translate `(3px, 3px)` and shrink the shadow to `1px 1px` — the sticker is pushed into the page. Spring back on release.
- **Inputs:** white, `2px ink` border, radius 16px; on focus, butter-tinted background and a `2px 2px 0 ink` shadow.
- Minimalism rule: generous whitespace, one idea per card, no decorative text.

## Typography

- **Display:** Grandstander (600/700/800) — headings, big numbers, names. Only used at ≥16px.
- **Body:** Nunito Variable — everything else.
- Both self-hosted via `@fontsource` (no Google Fonts request, no flash of fallback on slow networks).
- Fluid heading sizes with `clamp()` so type scales up on laptop/monitor instead of staying phone-sized.
- `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`.

## Pictures and icons

- **Pictures:** Microsoft Fluent 3D emoji (MIT licence). Downloaded once, resized to 160px WebP, self-hosted in `public/emoji/`. Used for: fruit of the week (all 27 fruit/veg images mapped from `fruitData`), poll illustrations, section headers, empty states, celebrations, Baby Book sections, login screen, desktop side doodles, favicon. Consistent on iOS, Android, Windows.
- **Icons:** Phosphor (`@phosphor-icons/react`), duotone weight for navigation/nodes, bold weight for small action icons. Replaces lucide-react everywhere.
- Emoji typed by users inside content (blessings, memory text) are left untouched.

## Motion

Library: `motion` (Motion for React). Confetti: `canvas-confetti`. Global `<MotionConfig reducedMotion="user">`.

| Moment | Animation |
|---|---|
| Tab bar | Butter indicator slides between tabs (shared layout, bouncy spring); icon hops on select |
| Tab change | Content slides from the direction of the new tab + fades (≈250ms) |
| Screen load | Cards rise in with a staggered spring |
| Hero | Progress ring draws to current week; days counter counts up; fruit bobs gently |
| Fact ticker | Tap → text slides out/in |
| Poll deck | Vote → confetti burst from tap point, result bars spring-fill, card flies off after ~1.3s and the next springs in from the stack; draggable left/right; dots animate |
| Scroll | Timeline cards, blessing notes pop in once as they enter view |
| Reactions | Emoji pops and the count bumps |
| Sheets | Slide up with spring on phones (drag down to dismiss); scale-fade dialog on ≥640px |
| Celebrations | Confetti on blessing posted, memory saved, winner revealed, capsule sealed, unlock |
| Login | Wrong password → shake; baby illustration bobs |
| Desktop | 3D doodles float slowly in the side gutters (≥1024px only) |

All motion uses transform/opacity only.

## Layout per screen

### App shell
- Sticky header on paper with slight blur: title "Baby Journey" + sparkles, days-to-go pill (≥sm), Lock/Unlock pill.
- Floating white tab bar (bottom, 12px inset, sticker shadow), 4 tabs.
- Content column: max 640px, centered. ≥1024px: decorative floating doodles in gutters.

### Home (target ≈1 screen)
1. **Hero card** (peach): progress ring with days-to-go counter; "Week N of 40"; headline; fruit bubble with 3D fruit, fruit name, length/weight.
2. **Fact ticker**: one of the week's 3 facts, tap to cycle.
3. **Play & predict deck**: all 10 polls in one card stack — Boy or girl → 4 traits → 5 Aditi vs Kartik. Starts at the first poll you haven't voted on. Shows results for voted polls. Prev/next arrows + dots + swipe. Boy/girl card asks for the guest name inline if none is remembered.
4. **Two tiles**: "Guess the day" (opens sheet: form + leaderboard + unlocked reveal) and the Aditi vs Kartik score (opens sheet: per-poll result bars).

### Timeline
- Milestones grouped under sticky month chips.
- Card: date, title, one polaroid photo (tilted ±1.5°, count badge if several), description clamped to 2 lines.
- Tap card → Memory sheet: full text + swipeable photos; tap photo → full-screen viewer.
- Dashed path with icon sticker nodes (Phosphor duotone per `IconType`).
- Unlocked: edit button on card, floating "+ Memory" button. Load more preserved.

### Blessings
- Compact intro line + sticky filter chips (All / Blessings / Advice).
- Two-column masonry of sticky notes (pastel paper, tape strip, slight rotation, category picture, author, time, reactions).
- Floating "Bless" button → compose sheet (category, name prefilled from remembered guest name, message). Posting → confetti, note pops in at top.

### Baby Book
- Pre-birth: illustrated card (3D teddy, bottle, ribbon floating), unlocked "Fill in birth capsule" → sheet.
- Post-birth: hero card + section cards each with a 3D picture.
- Seal → stamp animation + confetti.

### Login screen
- Paper background, sticker card, big bobbing 3D baby with floating balloon/star, password field, Unlock (butter) + View only.
- Unlock modal (from header) uses the sheet.

### Editing (unlocked)
- Memory add/edit and Birth Capsule forms become sheets with the new inputs; icon picker uses Phosphor icons; photo grid restyled.

## Small behaviour additions

- **Remembered guest name**: stored in `localStorage` (`timeline_guest_name`) the first time a guest enters it anywhere; prefilled in boy/girl vote, guess form, and blessing form. Editable in each form.

## Out of scope

- New data features (subtle baby-info additions are proposed separately to the user).
- Dark mode.
- Any change to Supabase schema or data.

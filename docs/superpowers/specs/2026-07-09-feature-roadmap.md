# Baby Timeline — Feature Roadmap

**Date:** 2026-07-09
**Status:** Reference document — not a spec for immediate implementation. Pull items from here into a proper brainstorm + spec + plan cycle when ready to build.

## Purpose

A survey of features from baby-tracker apps, pregnancy trackers, and family memory-sharing apps, filtered down to what actually fits this project: a **password-gated family scrapbook**, not a daily-caregiving log (no feeding/diaper/sleep tracking — that's a different category of app and out of scope permanently). Ideas below are grouped by effort and organized so a future session can pick one, brainstorm it properly, and build it without re-researching from scratch.

---

## Tier 1 — Quick Wins (small, self-contained, fits existing architecture)

### 1. Weekly bump photo tracker
Upload one photo per pregnancy week; display as a scrolling side-by-side grid, similar to the existing Fruit Tracker. Post-birth, could extend to a "baby's first year" weekly photo grid. Popular feature across nearly every pregnancy app surveyed — directly complements the existing "Baby this week" fruit comparison.
**Fits:** New Home tab card or its own section. Reuses the existing ImageKit upload pattern from `MemoryModal`.

### 2. Search / filter on the Timeline tab
Filter milestones by date range or icon type; simple client-side filter over already-loaded data, no new DB work.
**Fits:** `TimelineTab.tsx`, additive UI only.

### 3. Data export / backup
A single "Export everything" button (unlocked only) that dumps all tables (milestones, wishes, votes, guesses, birth capsule, Q&A) as one JSON file. Cheap peace-of-mind feature — family memory data should never be locked into one app.
**Fits:** New small utility, no schema changes.

### 4. Guestbook photo attachments
Let a wish optionally include one photo (reuses `MemoryModal`'s ImageKit upload flow). Every memory-sharing app surveyed treats photo + text as the baseline unit, not text alone.
**Fits:** `WishesTab.tsx` + `wishes` table gains a nullable `image_url` column.

### 5. "On this day" throwback
On the Home tab, show a milestone from N weeks/months ago if one exists ("On this day last month..."). Zero new data — just a query against existing `milestones`.

---

## Tier 2 — Medium Effort (new table or moderate UI, still single-feature scope)

### 6. Post-birth growth chart with percentiles
After birth, let unlocked parents log weight/height at intervals; plot against WHO growth percentile curves. Nearly every baby-tracker app treats this as a core feature once the baby arrives — natural evolution of the pre-birth Fruit Tracker into a real growth chart.
**Fits:** New `growth_entries` table, new Home tab (or Baby Book) card with a simple line chart (no charting library needed for a handful of points — plain SVG polyline is enough).

### 7. Voice notes on memories and wishes
Attach a short audio recording to a Timeline memory or a guestbook wish — "hearing grandma's voice" is called out repeatedly across family-memory-app research as more emotionally resonant than text alone. Browser `MediaRecorder` API + upload to existing ImageKit/Supabase storage, no new dependency.
**Fits:** `MemoryModal.tsx` and `WishesTab.tsx`, additive field.

### 8. Video support in the Timeline
Currently the timeline only supports photos. Short video clips (e.g. first steps, first laugh) are one of the most requested memory-book formats in every source surveyed.
**Fits:** Extend `getImages`-style helper to a mixed media array; ImageKit already supports video hosting on the same plan tier as images.

### 9. Push notifications (new wish, new answered question, poll milestone)
"A family member sees updates without opening the app" is the single most common family-engagement feature across pregnancy-tracker research. Needs a service worker + push subscription table — meaningfully more infrastructure than anything shipped so far.
**Fits:** New `push_subscriptions` table, a Netlify Function (or Supabase Edge Function) to send pushes, a service worker registration on the frontend.

### 10. Guided memory prompts
Instead of a blank "What happened?" field, offer rotating suggested prompts ("What made you laugh today?", "Describe a smell/sound from today") — a pattern borrowed directly from dedicated family-storytelling apps (Remento, StoryWorth), shown to meaningfully increase how much people write.
**Fits:** Static prompt list + a "🎲 Surprise me" button in `MemoryModal.tsx`, zero schema change.

---

## Tier 3 — Larger Investments (multi-task projects, needs its own brainstorm cycle)

### 11. Per-user identity (deferred from earlier phases)
Individual family members get their own display name (and optionally a small avatar/photo) instead of everyone sharing one "unlocked" or "view-only" identity. Every wish, reaction, vote, and question could then show *who* did it. This is the natural foundation for #9 (targeted notifications) and #12 (comments) and was explicitly deferred in the original password-gate design — worth revisiting once the family's actively using the app and the "who said what" question starts mattering.
**Fits:** Needs its own spec — touches auth, most existing tables (`wishes`, `votes`, `guesses`, `questions`), and every write path in the app.

### 12. Comments/replies on Timeline memories
Currently only guestbook wishes get reactions. Letting family comment directly on a specific milestone ("look how big he's gotten!") is a natural extension once #11 exists to attribute comments to a person.
**Fits:** New `memory_comments` table, small addition to `TimelineItem.tsx`.

### 13. Printed/exportable photo book
Compile the Timeline + Baby Book into a print-ready PDF or hand off to a print-on-demand service (Blurb, MILK Books, and Photojaanic all specialize in this for baby books specifically). This is the single most-cited "end state" of a baby memory book — the ultimate physical keepsake.
**Fits:** A substantial project — PDF generation (client-side with a library, or server-side render), layout design work, possibly a third-party print API integration.

### 14. Family tree / multi-generation photo section
A dedicated Baby Book section for grandparents/great-grandparents photos, giving baby "a sense of belonging and history" per the memory-book research. Deliberately excluded from the birth capsule scope (kept that feature tight to birth-day identity) — could become its own Baby Book sub-section later.
**Fits:** New table or JSON column, new Baby Book display section, new admin form.

### 15. Offline-capable PWA
Install-to-homescreen + basic offline viewing of already-loaded content, useful for family members with patchy connectivity. Meaningful infrastructure work (service worker, cache strategy) for a "nice to have," not urgent.

---

## Explicitly Deferred / Not Planned

These came up in research but don't fit this app's purpose — listed so a future session doesn't re-propose them without reason:

- **Daily caregiving logs** (feeding, sleep, diaper tracking) — this is a *memory/scrapbook* app for family, not a caregiving tool for parents. A different app category entirely.
- **Vaccination/appointment reminders** — same reasoning; belongs in a parent-facing care app, not a family-facing memory app.
- **Baby registry / gift list** — out of scope; this app is about memories, not logistics.
- **Public/social sharing** — the whole point of the password gate is privacy; no public links, no social feed integration.
- **AI auto-captioning or AI-written recaps** — interesting but speculative; revisit only if there's a concrete use case, not "because AI."

---

## Sources

- [Pebbi — Best Baby Tracker Apps 2026](https://pebbi.co/blog/best-baby-tracker-apps-2026)
- [Tottli — Best Baby Tracker Apps 2026](https://tottli.com/blog/best-baby-tracker-apps-2026.html)
- [CDC Milestone Tracker App](https://www.cdc.gov/act-early/milestones-app/index.html)
- [Outreachz — 10 Best Baby Tracker Apps 2026](https://outreachz.com/blog/best-baby-tracker-ai-apps/)
- [Baby Connect](https://en.babyconnect.com/)
- [Sprout Baby Tracker](https://sprout-apps.com/apps/baby-tracker/)
- [Bumpdate — Social Pregnancy App](https://bumpdateapp.com/)
- [Forbes Health — 5 Best Pregnancy Apps 2026](https://www.forbes.com/health/womens-health/pregnancy/best-pregnancy-apps/)
- [Today.com — 18 Best Pregnancy Apps](https://www.today.com/parents/pregnancy/best-pregnancy-apps-rcna30762)
- [Baby Leap — Milestone Tracker](https://apps.apple.com/us/app/baby-leap-milestone-tracker/id6472646241)
- [Baby Daybook — Development Tracker](https://babydaybook.app/development-tracker/)
- [Growth: Baby & Child Charts](https://apps.apple.com/us/app/growth-baby-child-charts/id446639811)
- [Klokbox — Record Family Stories](https://klokbox.com/record-family-stories/)
- [Remento — Capture Family Memories](https://www.remento.co/journal/the-7-best-tools-to-capture-and-celebrate-family-memories-stories)
- [StoryWorth — Family Story Sharing](https://welcome.storyworth.com/blog/best-real-time-family-story-sharing-platforms)
- [ParentMap — Apps for Making Memories You Can Share](https://www.parentmap.com/article/apps-for-making-memories-you-can-share)
- [MILK Books — 9 Things to Include in a Baby Keepsake Book](https://www.milkbooks.com/blog/family/9-things-to-include-in-your-baby-keepsake-book/)
- [Photojaanic — 12 Ideas for Baby's First Year Memory Book](https://www.photojaanic.com/blog/12-ideas-for-babys-first-year-memory-book-photojaanic)

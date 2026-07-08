# Password Auth Design — Baby Timeline

**Date:** 2026-05-13  
**Status:** Approved

---

## Context

The baby timeline app is moving to production. Currently anyone who opens the URL can add, edit, and delete memories. The goal is to protect write access behind a simple shared password while keeping the timeline viewable to family and friends without friction.

---

## Requirements

- **Full gate on load** — every visitor hits a password screen before seeing anything
- **Two paths from the gate:** unlock with password (edit mode) or continue view-only
- **Persistent session** — once unlocked, stays unlocked in that browser forever (localStorage), until manually locked
- **Password stored as** `VITE_APP_PASSWORD` Netlify env var — baked into the client bundle at build time, acceptable for a private family app
- **Zero disruption to existing UI** — only the gate and the lock/unlock header button are new; all other UI is untouched except for conditional rendering of edit controls

---

## Auth States

| State | `localStorage` value | UI |
|---|---|---|
| No auth | *(key absent)* | `AuthGate` full-screen |
| View-only | `timeline_auth = view-only` | Timeline, no edit UI, 🔑 Unlock in header |
| Unlocked | `timeline_auth = unlocked` | Timeline + edit UI, 🔒 Lock in header |

---

## Components

### New: `src/components/AuthGate.tsx`

Full-screen baby-themed password gate. Renders when `localStorage` has no auth state.

**UI elements:**
- App title + icon (matches existing header style)
- Password `<input>` field (type="password")
- **"Unlock ✨"** button — disabled when input is empty; on submit, trims input and compares to `import.meta.env.VITE_APP_PASSWORD`; on match sets `timeline_auth = unlocked`; on failure triggers shake animation + "Incorrect password" message and clears input
- **"View only 👀"** button — sets `timeline_auth = view-only` immediately, no password required

**Props:**
```ts
interface AuthGateProps {
  onAuth: (state: 'unlocked' | 'view-only') => void;
}
```

### Modified: `App.tsx`

- Reads `localStorage.getItem('timeline_auth')` on mount to initialise `authState`
- If `authState` is null → renders `<AuthGate onAuth={setAuthState} />` in place of the timeline
- Derives `isUnlocked = authState === 'unlocked'` and passes it to children
- **Header additions:**
  - When `view-only`: small 🔑 Unlock button → opens a small centered modal (same baby-theme styling as AuthGate, but without the "View only" option) to upgrade to edit mode
  - When `unlocked`: small 🔒 Lock button → clears localStorage, resets `authState` to null → gate shows again
- "Add Memory ✨" button only renders when `isUnlocked === true`

### Modified: `src/components/TimelineItem.tsx`

- Receives `isUnlocked: boolean` prop
- Edit ✏️ button only renders when `isUnlocked === true`

---

## Data Flow

```
App load
  └─ read localStorage('timeline_auth')
       ├─ 'unlocked'  → timeline + edit UI
       ├─ 'view-only' → timeline, no edit UI
       └─ null        → <AuthGate />

AuthGate — password submit
  └─ trim(input) === VITE_APP_PASSWORD?
       ├─ yes → localStorage.set('timeline_auth', 'unlocked') → onAuth('unlocked')
       └─ no  → shake + error message, clear input

AuthGate — view only click
  └─ localStorage.set('timeline_auth', 'view-only') → onAuth('view-only')

Lock button click (unlocked header)
  └─ localStorage.remove('timeline_auth') → setAuthState(null) → gate shows

Unlock button click (view-only header)
  └─ small centered modal (AuthGate style, no "View only" option)
       └─ same validation flow as AuthGate → sets 'unlocked', closes modal
```

---

## Edge Cases

- **Empty input:** Unlock button is disabled; no submission possible
- **Whitespace:** Input trimmed before comparison
- **Env var not set:** Gate shows but never unlocks; warns in dev console
- **Wrong password:** Shake animation, "Incorrect password" text, input cleared
- **localStorage unavailable:** Falls back gracefully to showing the gate each visit

---

## Netlify Setup

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add `VITE_APP_PASSWORD` with the chosen password value
3. Trigger a redeploy (or it auto-deploys on next push)

To change the password: update the env var → redeploy. No code changes needed.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/AuthGate.tsx` | **New** — full-screen password gate component |
| `App.tsx` | Add auth state management, conditional edit UI, lock/unlock header button |
| `src/components/TimelineItem.tsx` | Accept + respect `isUnlocked` prop for edit button |

---

## Verification

1. **Gate shows on fresh load** — open app in incognito, confirm password gate appears
2. **Wrong password** — enter bad password, confirm shake + error, no access granted
3. **View-only works** — click "View only", confirm timeline loads with no Add/Edit buttons
4. **Unlock works** — enter correct password, confirm full edit UI appears
5. **Session persists** — close and reopen the tab, confirm still unlocked (no gate)
6. **Lock works** — click 🔒 in header, confirm gate reappears
7. **Upgrade from view-only** — click 🔑 in header while view-only, enter password, confirm edit mode activates
8. **Env var not set** — remove env var locally, confirm gate shows and never unlocks (dev warning logged)

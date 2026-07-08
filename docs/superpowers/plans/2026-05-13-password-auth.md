# Password Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen password gate that blocks all access until the visitor either unlocks with a password (edit mode) or continues as view-only.

**Architecture:** Auth state (`'unlocked' | 'view-only' | null`) is stored in `localStorage` and read on mount in `App.tsx`. When null, the app renders `AuthGate` full-screen instead of the timeline. Edit UI elements (FAB, edit buttons on cards) are conditionally rendered based on `isUnlocked`. A lock/unlock button in the header lets visitors switch modes after initial auth.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite env vars (`VITE_APP_PASSWORD`), `localStorage`.

---

## File Map

| File | Change |
|---|---|
| `index.css` | Add `@keyframes shake` + `.animate-shake` class |
| `src/components/AuthGate.tsx` | **New** — full-screen gate + reusable unlock modal (via `isModal` prop) |
| `App.tsx` | Add auth state, gate render, header lock/unlock button, conditional FAB, unlock modal |
| `src/components/TimelineItem.tsx` | Add `isUnlocked` prop to `TimelineCard` and `TimelineItem`, conditionally render edit button |

---

## Task 1: Add shake animation to `index.css`

**Files:**
- Modify: `index.css`

- [ ] **Step 1: Add the keyframe and utility class**

Open `index.css` and insert after the existing `carouselFade` block (after line 52):

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%       { transform: translateX(-6px); }
  30%       { transform: translateX(6px); }
  45%       { transform: translateX(-4px); }
  60%       { transform: translateX(4px); }
  75%       { transform: translateX(-2px); }
  90%       { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.55s ease-in-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add index.css
git commit -m "style: add shake animation for wrong-password feedback"
```

---

## Task 2: Create `src/components/AuthGate.tsx`

**Files:**
- Create: `src/components/AuthGate.tsx`

This component serves two purposes via the `isModal` prop:
- `isModal=false` (default): full-screen gate shown on app load — has both Unlock and View Only buttons
- `isModal=true`: small centered overlay for upgrading view-only → unlocked — Unlock button only, plus Cancel

- [ ] **Step 1: Create the file with the full implementation**

```tsx
import { useState } from 'react';
import { Baby } from 'lucide-react';
import { FloatingBackground } from './FloatingBackground';

type AuthOutcome = 'unlocked' | 'view-only';

interface AuthGateProps {
  onAuth: (state: AuthOutcome) => void;
  isModal?: boolean;
  onClose?: () => void;
}

const PasswordForm = ({
  onAuth,
  showViewOnly,
  onClose,
}: {
  onAuth: (state: AuthOutcome) => void;
  showViewOnly: boolean;
  onClose?: () => void;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const handleUnlock = () => {
    const expected = import.meta.env.VITE_APP_PASSWORD;
    if (!expected) {
      console.warn('[AuthGate] VITE_APP_PASSWORD is not set.');
    }
    if (password.trim() === expected) {
      try { localStorage.setItem('timeline_auth', 'unlocked'); } catch { /* ignore */ }
      onAuth('unlocked');
    } else {
      setShake(true);
      setError('Incorrect password');
      setPassword('');
      setTimeout(() => setShake(false), 600);
    }
  };

  const handleViewOnly = () => {
    try { localStorage.setItem('timeline_auth', 'view-only'); } catch { /* ignore */ }
    onAuth('view-only');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password.trim()) handleUnlock();
  };

  return (
    <div className={shake ? 'animate-shake' : ''}>
      <input
        type='password'
        value={password}
        onChange={e => { setPassword(e.target.value); setError(''); }}
        onKeyDown={handleKeyDown}
        placeholder='Enter password'
        autoFocus
        className='w-full px-4 py-3 border-2 border-pink-200 rounded-full text-center font-nunito text-slate-700 focus:outline-none focus:border-pink-400 bg-white'
      />
      {error && (
        <p className='mt-2 text-sm text-center text-red-400 font-semibold'>{error}</p>
      )}
      <button
        onClick={handleUnlock}
        disabled={!password.trim()}
        className='mt-4 w-full py-3 bg-pink-400 text-white font-bold rounded-full hover:bg-pink-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
      >
        Unlock ✨
      </button>
      {showViewOnly && (
        <button
          onClick={handleViewOnly}
          className='mt-3 w-full py-3 border-2 border-pink-200 text-pink-500 font-bold rounded-full hover:bg-pink-50 transition-colors'
        >
          View only 👀
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className='mt-3 w-full py-2 text-slate-400 text-sm font-semibold hover:text-slate-600 transition-colors'
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export const AuthGate = ({ onAuth, isModal = false, onClose }: AuthGateProps) => {
  if (isModal) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm'>
        <div className='w-full max-w-sm mx-4 bg-cream rounded-3xl p-8 shadow-2xl shadow-pink-100 border-2 border-pink-100'>
          <h2 className='text-2xl font-extrabold text-slate-800 text-center mb-6'>🔑 Unlock editing</h2>
          <PasswordForm onAuth={onAuth} showViewOnly={false} onClose={onClose} />
        </div>
      </div>
    );
  }

  return (
    <div className='relative min-h-screen overflow-x-hidden bg-cream flex items-center justify-center font-nunito'>
      <FloatingBackground />
      <div className='relative z-10 w-full max-w-sm mx-4 bg-white rounded-3xl p-8 shadow-2xl shadow-pink-100 border-4 border-pink-200'>
        <div className='flex flex-col items-center mb-8'>
          <div className='inline-flex items-center justify-center p-4 mb-4 bg-pink-100 rounded-full'>
            <Baby className='w-12 h-12 text-pink-500' />
          </div>
          <h1 className='text-3xl font-extrabold text-slate-800 text-center'>Our Baby Journey</h1>
          <p className='mt-2 text-slate-500 text-center text-sm leading-relaxed'>
            Enter the password to add memories, or view the timeline as a guest.
          </p>
        </div>
        <PasswordForm onAuth={onAuth} showViewOnly={true} />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `AuthGate.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/AuthGate.tsx
git commit -m "feat: add AuthGate component with password validation and view-only option"
```

---

## Task 3: Wire auth state into `App.tsx`

**Files:**
- Modify: `App.tsx`

Four changes in this file:
1. Add `authState` state (read from localStorage on mount)
2. Render `<AuthGate>` early-return when `authState` is null
3. Add lock/unlock button to header
4. Conditionally render the Add Memory FAB
5. Render unlock modal when `showUnlockModal` is true

- [ ] **Step 1: Add the import for `AuthGate` at the top of `App.tsx`**

Add to the existing imports block:

```tsx
import { AuthGate } from './src/components/AuthGate';
```

- [ ] **Step 2: Add auth state inside the `App` component, after the existing `useState` declarations**

```tsx
type AuthState = 'unlocked' | 'view-only' | null;

const [authState, setAuthState] = useState<AuthState>(() => {
  try {
    const stored = localStorage.getItem('timeline_auth');
    if (stored === 'unlocked' || stored === 'view-only') return stored;
  } catch { /* localStorage unavailable */ }
  return null;
});

const [showUnlockModal, setShowUnlockModal] = useState(false);

const isUnlocked = authState === 'unlocked';

const handleAuth = (state: 'unlocked' | 'view-only') => {
  setAuthState(state);
};

const handleLock = () => {
  try { localStorage.removeItem('timeline_auth'); } catch { /* ignore */ }
  setAuthState(null);
};
```

- [ ] **Step 3: Add the early-return gate just before the `return (` statement**

Insert this block immediately above `return (`:

```tsx
if (authState === null) {
  return <AuthGate onAuth={handleAuth} />;
}
```

- [ ] **Step 4: Add the lock/unlock button inside the `<header>` element**

The current header inner div is:
```tsx
<div className='relative z-10 max-w-5xl mx-auto text-center'>
```

Replace the entire `<header>` element with this (adds `relative` positioning wrapper and the button):

```tsx
<header className='bg-white/80 backdrop-blur-md rounded-b-[3rem] shadow-sm p-8 mb-12 relative z-10 border-b border-pink-50'>
  <div className='relative z-10 max-w-5xl mx-auto text-center'>
    <div className='inline-flex items-center justify-center p-4 mb-4 transition-transform duration-300 bg-pink-100 rounded-full hover:scale-110'>
      <Baby className='w-12 h-12 text-pink-500' />
    </div>
    <h1 className='mb-2 text-4xl font-extrabold tracking-tight md:text-5xl text-slate-800'>Our Baby Journey</h1>
    <p className='text-lg font-medium text-slate-500'>From a tiny seed to our little miracle 🌱</p>
  </div>
  <div className='absolute top-4 right-4 md:top-6 md:right-8 z-20'>
    {isUnlocked ? (
      <button
        onClick={handleLock}
        className='flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-pink-500 bg-pink-50 border-2 border-pink-200 rounded-full hover:bg-pink-100 transition-colors'>
        🔒 Lock
      </button>
    ) : (
      <button
        onClick={() => setShowUnlockModal(true)}
        className='flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-pink-500 bg-pink-50 border-2 border-pink-200 rounded-full hover:bg-pink-100 transition-colors'>
        🔑 Unlock
      </button>
    )}
  </div>
</header>
```

- [ ] **Step 5: Wrap the Add Memory FAB in a conditional**

Find the current FAB button (starts with `<button` at the fixed bottom-right, around line 173). Wrap it so it only renders when `isUnlocked`:

```tsx
{isUnlocked && (
  <button
    onClick={() => {
      setEditingMilestone(null);
      setIsModalOpen(true);
    }}
    className='fixed z-40 flex items-center justify-center p-4 text-yellow-900 transition-transform transform bg-yellow-400 rounded-full shadow-lg bottom-8 right-8 hover:bg-yellow-300 shadow-yellow-200 hover:scale-110 group'>
    <Plus className='w-8 h-8' strokeWidth={3} />
    <span className='overflow-hidden text-lg font-bold transition-all duration-300 ease-in-out max-w-0 whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 group-hover:mr-2'>
      Add Memory
    </span>
  </button>
)}
```

- [ ] **Step 6: Add the unlock modal just before the closing `</div>` of the root element**

After the existing `{expandedGallery && ...}` block, add:

```tsx
{showUnlockModal && (
  <AuthGate
    isModal={true}
    onAuth={state => {
      handleAuth(state);
      setShowUnlockModal(false);
    }}
    onClose={() => setShowUnlockModal(false)}
  />
)}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add App.tsx
git commit -m "feat: wire auth state into App — gate, lock/unlock header button, conditional FAB"
```

---

## Task 4: Update `TimelineItem.tsx` to respect `isUnlocked`

**Files:**
- Modify: `src/components/TimelineItem.tsx`

The edit ✏️ button currently always renders. It needs to be hidden in view-only mode.

- [ ] **Step 1: Update `TimelineCard` props and button rendering**

Replace the current `TimelineCard` component definition (the `memo(({milestone, onImageClick, onEditClick}: {...}) =>` block) with this updated version that adds `isUnlocked`:

```tsx
export const TimelineCard = memo(
  ({
    milestone,
    onImageClick,
    onEditClick,
    isUnlocked,
  }: {
    milestone:    Milestone;
    onImageClick: (images: string[], index: number) => void;
    onEditClick:  (milestone: Milestone) => void;
    isUnlocked:   boolean;
  }) => {
    const images = getImages(milestone);
    const hasImages = images.length > 0;
    const isCarousel = images.length > 1;
    const [activeIndex, setActiveIndex] = useState(0);
    const safeIndex = hasImages ? Math.min(activeIndex, images.length - 1) : 0;
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => { setImgLoaded(false); }, [safeIndex]);

    const prev = () => setActiveIndex(i => (i - 1 + images.length) % images.length);
    const next = () => setActiveIndex(i => (i + 1) % images.length);
    const swipe = useSwipe(next, prev);

    return (
      <div className='relative bg-white w-full rounded-3xl p-6 shadow-xl shadow-pink-100 border-4 border-pink-200 transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-200 hover:border-pink-300 group'>
        {isUnlocked && (
          <button
            onClick={() => onEditClick(milestone)}
            className='absolute p-2 text-pink-400 transition-colors rounded-full shadow-sm opacity-0 top-4 right-4 bg-pink-50 hover:bg-pink-100 hover:text-pink-600 group-hover:opacity-100'>
            <Pencil className='w-5 h-5' />
          </button>
        )}

        <div className='inline-flex items-center px-5 py-2 mb-5 space-x-2 text-lg font-extrabold text-purple-800 transition-colors bg-purple-100 rounded-full shadow-sm group-hover:bg-purple-200'>
          <Calendar className='w-5 h-5' />
          <span>{formatDate(milestone.date)}</span>
        </div>

        <h3 className='pr-10 mb-4 text-3xl font-extrabold text-slate-800'>{milestone.title}</h3>

        {hasImages && (
          <div
            className='mb-6 p-3 pb-6 md:p-4 md:pb-8 bg-white rounded-xl shadow-md border border-slate-200 transform transition-all duration-300 group-hover:scale-[1.03] group-hover:-rotate-2 group-hover:shadow-xl group-hover:border-pink-200 cursor-pointer'
            onClick={() => onImageClick(images, safeIndex)}>

            <div
              className='relative w-full aspect-[3/4] overflow-hidden rounded-lg bg-slate-100 border border-slate-100 touch-pan-y'
              {...(isCarousel ? swipe : {})}>
              {!imgLoaded && (
                <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100' />
              )}
              <img
                key={safeIndex}
                src={images[safeIndex]}
                alt={`${milestone.title} – photo ${safeIndex + 1}`}
                loading='lazy'
                onLoad={() => setImgLoaded(true)}
                className={`object-cover object-center w-full h-full select-none carousel-img-enter transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            </div>

            {isCarousel && (
              <div
                className='flex justify-center gap-1.5 mt-3'
                onClick={e => e.stopPropagation()}>
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`rounded-full transition-all duration-200 ${
                      i === safeIndex ? 'w-4 h-2 bg-pink-400' : 'w-2 h-2 bg-slate-300 hover:bg-pink-300'
                    }`}
                    aria-label={`Go to photo ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <p className='text-xl leading-relaxed text-slate-600'>{milestone.description}</p>
      </div>
    );
  },
);
```

- [ ] **Step 2: Update `TimelineItem` props and pass `isUnlocked` down to `TimelineCard`**

Replace the `TimelineItem` component definition with:

```tsx
export const TimelineItem = memo(
  ({
    milestone,
    index,
    onImageClick,
    onEditClick,
    isUnlocked,
  }: {
    milestone:    Milestone;
    index:        number;
    onImageClick: (images: string[], index: number) => void;
    onEditClick:  (milestone: Milestone) => void;
    isUnlocked:   boolean;
  }) => (
    <div
      className={`relative mb-12 animate-fade-in-up md:flex md:items-center md:justify-between ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
      style={{ animationDelay: `${Math.min(index * FADE_IN_STEP_S, FADE_IN_MAX_S)}s` }}>
      <div className='absolute z-10 flex items-center justify-center transition-all duration-300 transform -translate-x-1/2 bg-white border-4 border-pink-100 rounded-full shadow-md left-1/2 w-14 h-14 hover:scale-110 hover:rotate-6'>
        {renderIcon(milestone.icon)}
      </div>
      <div className='w-full pt-20 md:pt-0 md:w-1/2 md:px-12'>
        <TimelineCard
          milestone={milestone}
          onImageClick={onImageClick}
          onEditClick={onEditClick}
          isUnlocked={isUnlocked}
        />
      </div>
      <div className='hidden md:block md:w-1/2'></div>
    </div>
  ),
);
```

- [ ] **Step 3: Update the `TimelineItem` usage in `App.tsx`**

Find the `<TimelineItem>` JSX in `App.tsx` (inside the `milestones.map` call) and add the `isUnlocked` prop:

```tsx
<TimelineItem
  key={milestone.id}
  milestone={milestone}
  index={index}
  onImageClick={(images, idx) => setExpandedGallery({ images, index: idx, title: milestone.title })}
  onEditClick={m => {
    setEditingMilestone(m);
    setIsModalOpen(true);
  }}
  isUnlocked={isUnlocked}
/>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/TimelineItem.tsx App.tsx
git commit -m "feat: hide edit controls in view-only mode"
```

---

## Task 5: Manual Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Gate shows on fresh load**

Open `http://localhost:5173` in an incognito window. Confirm the password gate appears (baby icon, title, password input, Unlock ✨ and View only 👀 buttons). The timeline should NOT be visible yet.

- [ ] **Step 3: Wrong password shows shake + error**

Type any wrong password, click Unlock ✨. Confirm:
- Card shakes
- "Incorrect password" text appears in red
- Password field clears
- You're still on the gate

- [ ] **Step 4: View-only mode works**

Click "View only 👀". Confirm:
- Timeline loads and is fully readable
- NO yellow Add Memory FAB in the bottom-right
- NO edit ✏️ buttons appear on cards (even on hover)
- Header shows a 🔑 Unlock button

- [ ] **Step 5: Upgrade from view-only to edit**

While in view-only, click 🔑 Unlock in the header. Confirm a small centered modal appears with password input and Cancel button. Enter the correct password. Confirm:
- Modal closes
- Edit ✏️ buttons now appear on hover
- Add Memory FAB is now visible
- Header now shows 🔒 Lock button

- [ ] **Step 6: Unlock with correct password from gate**

Return to gate (lock or open incognito). Enter the correct password. Confirm full edit mode loads (FAB visible, edit buttons on hover).

- [ ] **Step 7: Session persists across page reloads**

While unlocked, close and reopen the tab (not incognito — use a normal tab). Confirm you land directly on the timeline in edit mode with no gate.

- [ ] **Step 8: Lock works**

Click 🔒 Lock in the header. Confirm the gate reappears immediately.

- [ ] **Step 9: Build passes**

```bash
npm run build
```

Expected: build completes with no TypeScript or Vite errors.

- [ ] **Step 10: Final commit if any tweaks were made, then push**

```bash
git push
```

Netlify will redeploy automatically. Set `VITE_APP_PASSWORD` in the Netlify dashboard (Site settings → Environment variables) before pushing if you haven't already — the build will still succeed without it, but unlocking won't work until it's set and redeployed.

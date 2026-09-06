# TinyLog — design spec

Date: 2026-09-07
Status: approved in conversation, pending written review

## 1. Purpose

TinyLog is a mobile progressive web app for logging a newborn's feeds and
sleep. It replaces a Lovable mock (`~/Downloads/lovable-project-tiny-log`)
with three changes the mock did not have:

1. No natural-language / "AI" entry. No fake mic, no text parser.
2. Recording an event takes one tap. Extra detail is optional and never
   blocks the tap.
3. The baby is always in exactly one state (Awake, Asleep, Napping) and the
   home screen's buttons are the transitions between those states.

Guiding UX rule, in the user's words: recording must take as few steps as
possible and must allow capturing as much information as possible. Every
screen decision below follows from that: one tap records the fact; each
extra fact costs one more tap; nothing is modal on the way in.

Non-goals for v1: multi-device sync, accounts, notifications, multiple
children, growth/diaper/medicine tracking.

## 2. Stack

- Vite + React 19 + TypeScript, single-page app, static output.
- Tailwind CSS v4. The mock's `styles.css` design tokens (night palette as
  default, `.daylight` light palette, `--feed/--sleep/--nap` colors,
  `card-soft`, `surface-warm`, `animate-pop-in`, Baloo 2 / Nunito fonts) are
  copied over verbatim. The `--wake` token stays for the Wake up button.
- `vite-plugin-pwa` for the web manifest and a precaching service worker
  (`registerType: "autoUpdate"`). The app is fully usable offline.
- `lucide-react` for icons. No shadcn component library; the few
  primitives needed (bottom sheet, chips) are written by hand.
- Storage: `localStorage`, one JSON array under `tinylog.events.v2`.
- Tests: Vitest for domain logic. Playwright (via the MCP plugin) for
  mobile-viewport screenshots during development.
- No router library. Two screens (Home, History) switched by app state and
  reflected in the URL hash (`#/` and `#/history`) so back navigation works
  in standalone mode.

Dropped from the mock: TanStack Start, TanStack Router, Nitro, the Lovable
vite config and error reporting, react-query, react-hook-form, zod,
recharts, and the unused shadcn components.

Project location: `~/P25/tinylog`.

## 3. Data model

```ts
type FeedSource = "breast" | "bottle";

type FeedEvent = {
  id: string;
  kind: "feed";
  at: number;          // epoch ms
  source: FeedSource;
  ml?: number;         // optional for both sources
};

type RestEvent = {
  id: string;
  kind: "sleep" | "nap";
  at: number;          // start, epoch ms
  endAt?: number;      // undefined while the baby is still asleep
};

type LogEvent = FeedEvent | RestEvent;
```

There is no "wake" event. Waking up sets `endAt` on the open rest event.

Invariants, enforced by the store:

- At most one rest event has `endAt === undefined`.
- `endAt >= at` whenever `endAt` is set.
- Events are kept sorted by `at` descending.

Migration: on first load, if `tinylog.events.v1` (the mock's key) exists and
`v2` does not, convert it: `wake` events are dropped, `feedKind` becomes
`source` (default `"bottle"`), ISO strings become epoch ms. The v1 key is
left in place.

## 4. State machine

`deriveState(events, now)` is a pure function:

```
type BabyState =
  | { name: "awake";   since: number }   // since = end of last rest, or earliest event, or now
  | { name: "asleep";  since: number; eventId: string }
  | { name: "napping"; since: number; eventId: string }
```

- If an open `sleep` exists → `asleep`, `since = at`.
- If an open `nap` exists → `napping`, `since = at`.
- Otherwise `awake`, `since` = the latest `endAt` among rest events, or
  `now` if there is no rest event.

Transitions (all are store actions; each returns the created/updated event):

| From            | Action                  | Effect                                              | To      |
|-----------------|-------------------------|-----------------------------------------------------|---------|
| any             | `feed(source, at?)`     | insert FeedEvent                                    | same    |
| awake           | `startRest(kind, at?)`  | insert RestEvent without endAt                      | asleep / napping |
| asleep, napping | `startRest(kind, at?)`  | close the open rest at `at`, then insert new one    | asleep / napping |
| asleep, napping | `wake(at?)`             | set `endAt = at` on the open rest                   | awake   |
| awake           | `wake()`                | no-op                                               | awake   |

`at` defaults to `now`. A backfilled `at` for `startRest` while a rest is
open closes that rest at the same `at`; if `at < open.at`, the open rest is
deleted instead (it never happened).

Editing: `updateEvent(id, patch)` and `deleteEvent(id)`. Updates clamp
`endAt` to be `>= at`. Deleting the open rest returns the state to awake.

## 5. Screens

### 5.1 Home

Layout, top to bottom, max width 28rem, centred:

1. **Header**: "TinyLog", today's date, buttons for History and the
   night/day toggle.
2. **State card**, driven by `deriveState`:
   - awake: "☀️ Awake · 1h 05m" and a second line "last feed 40m ago ·
     120ml" (or "no feeds yet").
   - asleep: "😴 Asleep · since 20:15 · 2h 10m".
   - napping: "🛌 Napping · since 13:00 · 42m".
   Elapsed times tick every 30 s.
3. **Action buttons**, depend on state:
   - awake: a 2×2 grid: Nap, Sleep, Breast, Bottle.
   - asleep or napping: one full-width primary "⏰ Wake up", then a row
     with Breast and Bottle (dream feeds happen).
   Each button is at least 5.5rem tall. A tap records at `now`, fires a
   short vibration (`navigator.vibrate(20)` where available), shows a toast
   "🍼 Bottle logged", and opens the just-logged strip.
4. **Today's stats**: three tiles, Feeds (count, total ml), Rest today
   (h m, sleep + naps), and either "Asleep for" or "Awake for".
5. **Today's timeline** (see 5.3), with the just-logged strip pinned above
   it.

**Just-logged strip.** Appears immediately after any action tap, attached
to the top of the timeline, for 10 s or until dismissed or another action
is tapped. Contents:

```
🍼 Bottle · 14:32                                  [Undo]
started   [now] [−5m] [−15m] [−30m] [🕒]
amount    [60] [90] [120] [150] [180] [other]
```

- "started" chips shift `at` backwards by the amount; the currently
  selected chip is highlighted; `🕒` opens a native `<input type="time">`.
- "amount" chips (feeds only) set `ml`; "other" reveals a numeric input.
  The last-used ml per source is highlighted as a hint.
- For Wake up the strip has only the "ended" time chips.
- For Nap / Sleep the strip has only the "started" time chips.
- Undo deletes the event (or, for Wake up, reopens the rest).

Every chip is one tap and applies immediately; the strip never needs a
Save button.

### 5.2 History

Kept from the mock with the wake filter removed:

1. Header with back button.
2. Day picker (previous / label / next, next disabled on today).
3. Four stat tiles: Feeds (count, ml), Night sleep (total, longest), Naps
   (count, total), Total rest.
4. 7-day bar chart of rest hours; tapping a bar selects the day.
5. Filter chips: All, Feed, Sleep, Nap.
6. Timeline for the selected day.
7. Settings row at the bottom: Export JSON (downloads
   `tinylog-YYYY-MM-DD.json`), Import JSON (file picker, replaces all events
   after a confirm), and the night/day preference.

### 5.3 Timeline and edit sheet

A timeline row shows emoji, label, source and ml for feeds, start–end and
duration for rests, and "still asleep" for an open rest. Tapping a row
opens the **edit sheet**, a bottom drawer:

- Feed: time (`<input type="time">`), Breast / Bottle toggle, ml chips +
  numeric input, Delete.
- Rest: start time, end time (or "still asleep" with a "Wake up now"
  button), Delete.
- Changes apply on tap or on input change; the sheet has a Close button,
  no Save.

Time inputs give a time of day only. The date is inferred: keep the event's
current date, but if the result would be in the future, move it one day
back. The sheet shows the resolved date under the input when it is not
today.

### 5.4 Night mode

Night palette is the default. The toggle is persisted under
`tinylog.daylight`.

## 6. Module layout

```
src/
  main.tsx                 mount, register SW
  App.tsx                  hash "router", theme class
  styles.css               tokens from the mock
  domain/
    events.ts              types, newId, migration from v1
    state.ts               deriveState + pure transition functions
    stats.ts               eventsForDay, dayStats, week series
    time.ts                formatTime, durationLabel, resolveTimeOfDay
  store/
    store.ts               useSyncExternalStore store, persistence, actions
  screens/
    Home.tsx
    History.tsx
  components/
    StateCard.tsx
    ActionButtons.tsx
    JustLogged.tsx
    Timeline.tsx
    EditSheet.tsx
    StatTile.tsx
    Chip.tsx
    Toast.tsx
```

`domain/*` has no React and no browser globals, so it is unit-tested
directly. `store.ts` is the only module that touches `localStorage`.

## 7. Error handling

- `localStorage` unavailable or full: keep events in memory, show a
  one-time toast "Can't save on this device".
- Corrupt JSON in storage: start empty, keep the corrupt value under
  `tinylog.events.v2.corrupt` for recovery.
- Import of an invalid file: reject with a toast, keep existing data.
- Clock going backwards (edited later start time): `endAt` is clamped to
  `>= at`; durations never go negative.

## 8. Testing

Unit (Vitest):

- `deriveState`: empty log, open sleep, open nap, closed rests, several
  rests.
- Transitions: every row of the table in §4, including backfill that
  precedes the open rest.
- `dayStats` and `eventsForDay`: overnight sleep split across midnight,
  feed totals, longest sleep.
- `resolveTimeOfDay`: future time moves to yesterday; past time stays.
- Migration from v1 shape.

Manual, before calling it done: install to home screen on a phone (or
Chrome's device mode), log a full day (sleep → wake → breast → nap → wake →
bottle 120ml backfilled 15 min), edit an event, reload offline, export and
re-import.

## 9. Out of scope, noted for later

Sync between phones, reminders ("last feed 3h ago"), multiple babies,
diapers, iOS push. None of these change the data model above except sync,
which would add an `updatedAt` per event.

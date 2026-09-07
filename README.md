# TinyLog

One-tap newborn feed and sleep log. Mobile progressive web app, works offline,
data stays on the phone (localStorage).

## Run

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # domain unit tests (vitest)
npm run build      # static site in dist/ with service worker + manifest
npm run preview    # serve dist/ to test the installed PWA
```

Open on a phone (or Chrome device mode), then "Add to Home Screen".

## How it works

The baby is always in one state, derived from the event log:

```
Awake ──Nap / Sleep──▶ Napping / Asleep ──Wake up──▶ Awake
Napping / Asleep ──Breast / Bottle──▶ Awake   (the rest is closed at the feed)
   └─ "Stayed asleep" on that feed joins the sleep back together: a dream feed
Awake ──Breast / Bottle──▶ Awake
Diaper: never changes the state
```

Every big button saves the event at "now" in one tap. A capture panel then
replaces the buttons for 10 seconds with only the fields that matter:
time (−1h / −5 / +5 / +1h, hold to repeat, snapped to 5-minute marks), side
and minutes for breast, ml for bottle (prefilled with the last amount), wet
or dirty for diapers, and the dream-feed switch when the feed interrupted a
sleep. Touching the panel pauses the countdown, so does the screen going
dark; Done closes it; Undo removes the event. Every save and delete shows a
toast with Undo. Tap any row to edit or delete it (delete asks twice).

The home screen shows the last 24 hours rather than the calendar day, so a
night is never split at midnight. Consecutive night sleeps separated only by
feeds collapse into one "Night" row with the number of wakings. A sleep or
nap that runs implausibly long asks whether you forgot to tap Wake up.

Settings hold the baby's name and birth date, and export or import of the
whole log as JSON. Theme follows the system by default; the sun/moon button
overrides it.

Code layout: `src/domain` is pure TypeScript (state machine, stats, time
helpers, unit-tested), `src/store` is the only module that touches
`localStorage`, `src/components` and `src/screens` are the UI.

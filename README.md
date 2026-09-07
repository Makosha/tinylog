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

While awake, the most likely next action gets a full-width hero button:
a feed when the baby's own recent feed interval is nearly up, a nap or
night sleep (by hour) when an age-based wake window is nearly used.

History shows any calendar day with totals, a 7-day sleep or feeds trend,
and that day's timeline. Growth records weight, length and head
circumference and plots them against the WHO Child Growth Standards for
the baby's sex (3rd, 15th, 50th, 85th, 97th percentiles), with the current
percentile per measure. The WHO LMS tables are embedded from the official
expanded tables; regenerate with `python3 scripts/who-lms.py <dir>` after
downloading the six xlsx files from who.int.

Settings hold the baby's name, birth date and sex, and export or import of
the whole log as JSON. Theme follows the system by default; the sun/moon
button overrides it.

Code layout: `src/domain` is pure TypeScript (state machine, stats, growth
maths, next-action heuristic, time helpers, unit-tested), `src/store` is the only module that touches
`localStorage`, `src/components` and `src/screens` are the UI.

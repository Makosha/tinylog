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
   └─ "Stayed asleep" toggle on that feed reopens the rest: a dream feed
Awake ──Breast / Bottle──▶ Awake
```

Every big button saves the event at "now" in one tap. A capture panel then
replaces the buttons for 10 seconds with only the fields that matter for
that event: start time (−1h / −5 / +5 / +1h stepper), side for breast,
amount for feeds, and the dream-feed toggle when the feed interrupted a
sleep. Touching the panel pauses the countdown; Done closes it; Undo removes
the event. Tap any timeline row to edit start, end, source, side, amount, or
delete it.

Theme follows the system by default; the sun/moon button overrides it.

Code layout: `src/domain` is pure TypeScript (state machine, stats, time
helpers, unit-tested), `src/store` is the only module that touches
`localStorage`, `src/components` and `src/screens` are the UI.

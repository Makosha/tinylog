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

Open on a phone, then "Add to Home Screen". The download button in the
header (hidden once installed) shows the steps for Safari, or a real
Install button where the browser offers one.

Deploy to GitHub Pages (https://makosha.github.io/tinylog/):

```sh
npm run deploy
```

## How it works

The baby is always in one state, derived from the event log:

```
Awake ──Nap / Sleep──▶ Napping / Asleep ──Wake up──▶ Awake
Napping / Asleep ──Breast / Bottle──▶ Awake   (the rest is closed at the feed)
   └─ "Stayed asleep" on that feed joins the sleep back together: a dream feed
Awake ──Breast / Bottle──▶ Awake
Other (diaper, temperature, medicine, tummy time, bath, milestone, note): never changes the state
```

Every big button saves the event at "now" in one tap. A capture panel then
replaces the buttons for 10 seconds with only the fields that matter:
time (−1h / −5 / +5 / +1h, hold to repeat, snapped to 5-minute marks), side
and minutes for breast, ml for bottle (prefilled with the last amount), wet
or dirty for diapers, and the dream-feed switch when the feed interrupted a
sleep. For feeds, sleep and wake-ups the panel closes by itself after 10 s
without a touch (any touch restarts the 10 s; the screen going dark pauses
it), with a close control in the header. "Other" events stay open until
Done. Undo removes the event. Every save and delete shows a
toast with Undo. Tap any row to edit or delete it (delete asks twice). Edit
sheets and settings save every change immediately; there is no Save button.

"Other" opens a chooser: diaper (wet / dirty), temperature (°C, fever
marked from 38), medicine (name and optional dose), tummy time, bath,
milestone (first smile, rolled over, ...) and free-text note, plus weight
and height, which open the growth measurement sheet.

The home screen shows the last 24 hours rather than the calendar day, so a
night is never split at midnight. Consecutive night sleeps separated only by
feeds collapse into one "Night" row with the number of wakings. A sleep or
nap that runs implausibly long asks whether you forgot to tap Wake up.

While awake, the most likely next action gets a full-width hero button:
a feed when the baby's own recent feed interval is nearly up, a nap or
night sleep (by hour) when an age-based wake window is nearly used.

History shows any calendar day with totals, a 7-day sleep or feeds trend,
and that day's timeline. Its "Copy log" button puts the last 1, 3, 7 or 14
days on the clipboard as plain text, ready to paste into ChatGPT, Gemini or
a message to the pediatrician. Growth records weight, length and head
circumference and plots them against the WHO Child Growth Standards for
the baby's sex (3rd, 15th, 50th, 85th, 97th percentiles), with the current
percentile per measure. The WHO LMS tables are embedded from the official
expanded tables; regenerate with `python3 scripts/who-lms.py <dir>` after
downloading the six xlsx files from who.int.

Settings hold the baby's name, birth date, sex, and for a preterm baby the
due date, which adds a corrected-age switch to the growth charts. Units (°C/°F, kg/lb·oz, cm/in, ml/fl oz) default from the phone's locale
and can be switched; storage stays metric. A JSON backup can be exported. Theme (System / Light / Dark) is in settings.

Code layout: `src/domain` is pure TypeScript (state machine, stats, growth
maths, next-action heuristic, time helpers, unit-tested), `src/store` is the only module that touches
`localStorage`, `src/components` and `src/screens` are the UI.

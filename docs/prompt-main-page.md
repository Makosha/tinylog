# TinyLog — main page

Build the main page of TinyLog, a mobile progressive web app for logging a
newborn's feeds and sleep. It must work offline, install to the home screen,
and keep all data on the device. This brief covers the main page only. No
history, statistics, settings, accounts, sync, or notifications.

## The one rule for recording

Recording an event takes exactly one action. Nothing is asked before the
event is saved. Every extra detail is optional and costs at most one more
action. If the user does nothing else, the record is still complete and
correct. There is no form, no confirmation, no required field, and no way
for a record to be "unsaved" or "in progress".

## State machine

The baby is always in exactly one state:

- Awake
- Asleep (night sleep)
- Napping (daytime sleep)

The state is never stored. It is derived from the event log: an open sleep
means Asleep, an open nap means Napping, otherwise Awake. There is no
"wake" event; waking closes the open sleep or nap.

Transitions:

| From             | Action           | Result                                                             | To               |
|------------------|------------------|--------------------------------------------------------------------|------------------|
| Awake            | Sleep            | open a sleep at now                                                | Asleep           |
| Awake            | Nap              | open a nap at now                                                  | Napping          |
| Asleep / Napping | Wake up          | close the open rest at now                                         | Awake            |
| Awake            | Breast or Bottle | add a feed at now                                                  | Awake            |
| Asleep / Napping | Breast or Bottle | close the open rest at the feed time, add the feed                 | Awake            |
| Asleep / Napping | Sleep or Nap     | close the open rest at now, open the new one                       | Asleep / Napping |

Only the actions valid in the current state are offered. Awake offers
Sleep, Nap, Breast, Bottle. Asleep and Napping offer Wake up, Breast,
Bottle.

Exception: a feed that interrupted a rest can be marked "stayed asleep".
That reopens the rest so it stays one continuous span with the feed inside
it (a dream feed). Unmarking closes the rest again at the feed time.

Invariants, enforced by the store, never by the user:

- At most one rest is open at any time.
- A rest's end is never before its start.
- Events are ordered by start time.
- Elapsed time in the current state is always computable from the log.

## Events

- Feed: time, source (breast or bottle), optional side for breast (left,
  right, both), optional amount in ml for either source.
- Sleep and Nap: start, optional end. No end means still going.

Time is captured as "now" at the moment of the action. Adjusting a time
afterwards moves in whole steps and lands on 5-minute marks; a time is
never in the future. Adjusting a feed's time also moves the end of the
rest it interrupted. A feed moved to before the rest started leaves the
rest open.

Any event can be edited or deleted after the fact. Deleting the open rest
returns the state to Awake. The most recent action can be undone in one
action; undoing a feed that interrupted a rest reopens the rest.

## What the main page must show

- The current state and how long it has lasted.
- For today: number of feeds and total ml, total rest, time since the last
  feed.
- Today's events, newest first, including an overnight rest that ended
  today. An open rest is marked as still going.

## Persistence and edge cases

- Data lives in local storage; unavailable storage keeps working in
  memory and tells the user once. Corrupt data is set aside, not deleted.
- The app may be opened hours later; elapsed times must be correct on
  return, and while the page is visible they must keep ticking.
- A rest can cross midnight. Its duration counts toward the day it ended.
- Repeated taps of the same action must not create nonsense: a second
  Sleep while asleep replaces the open rest rather than stacking.

## Out of scope

History and trends, export or import, multiple children, growth, diapers,
medicine, reminders, sharing between phones.

# Tanda — a ledger for the rotating savings club

A notebook for a *tanda* — the rotating savings club you already
run. Same institution, different names across Latin America and
beyond: **ROSCA**, *cundina*, *susu*, *sou-sou*. This is the
money one.

## Run it

`python3 -m http.server 8137`
Open http://127.0.0.1:8137/index.html

Track shares, rounds, payouts, notes and the posteo bidding
order for a club you already run. State is in this browser only —
**⤓ Backup** writes it to a file, **↥ Restore** reads one back
(other machine, other browser, or just peace of mind).

Keep several tandas at once: **+ New** starts another club
without touching the ones you have, and the switcher above the
club name flips between them. Restore adds the file's club to
the shelf instead of replacing anything.

Works with no signal: **Add to Home Screen** installs it (app
icon, opens standalone), a service worker keeps the shell in
cache, and the first online visit is enough. **📤 Share** opens
the phone's own share sheet with the round reminder; **⎙ Print**
prints the libreta as paper stationery.

## Files

- `index.html` — ledger shell, field notes, settings
- `styles.css` — ledger aesthetic: bottle-green desk, cream paper
- `app.js` — ledger state, round math, posteo payouts, notes
- `sw.js` — service worker: precaches the shell, caches fonts on first use
- `manifest.webmanifest` + `icon.svg` — install metadata for Add to Home Screen
- `README.md` — this file

Not financial advice. A notebook for a club you're already in.

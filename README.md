# Tanda — two notebooks, one word

A rotating savings club ledger and a milonga running-order planner.
Same Spanish word for a ROSCA round and for a tango set; two very
different kinds of trust.

## Root — the savings ledger

`python3 -m http.server 8137`
Open http://127.0.0.1:8137/index.html

Track shares, rounds, payouts, notes and the posteo bidding order
for a club you already run. State is in this browser only —
**⤓ Backup** writes it to a file, **↥ Restore** reads one back
(other machine, other browser, or just peace of mind).

## /milonga-planner — the dance planner

Open http://127.0.0.1:8137/milonga-planner/
Or serve that folder directly and open its `index.html`.

Compose a night of tango / vals / milonga tandas from a curated
Golden Age catalog. State is in this browser only.

## Files

- `index.html` — savings ledger shell, field notes, settings
- `styles.css` — ledger aesthetic: bottle-green desk, cream paper
- `app.js` — savings ledger state, round math, posteo payouts, notes
- `milonga-planner/index.html` — dance planner shell and field notes
- `milonga-planner/styles.css` — dance-hall poster styling
- `milonga-planner/data.js` — tanda rules, night pattern, catalog
- `milonga-planner/app.js` — planner state, picker, composer, export
- `README.md` — this file

Not financial advice, and not dance advice. Notebooks for things
you're already doing.

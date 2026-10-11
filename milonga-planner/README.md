# Milonga planner

A local-first planner for the dance tanda: four tangos, three
valses (sometimes four), or three milongas, played together and
separated by cortinas.

Run it from the project root with `python3 -m http.server 8137`,
then open http://127.0.0.1:8137/milonga-planner/. Or serve this folder directly and open its `index.html`.

The running order is saved in this browser's `localStorage`. It is
not sent to a server. **⤓ Backup** downloads the night as a JSON
file and **↥ Restore** reads one back, so it can survive a
cleared browser or move to another machine. The same word names a rotating savings club round in the root app
— see ../README.md for that sibling.

Plan a night by adding tango, vals, or milonga tandas and choosing
recordings from the searchable crate. Search by title, orchestra,
singer, or year; sort by energy, year, orchestra, or title. Used
recordings are dimmed, but can be reused.

Compose a 10-tanda classic night shape. The composer balances
familiar orchestras, avoids repeating recordings, favors coherent
tandas, and shapes a warm-up-to-cierre energy arc. Review its
choices in DJ notes.

Replace, remove, and reorder songs; reorder tandas with the controls
or drag their headers. Change tanda style, cycle the cortina, and
remove tandas.

Review notes about missing or extra tracks, orchestra, singer and
year cohesion, catalog caveats, repeated recordings, and the
cierre. The side panels show an energy arc, style mix, song count,
and approximate runtime.

Copy a plain-text running order with recording credits, cortinas,
and runtime, or print a compact, paper-friendly set list. Mark
tanda starts for optional page breaks in long printed running
orders. Reset or clear the night when you want to start over.

`data.js` contains 197 catalog entries with orchestra, singer
(where known), recording year, style, editorial energy,andand occasional DJ caveats. The cited sources and provenance are described in that file and in the app's field notes. Recording durations are planning estimates derived from style and stable track IDs, not discography data. Cortinas are budgeted at 40 seconds. Actual track
length, energy, and suitability vary by recording and floor; use the
notes as prompts for a DJ's judgment, not authoritative rulings.

Files: `index.html` (planner interface and field notes), `styles.css`
(responsive dance-hall poster styling), `data.js` (tanda rules, night
pattern, and curated recording catalog), `app.js` (local state, planner
UI, composer, validation, and export), and `../README.md` (root readme:
this planner and the savings ledger are siblings).

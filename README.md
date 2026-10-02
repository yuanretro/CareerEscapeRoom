# The Last Batch

A six-room, hands-on escape game about becoming a **Micro Electronics Manufacturer** (semiconductor worker) in Ontario.

## Story
It's your first night shift at Nova Semiconductor. A power surge has wiped the last circuit layer of batch NB-7 (heart-monitor chips), and the truck leaves at dawn. Sam Okoro (shift supervisor), Mira Tran (apprenticeship training advisor) and NOVA (the factory system) guide you by radio.

## Rooms
Each room is a real station. A procedure card explains what to do and why; the bench is where you do it. Mistakes explain what went wrong.

**Factory floor (tech only)**
1. **Gowning room:** lock away personal items, gown up top-down with gloves last, run the air shower, then flag rule breaks on the bay cameras.
2. **Litho bay:** pick each lithography tool in the right order, then run it: clean, spin-coat at the target speed, align the mask and expose, develop, etch to the endpoint signal, strip.
3. **Probe & dicing:** work out the pass band with Ohm's law, probe the wafer and ink the bad chips, dice along the streets, pick the good dies.
4. **Final inspection:** measure parts with a caliper, scan them for cracks under a microscope, sort them into PASS and REJECT bins.

**Training office (career only)**

5. **Training office:** ask Mira about the trade, build an application folder, tick off the skills you practised in your logbook.
6. **Career planner:** map the route from high school to the Certificate of Apprenticeship (avoiding the trap stops), then pick your next moves.

**Final: Line control.** Five alarms hit the line. Find the station causing each one, then choose the fix.

Readings, specs, layouts, offsets and alarms are randomized every game.

## Run it
- **On a PC:** double-click `index.html`. No install or server needed.
- **On a web server:** upload `index.html`, `css/` and `js/` to any static host. `The-Last-Batch.html` redirects to `index.html`.

Fonts load from Google Fonts when online. Offline, the game falls back to system fonts.

## Files
- `js/content.js`: rooms, procedure cards, story, career facts and the per-game random mix
- `js/tasks.js`: the hands-on stations
- `js/game.js`: screens, story playback, notebook, Google Form code exchange
- `js/art.js`: portraits, gowning avatar, camera frames, floor plan
- `css/style.css`: styles
- `img/`: optional real photos (see `img/README.md`); missing photos fall back to drawings

The Google Form link is set in `DEFAULT_FORM_URL` at the top of `js/game.js`. Room codes (`NOVA-…`) and return codes (`GATE-…`, `BATCH-SAVED`) are unchanged.

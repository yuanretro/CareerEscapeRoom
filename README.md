# The Last Batch

A six-room, hands-on escape game about becoming a **Micro Electronics Manufacturer** (semiconductor worker) in Ontario.

## Story
You're the new co-op student on the night shift at Nova Semiconductor. A mysterious power surge has wiped the last circuit layer of batch NB-7 (heart-monitor chips), and the truck leaves in 25 minutes. Sam Okoro (shift supervisor), Mira Tran (apprenticeship training advisor) and NOVA (the slightly sassy factory system) guide you by radio.

Along the way you pick your own replies in some radio messages, Sam, Mira and NOVA react to the stars you earn, each door screen teases what comes next, and NOVA slowly investigates the surge. Your guess about its cause in Room 4 comes back in the ending.

## Rooms
Each room is a real station, built for Grade 10 students:

- **Learn card** before every step: a few plain-language points and a “Did you know?” fact.
- **Blue instruction banner** above the workbench that always says exactly what to do next.
- **💡 Hint button** that makes the right thing glow. Hints also appear automatically after two mistakes in a row.
- **Instant feedback** on every click, explaining why it was right or wrong.
- **Stars, confetti and sound effects** (🔊 button in the top bar), plus a “What you just learned” card after each step. Every machine has its own synthesized sound: rinse, spin-coater motor, UV flash, developer bubbles, plasma buzz, dicing saw, vacuum pen, caliper beep, alarms and more.

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
- **On a web server:** upload `index.html`, `css/`, `js/`, `img/` and `bgm/` to any static host. `The-Last-Batch.html` redirects to `index.html`.

### Background music
Put music files in the `bgm/` folder, named `bgm1.mp3`, `bgm2.mp3`, `bgm3.mp3`, … with no gaps in the numbers. They play in order, and after the last one the list starts again from `bgm1.mp3`. Music is on by default and starts after the player's first click or key press (browsers block autoplay). The 🎵 button in the top bar turns it off, and the choice is remembered in that browser. While a sound effect plays or a machine is running, the music drops to a low volume so the machine sounds come through, then fades back up. With no `bgm1.mp3`, the game simply plays without music.

Fonts load from Google Fonts when online. Offline, the game falls back to system fonts.

## Files
- `js/content.js`: rooms, procedure cards, story, career facts and the per-game random mix
- `js/tasks.js`: the hands-on stations
- `js/game.js`: screens, story playback, notebook, Google Form code exchange
- `js/art.js`: portraits, gowning avatar, camera frames, floor plan
- `css/style.css`: styles
- `bgm/`: background music (`bgm1.mp3`, `bgm2.mp3`, …)
- `img/`: optional real photos (see `img/README.md`); missing photos fall back to drawings

The Google Form link is set in `DEFAULT_FORM_URL` at the top of `js/game.js`. Room codes (`NOVA-…`) and return codes (`GATE-…`, `BATCH-SAVED`) are unchanged.

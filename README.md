# The Last Batch

A six-room escape game about becoming a **Micro Electronics Manufacturer** (semiconductor worker) in Ontario.

## Room layout
- **Rooms 1–4 · Factory floor (tech only):** chip parts, cleanroom rules, manufacturing process, inspection. Clues are unlocked by a lab walkthrough, microscope scan, word decoder or rover maze.
- **Rooms 5–6 · Training office (career only):** Ontario qualifications, then the step-by-step pathway into the trade. Clues are unlocked by a mentor chat or a myth-or-fact quiz.

## Story
A power surge locks the Nova Semiconductor factory on your first night shift. Batch NB-7 (heart-monitor chips) must ship by dawn. Sam Okoro (shift supervisor), Mira Tran (apprenticeship training advisor) and NOVA (the factory system) guide you through radio messages. The story text is in `STORY` in `js/content.js`, and the portraits and clue-file figures are in `js/scene.js`.

## Run it
- **On a PC:** double-click `index.html`. No install or server needed.
- **On a web server:** upload the whole folder (`index.html`, `css/`, `js/`) to any static HTML host. `The-Last-Batch.html` redirects to `index.html` so old links keep working.

Fonts load from Google Fonts when online. Offline, the game falls back to system fonts.

## Files
- `js/content.js` – career facts, question pools, puzzle data and the per-game random mix
- `js/game.js` – screens, discovery modes, puzzles, Google Form code exchange
- `js/arcade.js` – canvas mini-games (challenges, maze, final boss, hint game)
- `js/scene.js` – lab scene and camera artwork
- `css/style.css` – styles

The Google Form link is set in `DEFAULT_FORM_URL` at the top of `js/game.js` (currently https://forms.gle/tY4uzBWDxj7RLszAA). Room codes (`NOVA-…`) and return codes (`GATE-…`, `BATCH-SAVED`) are unchanged.

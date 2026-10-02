# The Last Batch

A six-room escape game about becoming a **Micro Electronics Manufacturer** (semiconductor worker) in Ontario.

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

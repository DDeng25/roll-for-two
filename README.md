# A Roll for Two — Prototype

A standalone, responsive first-version recreation of the darkroom / film-memory experience at:

`https://roll.giadaserena.top/r/4ccf1ac2/`

## Public site

- Live site: `https://ddeng25.github.io/roll-for-two/`
- GitHub repository: `https://github.com/DDeng25/roll-for-two`
- Deployment: GitHub Actions + GitHub Pages

## Run locally

```powershell
cd "C:\Users\17042\Documents\ChatGPT\DD\projects\roll-for-two-prototype"
python -m http.server 4187 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4187/`.

## Included interactions

- Opening film strip with continuous vertical travel, projector glow, grain, dust, vignette, and pointer parallax.
- Aperture-style settings control with motion, grain, generated projector sound, volume, and EN/中文 controls.
- Darkroom cord that can be pulled down to illuminate the room.
- Typewritten radio copy, hanging color negatives, warm tungsten light, and film title block.
- Photo envelope with a real pointer-drag tear interaction; opening the envelope reveals and types the letter.
- Horizontally draggable contact sheet with click-to-enlarge photos.
- Selectable film canisters with changing roll copy and photo previews.
- Responsive layouts for desktop and narrow mobile screens.

## Updating the live site

Make changes in the local project directory, then commit and push to the `main` branch. The workflow in `.github/workflows/deploy-pages.yml` automatically publishes the updated site.

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

## Research notes

The live reference was opened in the in-app browser. The following public pages/resources were actually observed or read:

- `/r/4ccf1ac2/`
- `opening.html`
- `frame-c.html` (darkroom)
- `frame-e.html` (envelope)
- `rolls.html` (three-dimensional canister selection)
- `tray.html` (lightbox/photo selection)
- `torch-comic.html` (comic-panel flashlight scene)
- `book-cover.html` (interactive 3D book)
- `credits.html`
- Public `content.js` for labels and narrative structure

Interactions exercised in the reference:

- Clicked the red hand-drawn opening action and observed the iris transition.
- Clicked the darkroom cord and observed the light/radio reveal.
- Opened the settings menu and selected a clarity option.
- Scrolled after the radio segment and observed the pan into the envelope scene.
- Dragged the envelope tear strip and observed the strip peel, letter slide, and typewriter reveal.
- Selected a roll in the four-canister scene.
- Viewed the contact sheet/photo selection and comic flashlight scenes at desktop dimensions.
- Reloaded the heavier 3D scenes. The book scene stayed black for a long loading period while its WebGL resources initialized; no interaction beyond the title and hidden title field was visible in that state.

The prototype intentionally does not reuse the reference site's personal photography. It uses local grayscale demo photos from Lorem Picsum for layout and interaction prototyping. The 3D models, audio recording, and complex per-frame photo-viewer logic from the reference are represented with lighter-weight CSS/Web Audio interactions in this first version.

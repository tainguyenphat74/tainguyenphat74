# Little Harvest

A standalone 3D farm game. Plant, water, and harvest six crops to earn 60 coins;
keep farming after completing the goal. Six beds, free seeds and water, and
12-second crop growth.

Serve this directory with `python3 -m http.server 8000` and open
`http://localhost:8000`. No build or CDN is required. JavaScript and WebGL are
required; unsupported browsers show a reloadable explanation. Run `npm test`.

- Select **Bed 1–6** or click/tap a bed to walk beside it. Use **F** while the
  scene is focused, or the action button, to plant, water, and harvest.
- **WASD / arrows** move while the scene is focused; click/tap ground to walk.
  Buildings, fences, tree trunks, and the pond block movement.
- Drag to orbit, scroll/pinch or **+ / −** to zoom, **⌂** to reset the camera.
- **Help** opens a native dialog; **Escape** closes it. Movement stops on help,
  control focus, window blur, and hidden tabs.
- **New season** immediately resets crops, harvests, and coins.

Progress uses validated, versioned localStorage in this browser only. No cloud
sync or multiplayer. Storage failures show a notice; progress then lasts only
for the session. Watered crops grow while away using the device clock. Invalid
or future-dated saves reset safely. One crop variety and flat navigation.

Three.js is vendored with its MIT license in `vendor/`. Grass materials and
CC0 source credits are preserved in `assets/materials/README.md`. Reduced motion,
30 FPS rendering, capped DPR, and cached scenery shadows limit rendering work.

QA: `window.__farm.ready`, `.snapshot()`, and `.project({x,z,y})` expose state
copies and screen coordinates without teleportation or progress injection.

The game is hosted at https://tainguyenphat.com, replacing the former portfolio.
`sitemap.xml` lists the game homepage.

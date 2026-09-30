## Hi, I'm Tai Nguyen Phat 👋

Software Engineer with 4+ years of experience building and shipping SaaS products from idea to production.

### Current products

- 💭 [FeedbackFun](https://feedbackfun.com) — A native feedback widget that lets users chat, request features, report bugs, and view a roadmap directly on your site.
- 🗣️ [Echoling](https://echoling-eosin.vercel.app) — Learn a language by echoing real YouTube speech, with shadowing practice and spaced repetition.
- 📘 [SpecViewer](https://specviewer.app) — Explore and visualize OpenAPI specs in one place — no backend, login, or setup required.

### Earlier experiments

- 🧠 [MyndMap](https://myndmap.vercel.app) — Generate, organize, and share AI-powered mind maps.
- 🎧 [ListenFast](https://listenfast.vercel.app) — Practice listening skills with real YouTube conversations and interactive dictation.

### 🤝 Connect With Me

I'm always open to discussing new ideas, collaborations, or opportunities.

- 🌐 Homepage: [tainguyenphat.com](https://tainguyenphat.com)
- 💼 LinkedIn: [Tai Nguyen Phat](https://www.linkedin.com/in/tainguyenphat74)
- 📧 Email: nguyentai2760@gmail.com

Feel free to reach out if you want to collaborate, ask questions, or just connect!

### Maker island homepage

A fullscreen Three.js world built from original low-poly geometry. No build step:
serve with `python3 -m http.server 8000` and open `http://localhost:8000`.
`npm test` runs pure world-space movement, routing, camera/input lifecycle and
existing view-counter/API tests. Motion tests need no DOM or WebGL.

- Focus the island, then WASD / arrows to walk; tap grass to route around obstacles.
- Select a building or its label to walk to its door and open its project.
- E / Enter near a door opens the project; Escape closes dialogs.
- Drag to orbit, scroll / pinch or use + / − to zoom; home resets the camera.
- Project directory opens directly; Say hello contains email and social links.

Movement stops on blur, hidden tabs, control focus and dialogs. Reduced motion
removes limb and ocean/boat animation. Static project links remain available without
JavaScript or WebGL; context loss shows the directory. The dock is decorative and
walking stays on grass. The `/api/views` endpoint is unchanged and hides its count
when unavailable on a local static server.

Three.js 0.186.1 is served from `vendor/three.module.js` and `three.core.js`, with
its MIT license alongside. To update, copy these two files and LICENSE from the
installed package; no bare browser imports, CDN or node_modules runtime requests.
DPR is capped at 1.7, shadows at 1024px, and static geometry is batched by material.

Rendering is capped at 30 FPS, pauses behind project dialogs, and stays idle when
reduced-motion mode has no scene changes.

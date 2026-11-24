# RZER Performance website

Gloss-black website for Rzer, a Singapore car tuning workshop. The hero is a realistic film: a black liquid droplet in an underground car park becomes the client's silver Evo IX under a showroom spotlight, with the engine firing as the headlights come on, a rev, the blow-off valve and pops and bangs, then the RZER Performance logo draws in over its final frame. Below it, scroll scenes move around a shader-drawn 3D Evo, and a parts configurator lets visitors build their own. The page's own code is inlined into one HTML file, with the hero media next to it. A separate full-screen preview shows a photoreal real-time 3D Evo IX (three.js, CC BY 4.0 model by 3DCars4U).

```bash
npm run build   # writes dist/index.html and dist/assets/
npm run dev     # rebuilds on change
```

Open `dist/index.html`, or serve `dist/` (for example `python3 -m http.server -d dist`). Add `#build` to the address for the configurator. The full-screen 3D preview at `/showroom/` needs HTTP.

See `CLAUDE.md` for the architecture, performance rules and how to add parts, and `assets/generated/README.md` for how the hero film was generated.

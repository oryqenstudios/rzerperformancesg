# RZER Performance website

Gloss-black website for Rzer, a Singapore car tuning workshop. The hero is a realistic film: a black liquid droplet in an underground car park becomes the client's silver Evo IX under a showroom spotlight, with the engine firing as the headlights come on, a rev, the blow-off valve and pops and bangs, then the RZER Performance logo draws in over its final frame. Below it, scroll scenes move around a real-time 3D Evo IX (three.js, CC BY 4.0 model by 3DCars4U) in a neutral studio on a plain background, with an x-ray view of what's under the skin, and a parts configurator lets visitors build their own on the same car: paint, wheel finish, calipers, carbon panels, splitter, skirts, diffuser, wing, ride height, exhaust tips, tint and lights. The page's own code is inlined into one HTML file, with the hero media, the 3D car and a vendored copy of three.js next to it.

```bash
npm run build   # writes dist/index.html and dist/assets/
npm run dev     # rebuilds on change
```

Serve `dist/` (for example `python3 -m http.server -d dist`) and open it in a browser. Add `#build` to the address for the configurator, or open `/showroom/` for a full-screen 3D preview. Opened straight from disk, the page falls back to an older shader-drawn car, because module scripts need HTTP.

See `CLAUDE.md` for the architecture, performance rules and how to add parts, and `assets/generated/README.md` for how the hero film was generated.

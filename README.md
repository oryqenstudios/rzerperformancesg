# RZER Performance website

Gloss-black website for Rzer, a Singapore car tuning workshop. The hero is a realistic film: a black liquid droplet in an underground car park becomes the client's silver Evo IX under a showroom spotlight, then the RZER Performance logo draws in and the film hands over to a photoreal real-time 3D Evo IX (three.js, CC BY 4.0 model by 3DCars4U). Below it, scroll scenes move around a shader-drawn 3D Evo, and a parts configurator lets visitors build their own. The page's own code is inlined into one HTML file; the hero media, the 3D model and a vendored copy of three.js sit next to it.

```bash
npm run build   # writes dist/index.html and dist/assets/
npm run dev     # rebuilds on change
```

Serve `dist/` (for example `python3 -m http.server -d dist`) and open it in a browser: the hero's photoreal 3D Evo needs HTTP; from disk it falls back to a still. Add `#build` to the address for the configurator, or open `/showroom/` for a full-screen 3D preview.

See `CLAUDE.md` for the architecture, performance rules and how to add parts, and `assets/generated/README.md` for how the hero film was generated.

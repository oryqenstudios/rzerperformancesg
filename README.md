# RZER Performance website

Gloss-black website for Rzer, a Singapore car tuning workshop. The hero is a realistic film: a black liquid droplet in an underground car park becomes the client's silver Evo IX under a showroom spotlight, then the RZER Performance logo draws in. Below it, scroll scenes move around a real-time 3D Evo, and a parts configurator lets visitors build their own. The page is one HTML file with no libraries, plus the hero media in `assets/`.

```bash
npm run build   # writes dist/index.html and dist/assets/
npm run dev     # rebuilds on change
```

Open `dist/index.html` in a browser. Add `#build` to the address to go straight to the configurator.

See `CLAUDE.md` for the architecture, performance rules and how to add parts, and `assets/generated/README.md` for how the hero film was generated.

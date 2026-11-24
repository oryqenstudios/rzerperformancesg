#!/usr/bin/env bash
# Put the hero film's sound (tools/make-hero-audio.py) into the web films, keeping the video streams as they are.
#   tools/mux-hero-audio.sh            # synthesises the sound, then muxes it
#   tools/mux-hero-audio.sh some.wav   # muxes a sound file you made elsewhere (any length; it is cut to the film)
# Run it again after tools/assemble-film.py re-encodes the films (that writes them without sound).
set -euo pipefail
cd "$(dirname "$0")/.."
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
wav=${1:-}
if [ -z "$wav" ]; then
  wav="$work/hero-audio.wav"
  python3 tools/make-hero-audio.py "$wav"
fi
for f in assets/site/hero-intro.mp4 assets/site/hero-intro.webm; do
  case "$f" in
    *.mp4)  codec=(-c:a aac -b:a 160k -movflags +faststart) ;;
    *.webm) codec=(-c:a libopus -b:a 128k) ;;
  esac
  out="$work/$(basename "$f")"
  ffmpeg -v error -y -i "$f" -i "$wav" -map 0:v:0 -map 1:a:0 -c:v copy "${codec[@]}" -shortest "$out"
  mv "$out" "$f"
  echo "muxed $f ($(du -k "$f" | cut -f1) KB)"
done

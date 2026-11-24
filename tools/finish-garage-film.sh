#!/usr/bin/env bash
# Build the shipped hero film from its generated parts and encode the web files.
#
#   tools/finish-garage-film.sh
#
# 1. The build-up (black liquid -> dome -> radiating rods -> chassis frame -> rolling chassis -> cabin -> black car),
#    following the client's reference video beat for beat: Kling O3 first-last-frame clips between generated keyframes
#    in the tuning garage (assets/generated/shots/build-*), laid onto the reference's timeline by
#    tools/assemble-build.py per assets/generated/build-plan.json. It ends on the black liquid car head-on and centred
#    with its headlights off (assets/generated/garage-cut.jpg).
# 2. assets/generated/shots/carbon-cure.mp4: Kling O3 first-last-frame (tools/higgsfield-flf.sh) from garage-cut.jpg
#    to assets/generated/carbon-final.jpg: the headlights snap on and the liquid cures into carbon fibre, camera locked.
# They join with a hard cut: tools/join-cure.py steers the build-up's last second onto the cure clip's framing and
# steadies the clip's first frames, which lurch about 1% closer before it holds still.
# Writes assets/site/hero-intro.mp4/.webm (no sound: run tools/mux-hero-audio.sh next), hero-poster.jpg, hero-final.jpg.
set -euo pipefail
cd "$(dirname "$0")/.."
gen=assets/generated site=assets/site
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
python3 tools/assemble-build.py "$gen/build-plan.json" "$work/build.mp4"
n=$(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "$work/build.mp4")
python3 tools/join-cure.py "$work/build.mp4" "$gen/shots/carbon-cure.mp4" 0 "$n" "$work/master.mp4"
ffmpeg -v error -y -i "$work/master.mp4" -an -c:v libx264 -preset slow -crf 24 -maxrate 2800k -bufsize 5600k -movflags +faststart "$site/hero-intro.mp4"
ffmpeg -v error -y -i "$work/master.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -deadline good -cpu-used 2 "$site/hero-intro.webm"
ffmpeg -v error -y -i "$work/master.mp4" -frames:v 1 -q:v 3 "$site/hero-poster.jpg"
# the final still: the 2K end frame the film lands on (sharper than the film; about 1.3% apart per pixel once blurred)
python3 -I -c "from PIL import Image; Image.open('$gen/carbon-final.jpg').convert('RGB').resize((2048, 1152), Image.LANCZOS).save('$site/hero-final.jpg', quality=88)"
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -show_entries format=duration -of default=nw=1 "$site/hero-intro.mp4"

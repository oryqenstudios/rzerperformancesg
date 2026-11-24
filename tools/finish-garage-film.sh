#!/usr/bin/env bash
# Build the shipped hero film from its two generated parts and encode the web files.
#
#   tools/finish-garage-film.sh
#
# 1. assets/generated/shots/garage-film.mp4: the original film (tools/assemble-film.py) moved into the tuning
#    garage by Seedance 2.5 video-edit (tools/higgsfield-v2v.sh). Used up to frame CUT (8.833 s), where the black
#    liquid car stands head-on and centred with its headlights off (that frame is assets/generated/garage-cut.jpg).
# 2. assets/generated/shots/carbon-cure.mp4: Kling O3 first-last-frame (tools/higgsfield-flf.sh) from garage-cut.jpg
#    to assets/generated/carbon-final.jpg: the headlights snap on and the liquid cures into carbon fibre, camera locked.
# The two overlap by XF frames with a dissolve, which hides the small jolt on the clip's first frames.
# Writes assets/site/hero-intro.mp4/.webm (no sound: run tools/mux-hero-audio.sh next), hero-poster.jpg, hero-final.jpg.
set -euo pipefail
cd "$(dirname "$0")/.."
CUT=212   # garage-film frame that the cure clip starts on
XF=6      # dissolve length in frames (24 fps)
gen=assets/generated site=assets/site
work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
a_len=$(python3 -c "print(($CUT + $XF) / 24)")
offset=$(python3 -c "print($CUT / 24)")
ffmpeg -v error -y -i "$gen/shots/garage-film.mp4" -i "$gen/shots/carbon-cure.mp4" -filter_complex "
  [0:v]trim=end_frame=$((CUT + XF)),setpts=PTS-STARTPTS,fps=24,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[a];
  [1:v]fps=24,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[b];
  [a][b]xfade=transition=fade:duration=$(python3 -c "print($XF / 24)"):offset=$offset,format=yuv420p[v]" \
  -map '[v]' -an -c:v libx264 -crf 12 -preset slow "$work/master.mp4"
ffmpeg -v error -y -i "$work/master.mp4" -an -c:v libx264 -preset slow -crf 24 -maxrate 2800k -bufsize 5600k -movflags +faststart "$site/hero-intro.mp4"
ffmpeg -v error -y -i "$work/master.mp4" -an -c:v libvpx-vp9 -b:v 0 -crf 35 -row-mt 1 -deadline good -cpu-used 2 "$site/hero-intro.webm"
ffmpeg -v error -y -i "$work/master.mp4" -frames:v 1 -q:v 3 "$site/hero-poster.jpg"
# the final still: the 2K end frame the film lands on (sharper than the film; about 1.3% apart per pixel once blurred)
python3 -I -c "from PIL import Image; Image.open('$gen/carbon-final.jpg').convert('RGB').resize((2048, 1152), Image.LANCZOS).save('$site/hero-final.jpg', quality=88)"
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -show_entries format=duration -of default=nw=1 "$site/hero-intro.mp4"

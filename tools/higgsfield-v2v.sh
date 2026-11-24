#!/usr/bin/env bash
# Edit a whole video with Seedance 2.5 video-edit (Higgsfield): keep its motion and timing, change what the prompt
# asks for, guided by a reference image.
#
#   tools/higgsfield-v2v.sh <video.mp4> <reference_image> <prompt_file> <name> [out_dir]
#
# Writes <out_dir>/<name>.mp4 (out_dir defaults to assets/generated/shots), 1080p, without generated audio
# (the hero's sound is added afterwards by tools/mux-hero-audio.sh).
# Auth: in the Claude Code cloud session the proxy adds the key. Elsewhere set HF_KEY="<key id>:<key secret>".
set -euo pipefail
video="$1"; img="$2"; promptf="$3"; name="$4"; out="${5:-assets/generated/shots}"
api=https://api.higgsfield.ai
auth=(); [ -n "${HF_KEY:-}" ] && auth=(-H "Authorization: Key $HF_KEY")
work=$(mktemp -d); trap 'rm -r "$work"' EXIT
mkdir -p "$out"
field() { python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$@"; }
upload() {   # file content-type -> public url
  curl -sS -m 30 "${auth[@]}" -X POST -H 'Content-Type: application/json' --data "{\"content_type\":\"$2\"}" \
    "$api/files/generate-upload-url" > "$work/upload.json"
  curl -sS -m 300 -X PUT -H "Content-Type: $2" -H 'x-amz-tagging: retention=temporary' \
    --data-binary @"$1" "$(field "$work/upload.json" upload_url)" > /dev/null
  field "$work/upload.json" public_url
}

# 1. upload the source film (sound stripped) and the reference image
ffmpeg -v error -y -i "$video" -an -c:v copy -movflags +faststart "$work/src.mp4"
python3 -I -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=95)" "$img" "$work/ref.jpg"
video_url=$(upload "$work/src.mp4" video/mp4)
image_url=$(upload "$work/ref.jpg" image/jpeg)

# 2. submit
python3 -I -c "
import json, sys
print(json.dumps({'prompt': open(sys.argv[1]).read().strip(), 'video_url': sys.argv[2], 'image_urls': [sys.argv[3]],
                  'resolution': '1080p', 'generate_audio': False}))
" "$promptf" "$video_url" "$image_url" > "$work/req.json"
curl -sS -m 60 "${auth[@]}" -X POST -H 'Content-Type: application/json' -H "Idempotency-Key: rzer-$name-$(date +%s)" \
  --data @"$work/req.json" "$api/bytedance/seedance-2.5/video-edit" > "$work/submit.json"
status_url=$(field "$work/submit.json" status_url)

# 3. poll and download
delay=4
while :; do
  curl -sS -m 30 "${auth[@]}" "$status_url" > "$work/status.json"
  status=$(field "$work/status.json" status)
  echo "$name: $status"
  case "$status" in
    completed) break ;;
    failed|nsfw|canceled) cat "$work/status.json"; exit 1 ;;
  esac
  sleep "$delay"; delay=$(( delay * 3 / 2 > 15 ? 15 : delay * 3 / 2 ))
done
curl -sS -m 600 -o "$out/$name.mp4" "$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['video']['url'])" "$work/status.json")"
echo "saved $out/$name.mp4"

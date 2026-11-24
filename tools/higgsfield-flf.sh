#!/usr/bin/env bash
# Generate a clip between two given frames with Kling O3 (or Kling Omni) first-last-frame (Higgsfield).
#
#   [MODEL=omni] tools/higgsfield-flf.sh <first_image> <last_image> <prompt_file> <duration> <name> [out_dir]
#
# Writes <out_dir>/<name>.mp4 (out_dir defaults to assets/generated/shots): 16:9, pro mode, no generated sound
# (the hero's sound is added afterwards by tools/mux-hero-audio.sh). Kling O3 takes whole seconds (5 or 10).
# Auth: in the Claude Code cloud session the proxy adds the key. Elsewhere set HF_KEY="<key id>:<key secret>".
set -euo pipefail
first="$1"; last="$2"; promptf="$3"; dur="$4"; name="$5"; out="${6:-assets/generated/shots}"
api=https://api.higgsfield.ai
auth=(); [ -n "${HF_KEY:-}" ] && auth=(-H "Authorization: Key $HF_KEY")
work=$(mktemp -d); trap 'rm -r "$work"' EXIT
mkdir -p "$out"
field() { python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$@"; }
upload() {   # image -> public url
  python3 -I -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=95)" "$1" "$work/up.jpg"
  curl -sS -m 30 "${auth[@]}" -X POST -H 'Content-Type: application/json' --data '{"content_type":"image/jpeg"}' \
    "$api/files/generate-upload-url" > "$work/upload.json"
  curl -sS -m 120 -X PUT -H 'Content-Type: image/jpeg' -H 'x-amz-tagging: retention=temporary' \
    --data-binary @"$work/up.jpg" "$(field "$work/upload.json" upload_url)" > /dev/null
  field "$work/upload.json" public_url
}

# 1. upload both frames
first_url=$(upload "$first")
last_url=$(upload "$last")

# 2. submit
model=${MODEL:-o3}   # o3 or omni (Omni has no sound option)
python3 -I -c "
import json, sys
req = {'prompt': open(sys.argv[1]).read().strip(), 'first_frame_url': sys.argv[2], 'last_frame_url': sys.argv[3],
       'duration': int(sys.argv[4]), 'mode': 'pro', 'aspect_ratio': '16:9'}
if sys.argv[5] == 'o3':
    req['sound'] = 'off'
print(json.dumps(req))
" "$promptf" "$first_url" "$last_url" "$dur" "$model" > "$work/req.json"
curl -sS -m 60 "${auth[@]}" -X POST -H 'Content-Type: application/json' -H "Idempotency-Key: rzer-$name-$(date +%s)" \
  --data @"$work/req.json" "$api/kling-video/$model/first-last-frame" > "$work/submit.json"
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

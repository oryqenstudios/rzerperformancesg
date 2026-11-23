#!/usr/bin/env bash
# Generate one hero film segment with Higgsfield image-to-video and pull its last frame.
#
#   tools/higgsfield-i2v.sh <kling|hailuo> <start_image> <prompt_file> <duration> <name> [out_dir]
#
# Writes <out_dir>/<name>.mp4 and <out_dir>/<name>-last.png (out_dir defaults to assets/generated/shots).
# The segments are generated backwards: the first call starts from the final still, and each next call
# starts from the previous segment's -last.png. tools/assemble-film.py reverses and joins them.
#
# Auth: in the Claude Code cloud session the proxy adds the key. Elsewhere set HF_KEY="<key id>:<key secret>".
# Kling 2.5 Turbo Pro takes 5 or 10 s (1920x1080); Hailuo 2.3 takes 6 or 10 s (1364x768).
set -euo pipefail
model="$1"; img="$2"; promptf="$3"; dur="$4"; name="$5"; out="${6:-assets/generated/shots}"
api=https://api.higgsfield.ai
auth=(); [ -n "${HF_KEY:-}" ] && auth=(-H "Authorization: Key $HF_KEY")
work=$(mktemp -d); trap 'rm -r "$work"' EXIT
mkdir -p "$out"

# 1. upload the start frame
python3 -I -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=93)" "$img" "$work/start.jpg"
curl -sS -m 30 "${auth[@]}" -X POST -H 'Content-Type: application/json' --data '{"content_type":"image/jpeg"}' \
  "$api/files/generate-upload-url" > "$work/upload.json"
field() { python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$@"; }
curl -sS -m 120 -X PUT -H 'Content-Type: image/jpeg' -H 'x-amz-tagging: retention=temporary' \
  --data-binary @"$work/start.jpg" "$(field "$work/upload.json" upload_url)" > /dev/null

# 2. submit
python3 - "$model" "$(field "$work/upload.json" public_url)" "$promptf" "$dur" > "$work/req.json" <<'EOF'
import json, sys
model, url, pf, dur = sys.argv[1:]
body = {"prompt": open(pf).read().strip(), "image_url": url, "duration": int(dur)}
if model == 'kling':
    body.update(cfg_scale=0.6, negative_prompt="cartoon, low detail, text, watermark, people, extra cars, scene cut, shaky camera")
else:
    body.update(prompt_optimizer=True)
print(json.dumps(body))
EOF
if [ "$model" = kling ]; then path=kling-video/v2.5-turbo/pro/image-to-video; else path=minimax/hailuo-2.3/standard/image-to-video; fi
curl -sS -m 60 "${auth[@]}" -X POST -H 'Content-Type: application/json' -H "Idempotency-Key: rzer-$name-$(date +%s)" \
  --data @"$work/req.json" "$api/$path" > "$work/submit.json"
status_url=$(field "$work/submit.json" status_url)

# 3. poll (2 s, x1.5, capped at 10 s) and download
delay=2
while :; do
  curl -sS -m 30 "${auth[@]}" "$status_url" > "$work/status.json"
  status=$(field "$work/status.json" status)
  echo "$name: $status"
  case "$status" in
    completed) break ;;
    failed|nsfw|canceled) cat "$work/status.json"; exit 1 ;;
  esac
  sleep "$delay"; delay=$(( delay * 3 / 2 > 10 ? 10 : delay * 3 / 2 ))
done
curl -sS -m 300 -o "$out/$name.mp4" "$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['video']['url'])" "$work/status.json")"
ffmpeg -v error -y -sseof -0.08 -i "$out/$name.mp4" -frames:v 1 "$out/$name-last.png"
echo "saved $out/$name.mp4 and $name-last.png"

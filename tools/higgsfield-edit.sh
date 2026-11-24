#!/usr/bin/env bash
# Edit an image with a Higgsfield image-edit model: keep what the prompt says to keep, change the rest.
#
#   tools/higgsfield-edit.sh <model> <image>[,<image2>,...] <prompt_file> <name> [out_dir]
#   model: seedream (Seedream 5.0 Pro edit, 2k) or kling (Kling Image 4.0 edit, 2k); 16:9 output
#   Several images are passed in order; the prompt calls them image 1, image 2, ...
#
# Writes <out_dir>/<name>.png (out_dir defaults to assets/generated/shots).
# Auth: in the Claude Code cloud session the proxy adds the key. Elsewhere set HF_KEY="<key id>:<key secret>".
set -euo pipefail
model="$1"; imgs="$2"; promptf="$3"; name="$4"; out="${5:-assets/generated/shots}"
api=https://api.higgsfield.ai
auth=(); [ -n "${HF_KEY:-}" ] && auth=(-H "Authorization: Key $HF_KEY")
work=$(mktemp -d); trap 'rm -r "$work"' EXIT
mkdir -p "$out"
field() { python3 -c "import json,sys; print(json.load(open(sys.argv[1]))[sys.argv[2]])" "$@"; }

# 1. upload the reference images
urls=()
IFS=, read -ra list <<< "$imgs"
for i in "${!list[@]}"; do
  python3 -I -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2], quality=95)" "${list[$i]}" "$work/ref$i.jpg"
  curl -sS -m 30 "${auth[@]}" -X POST -H 'Content-Type: application/json' --data '{"content_type":"image/jpeg"}' \
    "$api/files/generate-upload-url" > "$work/upload.json"
  curl -sS -m 120 -X PUT -H 'Content-Type: image/jpeg' -H 'x-amz-tagging: retention=temporary' \
    --data-binary @"$work/ref$i.jpg" "$(field "$work/upload.json" upload_url)" > /dev/null
  urls+=("$(field "$work/upload.json" public_url)")
done

# 2. submit
case "$model" in
  seedream) path=bytedance/seedream/v5.0/pro/edit ;;
  kling) path=kling-image/v4.0/edit ;;
  *) echo "unknown model $model" >&2; exit 1 ;;
esac
python3 -I -c "
import json, sys
print(json.dumps({'prompt': open(sys.argv[1]).read().strip(), 'image_urls': sys.argv[2:], 'aspect_ratio': '16:9', 'resolution': '2k'}))
" "$promptf" "${urls[@]}" > "$work/req.json"
curl -sS -m 60 "${auth[@]}" -X POST -H 'Content-Type: application/json' -H "Idempotency-Key: rzer-$name-$(date +%s)" \
  --data @"$work/req.json" "$api/$path" > "$work/submit.json"
status_url=$(field "$work/submit.json" status_url)

# 3. poll and download
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
url=$(python3 -c "
import json, sys
d = json.load(open(sys.argv[1]))
imgs = d.get('images') or [d.get('image')]
print(imgs[0]['url'])" "$work/status.json")
curl -sS -m 300 -o "$work/out" "$url"
python3 -I -c "from PIL import Image; import sys; Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2])" "$work/out" "$out/$name.png"
echo "saved $out/$name.png"

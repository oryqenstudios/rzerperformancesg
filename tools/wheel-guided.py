#!/usr/bin/env python3
"""The wheel edits, guided by the real wheel: image 1 is the view's stock photo with the wheel's product photo laid into
each tyre (tools/wheel_photo.py), image 2 the product photo; the edit redraws the wheels photoreal and lit like the
workshop while keeping the real spoke count, shape and finish (a plain edit from the product photo alone drifted, e.g. a
TE37 with 7 spokes).

  python3 tools/wheel-guided.py <ids,...> <views,...> <takes: ab, or - for one> jobs.json   then   tools/config-gen.py jobs.json

Guides are written to  (default /tmp/wheel-guides); outputs are named <view>__bp-<id>.png like the other
part edits, and config-build.py cuts them to the stock wheels' outlines (assets/generated/config/wheel-ellipses.json).
"""
import json, os, sys
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')); sys.path.insert(0, 'tools')
import cv2, numpy as np
from config_layers import load
from wheel_photo import wheel_layer
from parts_more import MORE
GUIDES = os.environ.get('WHEEL_GUIDES', '/tmp/wheel-guides')
os.makedirs(GUIDES, exist_ok=True)
LOOK = {m['id']: m for m in MORE}
KEEP = ("Change nothing else: keep the camera, the framing, the car's exact position, size and shape, the tyres, the wheel arches, the "
        "body paint, the floor and the whole workshop exactly as they are. Photorealistic. No text, no logos, no lettering on the wheels.")


def guide(pid, v):
    out = f'{GUIDES}/{v}__{pid}.jpg'
    if not os.path.exists(out):
        base = load(f'assets/generated/config/base/silver-factory-{v}.jpg')
        lay, _ = wheel_layer(pid, v, base, 'assets/site/parts', 'assets/generated/config/wheel-ellipses.json')
        a = lay[..., 3:] / 255.0
        cv2.imwrite(out, (base * (1 - a) + lay[..., :3] * a).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
    return out


def job(pid, v, name):
    m = LOOK[pid]
    prompt = (f"Image 1 is the photo to edit: the car with a new wheel roughly pasted into each wheel arch. Image 2 is the real product "
              f"photo of that wheel, the {m['brand']} {m['name']}: {m['look']} Redraw the four wheels so they look like real photographed "
              "wheels on this car: keep exactly the wheel design from image 2, the same number of spokes, the same spoke shape, thickness "
              "and spacing, the same centre, lip and finish colour, and only correct the perspective, depth and concavity to this camera "
              "angle and the lighting and reflections to this workshop. Each wheel fills its tyre, the brake disc and caliper show behind "
              "the spokes, and the floor reflections of the wheels match. " + KEEP)
    return {'name': name, 'images': [guide(pid, v), f'assets/generated/config/parts-ref/{pid}.jpg'], 'prompt': prompt}


if __name__ == '__main__':
    pids, views, takes, outname = sys.argv[1].split(','), sys.argv[2].split(','), sys.argv[3], sys.argv[4]
    jobs = [job(p, v, f'{v}__bp-{p}' + (f'-{t}' if takes != '-' else '')) for p in pids for v in views for t in (takes if takes != '-' else '-')]
    json.dump(jobs, open(outname, 'w'), indent=1)
    print(len(jobs))

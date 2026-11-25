#!/usr/bin/env python3
"""Run many Higgsfield image edits for the photo configurator, a few at a time, and skip the ones already made.

  python3 tools/config-gen.py jobs.json [out_dir] [parallel]

jobs.json: [{"name": "paint-red-factory-a045", "images": ["a.jpg", "b.jpg"], "prompt": "..."}, ...]
Each job runs tools/higgsfield-edit.sh (Kling Image 4.0 edit, 2k, 16:9) and writes <out_dir>/<name>.png. A job whose
output exists is skipped, so the run can be stopped and started again. A failed job (Higgsfield sometimes answers
"temporarily unavailable") is tried twice more.
"""
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

jobs = json.load(open(sys.argv[1]))
out = sys.argv[2] if len(sys.argv) > 2 else 'assets/generated/config/src'
parallel = int(sys.argv[3]) if len(sys.argv) > 3 else 8
os.makedirs(out, exist_ok=True)
tool = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'higgsfield-edit.sh')


def run(job):
    target = os.path.join(out, job['name'] + '.png')
    if os.path.exists(target):
        return job['name'], 'exists'
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False) as f:
        f.write(job['prompt'])
        prompt = f.name
    try:
        for attempt in range(3):
            r = subprocess.run([tool, 'kling', ','.join(job['images']), prompt, job['name'], out],
                               capture_output=True, text=True)
            if r.returncode == 0 and os.path.exists(target):
                return job['name'], 'made' if attempt == 0 else f'made (try {attempt + 1})'
        return job['name'], 'FAILED: ' + (r.stdout + r.stderr).strip().splitlines()[-1][:200]
    finally:
        os.unlink(prompt)


todo = [j for j in jobs if not os.path.exists(os.path.join(out, j['name'] + '.png'))]
print(f'{len(jobs)} jobs, {len(todo)} to make, {parallel} at a time', flush=True)
failed = 0
with ThreadPoolExecutor(parallel) as pool:
    for i, (name, status) in enumerate(pool.map(run, todo), 1):
        failed += status.startswith('FAILED')
        print(f'[{i}/{len(todo)}] {name}: {status}', flush=True)
print(f'done, {failed} failed')
sys.exit(1 if failed else 0)

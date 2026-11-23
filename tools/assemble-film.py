# Build the hero film from its generated segments.
#
# Each segment was generated backwards (image-to-video starting from the next segment's first frame,
# the last one from the final still), so this reverses every clip, trims and retimes it to its phase
# of the reference video, joins them in playback order and encodes the files the site ships.
#
#   python3 tools/assemble-film.py assets/generated/film-plan.json assets/site
#
# film-plan.json lists the segments in playback order:
#   [{"file": "...mp4", "target": 3.4, "from": 0.0, "to": null}, ...]
# "from"/"to" are seconds of the reversed clip to keep; "target" is the length it is retimed to.
import json, os, subprocess, sys, tempfile

plan, out = json.load(open(sys.argv[1])), sys.argv[2]

def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path],
                       capture_output=True, text=True, check=True)
    return float(json.loads(r.stdout)['format']['duration'])

def run(*args):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)

parts, inputs = [], []
for i, seg in enumerate(plan):
    inputs += ['-i', seg['file']]
    start = seg.get('from') or 0.0
    end = seg.get('to') or duration(seg['file'])
    k = seg['target'] / (end - start)
    parts.append(f'[{i}:v]reverse,trim=start={start}:end={end},setpts=PTS-STARTPTS,setpts=PTS*{k:.5f},fps=24,'
                 f'scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p[v{i}]')
n = len(plan)
graph = ';'.join(parts) + ';' + ''.join(f'[v{i}]' for i in range(n)) + f'concat=n={n}:v=1:a=0[out]'

with tempfile.TemporaryDirectory() as tmp:
    master = os.path.join(tmp, 'master.mp4')
    run(*inputs, '-filter_complex', graph, '-map', '[out]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', master)
    run('-i', master, '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '2800k',
        '-bufsize', '5600k', '-movflags', '+faststart', os.path.join(out, 'hero-intro.mp4'))
    run('-i', master, '-an', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '35', '-row-mt', '1',
        '-deadline', 'good', '-cpu-used', '2', os.path.join(out, 'hero-intro.webm'))
    run('-i', master, '-frames:v', '1', '-q:v', '3', os.path.join(out, 'hero-poster.jpg'))
print('hero film:', round(duration(os.path.join(out, 'hero-intro.mp4')), 2), 's')

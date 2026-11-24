#!/usr/bin/env python3
"""Split the Evo model's merged "car body" into named parts, so the site can recolour, hide or swap them.

The CC BY model (3DCars4U) merges everything except the wheels and brakes into one node, sorted only by colour.
This labels each body triangle and writes a derived GLB whose "car body" node has one child per part:

  rz_shell     the painted shell, glass, lights, trim (dissolves in the x-ray view)
  rz_bonnet    the bonnet with its vents (carbon option)
  rz_roof      the roof panel (carbon option)
  rz_mirrors   the mirror caps (carbon option)
  rz_lip       the body-colour front lip (carbon lip / splitter options)
  rz_wing      the factory wing: blade and two uprights (wing options)
  rz_tip       the factory exhaust muffler and tip (exhaust options)
  rz_interior  seats, dash, door cards (stays solid in the x-ray view)

Parts are found per connected piece (vertices welded by position) from where the piece sits, in the car's frame:
metres, x forward, y up from the floor, z across. The bonnet is cut out of the shell by position.
Vertex data is shared, not copied: each part only gets its own index list. Unused data is dropped.

  python3 tools/split-model.py assets/source/lancer-evolution.glb assets/site/models/lancer-evolution-rzer.glb
"""
import json
import struct
import sys

import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]
LENGTH = 4.49                 # real Evo IX length, m
PAINT = 'wire_176026026'
GLASS = 'wire_255255255'

# ------------------------------------------------------------------------------------------------ read
data = open(SRC, 'rb').read()
_, _, total = struct.unpack_from('<III', data, 0)
off = 12
while off < total:
    clen, ctype = struct.unpack_from('<II', data, off)
    off += 8
    if ctype == 0x4E4F534A:
        js = json.loads(data[off:off + clen])
    elif ctype == 0x004E4942:
        binc = data[off:off + clen]
    off += clen

CT = {5126: ('f', 4), 5123: ('H', 2), 5125: ('I', 4), 5121: ('B', 1), 5122: ('h', 2), 5120: ('b', 1)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}


def accessor(i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    t, sz = CT[a['componentType']]
    n = NC[a['type']]
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride', sz * n)
    arr = np.frombuffer(binc, dtype=np.dtype('<' + t), count=(a['count'] - 1) * stride // sz + n, offset=start)
    return np.lib.stride_tricks.as_strided(arr, shape=(a['count'], n), strides=(stride, sz)).copy()


def matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix'], dtype=float).reshape(4, 4).T
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                  [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                  [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4)
    M[:3, :3] = R * np.array(node.get('scale', [1, 1, 1]))
    M[:3, 3] = node.get('translation', [0, 0, 0])
    return M


# world transforms, and which node is "car body"
world, parent = {}, {}
def walk(i, M):
    world[i] = M @ matrix(js['nodes'][i])
    for c in js['nodes'][i].get('children', []):
        parent[c] = i
        walk(c, world[i])
for r in js['scenes'][js.get('scene', 0)]['nodes']:
    walk(r, np.eye(4))
body = next(i for i, n in enumerate(js['nodes']) if n.get('name') == 'car body')
# the body's geometry hangs under one child node per material, all with the body's own transform
body_nodes = [c for c in js['nodes'][body].get('children', []) if 'mesh' in js['nodes'][c]]
assert all(np.allclose(world[c], world[body]) for c in body_nodes), 'body children must share the body transform'

# car frame: the model's +z is the front (away from the tail lights), y is up
pts = []
for i, n in enumerate(js['nodes']):
    if 'mesh' in n:
        for p in js['meshes'][n['mesh']]['primitives']:
            pos = accessor(p['attributes']['POSITION'])
            pts.append((np.c_[pos, np.ones(len(pos))] @ world[i].T)[:, :3])
P = np.concatenate(pts)
lo, hi = P.min(0), P.max(0)
S = LENGTH / (hi[2] - lo[2])
cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
def car(w):
    return np.c_[(w[:, 2] - cz) * S, (w[:, 1] - lo[1]) * S, -(w[:, 0] - cx) * S]

# ------------------------------------------------------------------------------------------------ label
def pieces(w, tris):
    """Connected pieces of a triangle list, with vertices welded by position."""
    _, weld = np.unique(np.round(w / 1e-4).astype(np.int64), axis=0, return_inverse=True)
    weld = weld.ravel()
    parent_ = np.arange(weld.max() + 1)
    def find(a):
        root = a
        while parent_[root] != root:
            root = parent_[root]
        while parent_[a] != root:
            parent_[a], a = root, parent_[a]
        return root
    for t in weld[tris]:
        ra = find(t[0])
        parent_[find(t[1])] = ra
        parent_[find(t[2])] = ra
    roots = np.array([find(v) for v in range(len(parent_))])
    return roots[weld[tris[:, 0]]]


def piece_label(mat, mn, mx):
    az0, az1 = min(abs(mn[2]), abs(mx[2])) if mn[2] * mx[2] > 0 else 0, max(abs(mn[2]), abs(mx[2]))
    if mat == PAINT and mn[1] > 0.95 and mx[0] < -1.7:
        return 'wing'
    if mat == PAINT and mn[1] > 1.3:
        return 'roof'
    if mat == PAINT and az0 > 0.78 and mn[0] > 0.4 and mx[0] < 0.85 and mn[1] > 0.85 and mx[1] < 1.1:
        return 'mirrors'
    if mat == PAINT and mx[1] < 0.3 and mn[0] > 1.5:
        return 'lip'
    if mat in ('wire_216216216', 'wire_040040040') and mn[0] > -2.25 and mx[0] < -1.6 and mx[1] < 0.36 and az0 > 0.4 and az1 < 0.7:
        return 'tip'
    if mat == PAINT and mn[0] > 0.6 and mx[0] < 2.1 and mn[1] > 0.7 and mx[1] < 1.0 and az1 < 0.72:
        return 'bonnet'   # vent pieces that sit inside the bonnet
    if mat != GLASS and mn[0] > -1.6 and mx[0] < 1.0 and mn[1] > 0.25 and mx[1] < 1.4 and az1 < 0.85:
        return 'interior'
    return 'shell'


BONNET = dict(x0=0.66, x1=2.08, y0=0.70, z=0.70, ny=0.2)   # cut out of the shell by position
labelled = []   # (primitive, {label: triangle index array})
counts = {}
for p in [p for c in body_nodes for p in js['meshes'][js['nodes'][c]['mesh']]['primitives']]:
    mat = js['materials'][p['material']]['name'] if 'material' in p else ''
    pos = accessor(p['attributes']['POSITION'])
    w = (np.c_[pos, np.ones(len(pos))] @ world[body].T)[:, :3]
    c = car(w)
    tris = accessor(p['indices']).reshape(-1, 3) if 'indices' in p else np.arange(len(pos)).reshape(-1, 3)
    lab = pieces(w, tris)
    labels = np.empty(len(tris), dtype=object)
    for L in np.unique(lab):
        sel = lab == L
        v = c[tris[sel].ravel()]
        labels[sel] = piece_label(mat, v.min(0), v.max(0))
    if mat == PAINT:
        a, b, d = c[tris[:, 0]], c[tris[:, 1]], c[tris[:, 2]]
        cen = (a + b + d) / 3
        nrm = np.cross(b - a, d - a)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-12
        cut = ((labels == 'shell') & (cen[:, 0] > BONNET['x0']) & (cen[:, 0] < BONNET['x1']) & (cen[:, 1] > BONNET['y0'])
               & (np.abs(cen[:, 2]) < BONNET['z']) & (np.abs(nrm[:, 1]) > BONNET['ny']))
        labels[cut] = 'bonnet'
    groups = {}
    for name in np.unique(labels):
        groups[name] = tris[labels == name]
        counts[name] = counts.get(name, 0) + len(groups[name])
    labelled.append((p, groups))
print('triangles per part:', {k: int(v) for k, v in sorted(counts.items())})

# ------------------------------------------------------------------------------------------------ write
new_bin = bytearray()
views, accs = [], []
def add_view(raw, target=None, stride=None):
    while len(new_bin) % 4:
        new_bin.append(0)
    v = {'buffer': 0, 'byteOffset': len(new_bin), 'byteLength': len(raw)}
    if target:
        v['target'] = target
    if stride:
        v['byteStride'] = stride
    new_bin.extend(raw)
    views.append(v)
    return len(views) - 1

copied = {}
def copy_accessor(i):
    """Keep an original accessor, with only the bytes it uses."""
    if i in copied:
        return copied[i]
    a = dict(js['accessors'][i])
    bv = js['bufferViews'][a['bufferView']]
    t, sz = CT[a['componentType']]
    n = NC[a['type']]
    stride = bv.get('byteStride', sz * n)
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    raw = binc[start:start + (a['count'] - 1) * stride + sz * n]
    a['bufferView'] = add_view(raw, bv.get('target'), bv.get('byteStride'))
    a['byteOffset'] = 0
    accs.append(a)
    copied[i] = len(accs) - 1
    return copied[i]

def index_accessor(tris):
    flat = tris.ravel()
    big = flat.max() > 65535
    raw = flat.astype('<u4' if big else '<u2').tobytes()
    accs.append({'bufferView': add_view(raw, 34963), 'componentType': 5125 if big else 5123, 'count': int(len(flat)),
                 'type': 'SCALAR', 'min': [int(flat.min())], 'max': [int(flat.max())]})
    return len(accs) - 1

def copy_primitive(p, indices=None):
    q = {k: v for k, v in p.items() if k not in ('attributes', 'indices', 'targets')}
    q['attributes'] = {k: copy_accessor(v) for k, v in p['attributes'].items()}
    if indices is not None:
        q['indices'] = index_accessor(indices)
    elif 'indices' in p:
        q['indices'] = copy_accessor(p['indices'])
    return q

meshes, mesh_map = [], {}
body_meshes = {js['nodes'][c]['mesh'] for c in body_nodes}
for mi, m in enumerate(js['meshes']):
    if mi in body_meshes:
        continue
    meshes.append({**{k: v for k, v in m.items() if k != 'primitives'}, 'primitives': [copy_primitive(p) for p in m['primitives']]})
    mesh_map[mi] = len(meshes) - 1

# drop the per-material body nodes; the part nodes take their place under "car body"
keep = [i for i in range(len(js['nodes'])) if i not in body_nodes]
remap = {old: new for new, old in enumerate(keep)}
nodes = []
for i in keep:
    n = dict(js['nodes'][i])
    if 'mesh' in n:
        n['mesh'] = mesh_map[n['mesh']]
    if 'children' in n:
        n['children'] = [remap[c] for c in n['children'] if c in remap]
        if not n['children']:
            del n['children']
    nodes.append(n)
body = remap[body]
js['scenes'] = [dict(sc, nodes=[remap[r] for r in sc['nodes']]) for sc in js['scenes']]
part_nodes = []
for part in ('shell', 'bonnet', 'roof', 'mirrors', 'lip', 'wing', 'tip', 'interior'):
    prims = [copy_primitive(p, groups[part]) for p, groups in labelled if part in groups and len(groups[part])]
    if not prims:
        continue
    meshes.append({'name': 'rz_' + part, 'primitives': prims})
    nodes.append({'name': 'rz_' + part, 'mesh': len(meshes) - 1})
    part_nodes.append(len(nodes) - 1)
nodes[body]['children'] = nodes[body].get('children', []) + part_nodes

out = {k: v for k, v in js.items() if k not in ('accessors', 'bufferViews', 'buffers', 'meshes', 'nodes')}
out.update(accessors=accs, bufferViews=views, meshes=meshes, nodes=nodes, buffers=[{'byteLength': len(new_bin)}])
out.setdefault('asset', {})['extras'] = {
    'derivedFrom': 'Mitsubishi Lancer Evolution by 3DCars4U (CC BY 4.0)',
    'changes': 'Car body split into named parts by tools/split-model.py for the RZER Performance site',
}
j = json.dumps(out, separators=(',', ':')).encode()
j += b' ' * (-len(j) % 4)
while len(new_bin) % 4:
    new_bin.append(0)
with open(DST, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(new_bin)))
    f.write(struct.pack('<II', len(j), 0x4E4F534A) + j)
    f.write(struct.pack('<II', len(new_bin), 0x004E4942) + bytes(new_bin))
print(f'wrote {DST}: {(28 + len(j) + len(new_bin)) / 1e6:.1f} MB (source {len(data) / 1e6:.1f} MB)')

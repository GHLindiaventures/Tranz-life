"""Turn the heavy Meshy gummy (115k tris + 3 textures, 21 MB) into a light instancing mesh: welded, decimated, smooth normals, centred, width 1."""
import json, struct, sys
import numpy as np, trimesh, fast_simplification

src, dst, target = sys.argv[1], sys.argv[2], int(sys.argv[3])
f = open(src, 'rb').read()
off, ch = 12, {}
while off < len(f):
    l, t = struct.unpack('<I4s', f[off:off+8]); ch[t] = (off+8, l); off += 8+l
js = json.loads(f[ch[b'JSON'][0]:ch[b'JSON'][0]+ch[b'JSON'][1]]); bs = ch[b'BIN\x00'][0]
def acc(i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]
    n = {'VEC3':3,'SCALAR':1,'VEC2':2}[a['type']]; dt = {5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
    arr = np.frombuffer(f, dtype=dt, count=a['count']*n, offset=bs+bv.get('byteOffset',0)+a.get('byteOffset',0))
    return arr.reshape(-1, n) if n > 1 else arr
p = js['meshes'][0]['primitives'][0]
P = acc(p['attributes']['POSITION']).astype(np.float64); I = acc(p['indices']).reshape(-1, 3).astype(np.int64)
m = trimesh.Trimesh(P, I, process=False); m.merge_vertices(digits_vertex=5); m.remove_unreferenced_vertices()
print('welded', len(m.vertices), 'verts', len(m.faces), 'faces; watertight', m.is_watertight)
red = 1 - target / len(m.faces)
v2, f2 = fast_simplification.simplify(m.vertices.astype(np.float32), m.faces.astype(np.int32), target_reduction=red)
m2 = trimesh.Trimesh(v2, f2, process=True)
print('decimated', len(m2.vertices), 'verts', len(m2.faces), 'faces')
V = np.asarray(m2.vertices); lo, hi = V.min(0), V.max(0)
V = V - (lo + hi) / 2; V = V / (hi[[0, 2]].max() - lo[[0, 2]].min())     # width (x/z) = 1
N = np.asarray(m2.vertex_normals).astype('<f4'); Fa = np.asarray(m2.faces).astype('<u4').reshape(-1)
Va = V.astype('<f4')
print('size', (Va.max(0) - Va.min(0)).round(3))
blob = bytearray(); bvs = []
for data, tgt in ((Va.tobytes(), 34962), (N.tobytes(), 34962), (Fa.tobytes(), 34963)):
    while len(blob) % 4: blob.append(0)
    bvs.append({'buffer': 0, 'byteOffset': len(blob), 'byteLength': len(data), 'target': tgt}); blob.extend(data)
g = {'asset': {'version': '2.0', 'generator': 'make_gummy.py'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'Gummy'}],
     'meshes': [{'name': 'Gummy', 'primitives': [{'attributes': {'POSITION': 0, 'NORMAL': 1}, 'indices': 2}]}],
     'accessors': [{'bufferView': 0, 'componentType': 5126, 'count': len(Va), 'type': 'VEC3', 'min': Va.min(0).tolist(), 'max': Va.max(0).tolist()},
                   {'bufferView': 1, 'componentType': 5126, 'count': len(N), 'type': 'VEC3'},
                   {'bufferView': 2, 'componentType': 5125, 'count': len(Fa), 'type': 'SCALAR'}],
     'bufferViews': bvs, 'buffers': [{'byteLength': len(blob)}]}
jb = json.dumps(g, separators=(',', ':')).encode(); jb += b' ' * (-len(jb) % 4); blob.extend(b'\0' * (-len(blob) % 4))
open(dst, 'wb').write(b'glTF' + struct.pack('<II', 2, 12 + 8 + len(jb) + 8 + len(blob)) + struct.pack('<I4s', len(jb), b'JSON') + jb + struct.pack('<I4s', len(blob), b'BIN\0') + bytes(blob))
print('wrote', dst, len(blob) // 1024, 'KB')

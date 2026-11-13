"""Liver Booster (liver-booster.glb): light fix so the neck stays clean once the cap is lifted.

The cap (`Cap`) and the bottle (`Bottle`, glass neck + threads) are already separate parts. But some neck triangles of `Bottle` carry
the WOOD texture of the cap (invisible while the cap covers them, a brown stain inside the glass once it is lifted). This script finds
those triangles by sampling the baked texture, gives them their own copies of the vertices and points their UVs at a clear-glass texel.
Nothing else is touched.

usage: python fix_liver_neck.py <in.glb> <out.glb>
"""
import colorsys
import io
import json
import struct
import sys

import numpy as np
from PIL import Image

NECK_FLAT_Y = 0.462          # neck/threads/lip start above the dark shoulder ring
NECK_Y0 = 0.42          # only the neck/cap zone of the bottle is looked at
WOOD_SAT, WOOD_HUE = 0.15, (0.03, 0.14)      # wood = warm light brown


def read_glb(path):
    f = open(path, "rb").read()
    off, ch = 12, {}
    while off < len(f):
        ln, ty = struct.unpack("<I4s", f[off:off + 8])
        ch[ty] = (off + 8, ln)
        off += 8 + ln
    js = json.loads(f[ch[b"JSON"][0]:ch[b"JSON"][0] + ch[b"JSON"][1]])
    b0, bl = ch[b"BIN\x00"]
    return js, bytearray(f[b0:b0 + bl])


def acc(js, binb, i):
    a = js["accessors"][i]
    bv = js["bufferViews"][a["bufferView"]]
    n = {"SCALAR": 1, "VEC2": 2, "VEC3": 3}[a["type"]]
    dt = {5126: "<f4", 5125: "<u4", 5123: "<u2"}[a["componentType"]]
    arr = np.frombuffer(bytes(binb), dtype=dt, count=a["count"] * n, offset=bv.get("byteOffset", 0) + a.get("byteOffset", 0))
    return arr.reshape(-1, n) if n > 1 else arr


def main(src, dst):
    js, binb = read_glb(src)
    mesh = next(m for m in js["meshes"] if m["name"] == "Bottle")
    prim = mesh["primitives"][0]
    P = acc(js, binb, prim["attributes"]["POSITION"]).copy()
    Nn = acc(js, binb, prim["attributes"]["NORMAL"]).copy()
    UV = acc(js, binb, prim["attributes"]["TEXCOORD_0"]).copy()
    I = acc(js, binb, prim["indices"]).astype(np.uint32).reshape(-1, 3)

    mat = js["materials"][prim["material"]]
    ti = mat["pbrMetallicRoughness"]["baseColorTexture"]["index"]
    img = js["images"][js["textures"][ti]["source"]]
    bv = js["bufferViews"][img["bufferView"]]
    tex = Image.open(io.BytesIO(bytes(binb[bv["byteOffset"]:bv["byteOffset"] + bv["byteLength"]]))).convert("RGB")
    T = np.asarray(tex)
    h, w = T.shape[:2]
    px = np.clip((UV[:, 0] % 1.0 * w).astype(int), 0, w - 1)
    py = np.clip((UV[:, 1] % 1.0 * h).astype(int), 0, h - 1)
    col = T[py, px] / 255.0

    hsv = np.array([colorsys.rgb_to_hsv(*c) for c in col])
    neck = (P[:, 1] >= NECK_Y0)
    # the scan's neck texture is patchy (wood from the cap, odd blocks): paint the whole neck above the shoulder ring with ONE
    # clear-glass texel so it reads as a uniform glass neck; the thread ridges keep their shape and get their shading from the normals
    wood = P[:, 1] >= NECK_FLAT_Y
    glassv = (P[:, 1] >= 0.5) & (np.linalg.norm(col * 255 - np.array([176, 176, 112]), axis=1) < 45)   # the neck's usual pale-olive glass colour
    print("neck verts %d, wood-textured %d, glass-like %d" % (neck.sum(), wood.sum(), glassv.sum()))

    med = np.median(col[glassv], axis=0)
    gi = np.where(glassv)[0][np.argmin(np.linalg.norm(col[glassv] - med, axis=1))]
    print("clear-glass texel taken from vertex %d, colour %s" % (gi, (col[gi] * 255).astype(int)))

    bad_tri = wood[I].any(1)
    print("triangles to re-texture: %d of %d" % (bad_tri.sum(), len(I)))
    # new vertex copies for those triangles, UV pointed at the glass texel
    used = np.unique(I[bad_tri])
    remap = {int(v): len(P) + k for k, v in enumerate(used)}
    newP, newN = P[used], Nn[used]
    newUV = np.tile(UV[gi], (len(used), 1))
    I2 = I.copy()
    sel = I2[bad_tri]
    I2[bad_tri] = np.vectorize(lambda v: remap[int(v)])(sel) if len(sel) else sel

    def put(data, target):
        while len(binb) % 4:
            binb.append(0)
        off = len(binb)
        binb.extend(data)
        js["bufferViews"].append({"buffer": 0, "byteOffset": off, "byteLength": len(data), "target": target})
        return len(js["bufferViews"]) - 1

    def new_acc(arr, typ, comp, target, mm=False):
        a = {"bufferView": put(arr.tobytes(), target), "componentType": comp, "count": len(arr), "type": typ}
        if mm:
            a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
        js["accessors"].append(a)
        return len(js["accessors"]) - 1

    allP = np.vstack([P, newP]).astype("<f4")
    allN = np.vstack([Nn, newN]).astype("<f4")
    allUV = np.vstack([UV, newUV]).astype("<f4")
    prim["attributes"]["POSITION"] = new_acc(allP, "VEC3", 5126, 34962, True)
    prim["attributes"]["NORMAL"] = new_acc(allN, "VEC3", 5126, 34962)
    prim["attributes"]["TEXCOORD_0"] = new_acc(allUV, "VEC2", 5126, 34962)
    prim["indices"] = new_acc(I2.reshape(-1).astype("<u4"), "SCALAR", 5125, 34963)

    js["buffers"][0]["byteLength"] = len(binb)
    jb = json.dumps(js, separators=(",", ":")).encode()
    jb += b" " * (-len(jb) % 4)
    binb.extend(b"\0" * (-len(binb) % 4))
    with open(dst, "wb") as fo:
        fo.write(b"glTF" + struct.pack("<II", 2, 12 + 8 + len(jb) + 8 + len(binb)))
        fo.write(struct.pack("<I4s", len(jb), b"JSON") + jb)
        fo.write(struct.pack("<I4s", len(binb), b"BIN\0") + bytes(binb))
    print("wrote", dst)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

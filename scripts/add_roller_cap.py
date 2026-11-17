"""CycleRelief roll-on (cyclerelief.glb): split the cap off, add the threaded neck + frosted roller holder + steel ball under it.

The original single mesh is only re-indexed (body / cap), never edited. New parts, all under the cap while it is closed:
  Jar_Cap_Pivot > Jar_Cap   the cap, turning on its own axis (extras: turns, lift for the unscrew animation)
  Roller_Neck               black glass neck with a right-hand thread + transfer ring
  Roller_Holder             frosted translucent roller holder
  Roller_Ball               polished stainless steel ball

usage: python add_roller_cap.py <original.glb> <out.glb>      (run on the ORIGINAL file)
"""
import json
import math
import struct
import sys

import numpy as np

sys.path.insert(0, __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0])
import add_lung_threads as L

CUT_Y = 0.378
AXIS = (-0.0003, -0.0010)
NECK_R, NECK_Y0, NECK_Y1 = 0.186, 0.300, 0.562
THREAD = dict(y0=0.372, y1=0.522, turns=3.0, bump=0.011, h=0.028)
RING_Y, RING_BUMP, RING_H = 0.345, 0.015, 0.022
HOLDER = [(0.0, 0.56), (0.152, 0.56), (0.152, 0.606), (0.142, 0.640), (0.128, 0.668), (0.100, 0.672), (0.0, 0.672)]
BALL_C, BALL_R = 0.668, 0.104
MATS = {
    "black": {"name": "Neck_Black", "doubleSided": True, "pbrMetallicRoughness": {"baseColorFactor": [0.015, 0.016, 0.016, 1], "metallicFactor": 0.0, "roughnessFactor": 0.14}},
    "frost": {"name": "Holder_Frosted", "doubleSided": True, "alphaMode": "BLEND", "pbrMetallicRoughness": {"baseColorFactor": [0.93, 0.95, 0.93, 0.82], "metallicFactor": 0.0, "roughnessFactor": 0.55}},
    "steel": {"name": "Ball_Steel", "doubleSided": True, "pbrMetallicRoughness": {"baseColorFactor": [0.88, 0.89, 0.9, 1], "metallicFactor": 1.0, "roughnessFactor": 0.1}},
}


def patch(src, dst):
    js, binb = L.read_glb(src)
    meshes, nodes = js["meshes"], js["nodes"]
    prim = meshes[0]["primitives"][0]
    P = L.read_acc(js, binb, prim["attributes"]["POSITION"])
    I = L.read_acc(js, binb, prim["indices"]).reshape(-1, 3)

    def add_bv(data, target=None):
        while len(binb) % 4:
            binb.append(0)
        bv = {"buffer": 0, "byteOffset": len(binb), "byteLength": len(data)}
        if target:
            bv["target"] = target
        binb.extend(data)
        js["bufferViews"].append(bv)
        return len(js["bufferViews"]) - 1

    def add_acc(arr, typ, comp, target, mm=False):
        a = {"bufferView": add_bv(arr.tobytes(), target), "componentType": comp, "count": len(arr), "type": typ}
        if mm:
            a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
        js["accessors"].append(a)
        return len(js["accessors"]) - 1

    cy = P[I, 1].mean(1)
    cap_i, body_i = I[cy >= CUT_Y].reshape(-1), I[cy < CUT_Y].reshape(-1)
    print("split at y=%.3f: body %d tris, cap %d tris" % (CUT_Y, len(body_i) // 3, len(cap_i) // 3))
    b_acc = add_acc(body_i.astype("<u4"), "SCALAR", 5125, 34963)
    c_acc = add_acc(cap_i.astype("<u4"), "SCALAR", 5125, 34963)
    attrs, mat = dict(prim["attributes"]), prim["material"]
    prim["indices"] = b_acc
    meshes[0]["name"] = "Mesh_Body"
    ni = next(i for i, n in enumerate(nodes) if n.get("mesh") == 0)
    nodes[ni]["name"] = "Roller_Body"
    meshes.append({"name": "Mesh_Cap", "primitives": [{"attributes": attrs, "indices": c_acc, "material": mat}]})
    nodes.append({"name": "Jar_Cap", "mesh": len(meshes) - 1, "translation": [-AXIS[0], 0.0, -AXIS[1]]})
    cap_ni = len(nodes) - 1
    nodes.append({"name": "Jar_Cap_Pivot", "children": [cap_ni], "translation": [AXIS[0], 0.0, AXIS[1]], "extras": {"turns": 3.0, "lift": 0.85}})
    pivot_ni = len(nodes) - 1

    def add_mesh(name, V, N, Iw, material):
        Va, Na = np.array(V, "<f4"), np.array(N, "<f4")
        p = add_acc(Va, "VEC3", 5126, 34962, True)
        n = add_acc(Na, "VEC3", 5126, 34962)
        i = add_acc(np.array(Iw, "<u4"), "SCALAR", 5125, 34963)
        meshes.append({"name": "Mesh_" + name, "primitives": [{"attributes": {"POSITION": p, "NORMAL": n}, "indices": i, "material": material}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1})
        return len(nodes) - 1

    mid = {}
    for k, m in MATS.items():
        js["materials"].append(m)
        mid[k] = len(js["materials"]) - 1

    # black glass neck: tube + rounded top + thread ridge + transfer ring (one mesh)
    neck_prof = [(0.0, NECK_Y0), (NECK_R, NECK_Y0), (NECK_R, NECK_Y1 - 0.014), (NECK_R - 0.006, NECK_Y1 - 0.004), (NECK_R - 0.016, NECK_Y1), (0.0, NECK_Y1)]
    nv, nn, ni_ = L.lathe(AXIS, neck_prof)
    ni_ = L.fix_winding(nv, nn, ni_)
    rf = lambda y: NECK_R
    ridge = L.sweep(AXIS, rf, THREAD["y0"], THREAD["y1"], THREAD["turns"], THREAD["bump"], THREAD["h"], 0.07)
    ring = L.sweep(AXIS, rf, RING_Y, RING_Y, 1.0, RING_BUMP, RING_H, 0.0)
    tv, tn, ti = L.merge([ridge, ring])
    ti = L.fix_winding(tv, tn, ti)
    V, N, Iw = L.merge([(nv, nn, list(ni_)), (tv, tn, list(ti))])
    neck_n = add_mesh("Roller_Neck", V, N, Iw, mid["black"])

    hv, hn, hi = L.lathe(AXIS, HOLDER)
    hi = L.fix_winding(hv, hn, hi)
    holder_n = add_mesh("Roller_Holder", hv, hn, hi, mid["frost"])

    ball_prof = [(BALL_R * math.cos(t), BALL_C + BALL_R * math.sin(t)) for t in np.linspace(-math.pi / 2, math.pi / 2, 33)]
    ball_prof[0] = (0.0, ball_prof[0][1])
    ball_prof[-1] = (0.0, ball_prof[-1][1])
    bv_, bn_, bi_ = L.lathe(AXIS, ball_prof, seg=64)
    bi_ = L.fix_winding(bv_, bn_, bi_)
    ball_n = add_mesh("Roller_Ball", bv_, bn_, bi_, mid["steel"])

    js["scenes"][0]["nodes"] += [pivot_ni, neck_n, holder_n, ball_n]
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
    patch(sys.argv[1], sys.argv[2])

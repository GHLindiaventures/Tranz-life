"""Lung Booster jar (lungbooster.glb): split the cap off as its own part, add a threaded glass neck, ready for an unscrew animation.

What it does (the original meshes are never edited, only re-indexed):
  1. `Jar_Label_Cap` is split by height into `Jar_Label` (label + shoulder + collar) and `Jar_Cap` (the cap). Both keep the
     same vertices/material, so nothing changes visually.
  2. `Jar_Cap` is wrapped in a pivot node `Jar_Cap_Pivot` placed on the cap's own axis: rotating/raising the pivot unscrews it.
  3. `Jar_Neck_Thread` is added: a right-handed glass thread (visible on the collar, continuing up a glass neck that is hidden
     inside the cap while it is closed) plus a transfer ring, and `Jar_Neck` (the open glass neck tube).

usage: python add_lung_threads.py <original.glb> <out.glb>     (always run on the ORIGINAL file, not on an already patched one)
"""
import json
import math
import struct
import sys

import numpy as np

CUT_Y = 0.662                      # triangles whose centre is above this belong to the cap
# thread (right-handed: it climbs counter-clockwise seen from above, like a real bottle)
Y_START, Y_END = 0.609, 0.775
N_TURNS = 4.6
RIDGE_BUMP, RIDGE_H = 0.0100, 0.018
RING_Y, RING_BUMP, RING_H = 0.598, 0.0115, 0.014
NECK_R = 0.356                     # glass neck radius inside the cap (cap inner wall is 0.366)
NECK_TOP = 0.800
STEPS_PER_TURN, ARC = 96, 9
THREAD_MAT = {"name": "Thread_Glass", "doubleSided": True, "alphaMode": "BLEND",
              "pbrMetallicRoughness": {"baseColorFactor": [0.92, 0.97, 0.93, 0.78], "metallicFactor": 0.0, "roughnessFactor": 0.06}}


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


def read_acc(js, binb, i):
    a = js["accessors"][i]
    bv = js["bufferViews"][a["bufferView"]]
    n = {"SCALAR": 1, "VEC2": 2, "VEC3": 3}[a["type"]]
    dt = {5126: "<f4", 5125: "<u4", 5123: "<u2"}[a["componentType"]]
    arr = np.frombuffer(bytes(binb), dtype=dt, count=a["count"] * n, offset=bv.get("byteOffset", 0) + a.get("byteOffset", 0))
    return arr.reshape(-1, n) if n > 1 else arr


def circle_fit(pts):
    A = np.c_[2 * pts[:, 0], 2 * pts[:, 1], np.ones(len(pts))]
    (x0, z0, c), *_ = np.linalg.lstsq(A, (pts ** 2).sum(1), rcond=None)
    return x0, z0, math.sqrt(c + x0 * x0 + z0 * z0)


def outer_points(P, y0, y1, sectors=24):
    y, r, th = P[:, 1], np.hypot(P[:, 0], P[:, 2]), np.arctan2(P[:, 2], P[:, 0])
    s = (y >= y0) & (y < y1)
    pts = []
    for k in range(sectors):
        t0 = -math.pi + k * 2 * math.pi / sectors
        ss = s & (th >= t0) & (th < t0 + 2 * math.pi / sectors)
        if ss.sum() > 3:
            i = np.argmax(np.where(ss, r, -1))
            pts.append((P[i, 0], P[i, 2]))
    return np.array(pts)


def fit_collar(P):
    ys, cx, cz, R = [], [], [], []
    for yy in np.arange(0.604, 0.659, 0.006):
        pts = outer_points(P, yy - 0.004, yy + 0.004)
        if len(pts) >= 10:
            x0, z0, r0 = circle_fit(pts)
            ys.append(yy); cx.append(x0); cz.append(z0); R.append(r0)
    f = lambda v: np.polyfit(ys, v, 1)
    return f(cx), f(cz), f(R)


def sweep(center, rfun, y0, y1, turns, bump, h, taper, steps_per_turn=STEPS_PER_TURN, arc=ARC):
    """Half-ellipse ridge swept along a right-handed helix. rfun(y) is the surface radius under the ridge."""
    total = max(2, int(turns * steps_per_turn))
    V, N = [], []
    for s in range(total + 1):
        t = s / total
        phi = -2 * math.pi * turns * t                      # minus: climbs counter-clockwise seen from above (right-handed)
        yc = y0 + (y1 - y0) * t
        if t < taper:
            k = 0.5 - 0.5 * math.cos(math.pi * t / taper)
        elif t > 1 - taper:
            k = 0.5 - 0.5 * math.cos(math.pi * (1 - t) / taper)
        else:
            k = 1.0
        b, hh = bump * k, h * (0.35 + 0.65 * k)
        for j in range(arc):
            al = -math.pi / 2 + math.pi * j / (arc - 1)
            y = yc + (hh / 2) * math.sin(al)
            r = rfun(y) - 0.0015 + b * math.cos(al)
            V.append((center[0] + r * math.cos(phi), y, center[1] + r * math.sin(phi)))
            nr, na = (hh / 2) * math.cos(al), b * math.sin(al)
            ln = math.hypot(nr, na) or 1.0
            N.append((nr / ln * math.cos(phi), na / ln, nr / ln * math.sin(phi)))
    I = []
    for s in range(total):
        for j in range(arc - 1):
            i0, i1, i2, i3 = s * arc + j, (s + 1) * arc + j, (s + 1) * arc + j + 1, s * arc + j + 1
            I += [i0, i1, i2, i0, i2, i3]
    return V, N, I


def lathe(center, prof, seg=96):
    """prof: list of (r, y) points; returns verts, normals, tris (normals from the profile tangent)."""
    V, N, I = [], [], []
    m = len(prof)
    tan = []
    for i in range(m):
        a, b = prof[max(0, i - 1)], prof[min(m - 1, i + 1)]
        dr, dy = b[0] - a[0], b[1] - a[1]
        ln = math.hypot(dr, dy) or 1.0
        tan.append((dy / ln, -dr / ln))                   # (radial, axial) outward normal for a profile walked upward
    for s in range(seg + 1):
        phi = 2 * math.pi * s / seg
        c, sn = math.cos(phi), math.sin(phi)
        for (r, y), (nr, na) in zip(prof, tan):
            V.append((center[0] + r * c, y, center[1] + r * sn))
            N.append((nr * c, na, nr * sn))
    for s in range(seg):
        for j in range(m - 1):
            i0, i1, i2, i3 = s * m + j, (s + 1) * m + j, (s + 1) * m + j + 1, s * m + j + 1
            I += [i0, i1, i2, i0, i2, i3]
    return V, N, I


def fix_winding(V, N, I):
    V, N = np.array(V), np.array(N)
    I = np.array(I).reshape(-1, 3)
    g = np.cross(V[I[:, 1]] - V[I[:, 0]], V[I[:, 2]] - V[I[:, 0]])
    good = (g * (N[I[:, 0]] + N[I[:, 1]] + N[I[:, 2]])).sum(1) >= 0
    if good.mean() < 0.5:
        I = I[:, [0, 2, 1]]
    return I.reshape(-1)


def merge(parts):
    V, N, I, base = [], [], [], 0
    for v, n, i in parts:
        V += v; N += n; I += [base + k for k in i]; base += len(v)
    return V, N, I


def patch(src, dst):
    js, binb = read_glb(src)
    meshes, nodes = js["meshes"], js["nodes"]
    lab_mi = next(i for i, m in enumerate(meshes) if m.get("name") == "Mesh_0")
    lab_ni = next(i for i, n in enumerate(nodes) if n.get("mesh") == lab_mi)
    prim = meshes[lab_mi]["primitives"][0]
    P = read_acc(js, binb, prim["attributes"]["POSITION"])
    I = read_acc(js, binb, prim["indices"]).reshape(-1, 3)

    def add_bv(data, target=None):
        while len(binb) % 4:
            binb.append(0)
        bv = {"buffer": 0, "byteOffset": len(binb), "byteLength": len(data)}
        if target:
            bv["target"] = target
        binb.extend(data)
        js["bufferViews"].append(bv)
        return len(js["bufferViews"]) - 1

    def add_acc(arr, typ, comp, target, minmax=False):
        a = {"bufferView": add_bv(arr.tobytes(), target), "componentType": comp, "count": len(arr), "type": typ}
        if minmax:
            a["min"], a["max"] = arr.min(0).tolist(), arr.max(0).tolist()
        js["accessors"].append(a)
        return len(js["accessors"]) - 1

    # ---- 1. split the cap off ---------------------------------------------------------------------------------------
    cy = P[I, 1].mean(1)
    cap_i, body_i = I[cy >= CUT_Y].reshape(-1), I[cy < CUT_Y].reshape(-1)
    print("split at y=%.3f: body %d tris, cap %d tris" % (CUT_Y, len(body_i) // 3, len(cap_i) // 3))
    body_acc = add_acc(body_i.astype("<u4"), "SCALAR", 5125, 34963)
    cap_acc = add_acc(cap_i.astype("<u4"), "SCALAR", 5125, 34963)
    attrs, mat = dict(prim["attributes"]), prim["material"]
    prim["indices"] = body_acc                                   # the old mesh keeps only label + shoulder + collar
    meshes[lab_mi]["name"] = "Mesh_Label"
    nodes[lab_ni]["name"] = "Jar_Label"
    meshes.append({"name": "Mesh_Cap", "primitives": [{"attributes": attrs, "indices": cap_acc, "material": mat}]})
    cap_mi = len(meshes) - 1

    # cap axis (the cap is slightly off the model origin)
    cap_pts = outer_points(P[(P[:, 1] > 0.70) & (P[:, 1] < 0.86)], 0.70, 0.86)
    ccx, ccz, cr = circle_fit(cap_pts)
    print("cap axis x %.4f z %.4f, outer radius %.3f" % (ccx, ccz, cr))
    nodes.append({"name": "Jar_Cap", "mesh": cap_mi, "translation": [-ccx, 0.0, -ccz]})
    cap_ni = len(nodes) - 1
    nodes.append({"name": "Jar_Cap_Pivot", "children": [cap_ni], "translation": [ccx, 0.0, ccz]})
    pivot_ni = len(nodes) - 1

    # ---- 2. threads + neck ------------------------------------------------------------------------------------------
    cxf, czf, Rf = fit_collar(P)
    axis = (float(np.polyval(cxf, 0.63)), float(np.polyval(czf, 0.63)))
    print("collar axis x %.4f z %.4f R(0.63)=%.4f" % (axis[0], axis[1], np.polyval(Rf, 0.63)))

    def rfun(y):                                                  # collar surface up to the cap's bottom edge, then the neck
        return float(np.interp(y, [0.60, 0.645, 0.67, 1.0], [np.polyval(Rf, 0.60), np.polyval(Rf, 0.645), NECK_R, NECK_R]))

    ridge = sweep(axis, rfun, Y_START, Y_END, N_TURNS, RIDGE_BUMP, RIDGE_H, 0.06)
    ring = sweep(axis, rfun, RING_Y, RING_Y, 1.0, RING_BUMP, RING_H, 0.0)
    tv, tn, ti = merge([ridge, ring])
    ti = fix_winding(tv, tn, ti)

    prof = [(NECK_R, 0.625), (NECK_R, NECK_TOP - 0.006), (NECK_R - 0.004, NECK_TOP), (NECK_R - 0.010, NECK_TOP - 0.003),
            (NECK_R - 0.014, NECK_TOP - 0.012), (NECK_R - 0.014, 0.70), (0.0, 0.70)]
    nv, nn_, ni = lathe(axis, prof)
    ni = fix_winding(nv, nn_, ni)

    def add_mesh(name, V, N, Iw, material):
        Va, Na = np.array(V, "<f4"), np.array(N, "<f4")
        p = add_acc(Va, "VEC3", 5126, 34962, True)
        n = add_acc(Na, "VEC3", 5126, 34962)
        i = add_acc(np.array(Iw, "<u4"), "SCALAR", 5125, 34963)
        meshes.append({"name": "Mesh_" + name, "primitives": [{"attributes": {"POSITION": p, "NORMAL": n}, "indices": i, "material": material}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1})
        return len(nodes) - 1

    js["materials"].append(THREAD_MAT)
    tmat = len(js["materials"]) - 1
    glass = next(i for i, m in enumerate(js["materials"]) if m.get("name") == "Glass")
    thr_ni = add_mesh("Jar_Neck_Thread", tv, tn, ti, tmat)
    neck_ni = add_mesh("Jar_Neck", nv, nn_, ni, glass)
    print("thread %d verts, neck %d verts" % (len(tv), len(nv)))

    js["scenes"][0]["nodes"] += [pivot_ni, thr_ni, neck_ni]
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

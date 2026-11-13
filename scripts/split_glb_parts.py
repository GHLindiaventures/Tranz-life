import subprocess
import json
import struct
import math
import numpy as np

def generate_threaded_neck():
    # Neck geometry matching reference photo media_1794577240931_51687a59.jpg
    # Neck outer cylinder: r_neck = 0.176
    # Collar bead: r_collar = 0.198, y_collar = 0.455
    # Screw threads: 3 turns, y from 0.495 to 0.705, crest radius = 0.190 (fits inside cap r = 0.207!)
    # Lip rim at y = 0.74, inner hollow to y = 0.45
    
    r_neck = 0.176
    y_base = 0.415
    y_collar = 0.455
    r_collar_bump = 0.022
    h_collar = 0.028
    
    # 1. Base transition & Collar ring
    collar_verts = []
    collar_normals = []
    collar_uvs = []
    collar_indices = []
    
    n_ring = 96
    n_arc = 7
    
    for i in range(n_ring):
        phi = 2.0 * math.pi * i / n_ring
        cos_p = math.cos(phi)
        sin_p = math.sin(phi)
        
        for j in range(n_arc):
            alpha = -math.pi / 2.0 + math.pi * j / (n_arc - 1)
            dr = r_collar_bump * math.cos(alpha)
            dy = (h_collar / 2.0) * math.sin(alpha)
            
            r = r_neck + dr
            x = r * cos_p
            z = r * sin_p
            y = y_collar + dy
            
            nx = math.cos(alpha) * cos_p
            nz = math.cos(alpha) * sin_p
            ny = math.sin(alpha)
            length = math.sqrt(nx*nx + ny*ny + nz*nz)
            nx /= length; ny /= length; nz /= length
            
            u = (phi / (2 * math.pi)) * 0.2 + 0.25
            v = ((y - 0.4) / 0.45) * 0.2 + 0.15
            
            collar_verts.append((x, y, z))
            collar_normals.append((nx, ny, nz))
            collar_uvs.append((u, v))
            
    for i in range(n_ring):
        i_next = (i + 1) % n_ring
        for j in range(n_arc - 1):
            i0 = i * n_arc + j
            i1 = i_next * n_arc + j
            i2 = i_next * n_arc + (j + 1)
            i3 = i * n_arc + (j + 1)
            collar_indices.extend([i0, i1, i2, i0, i2, i3])
            
    # 2. Main neck cylinder & mouth lip opening (lathe profile)
    neck_prof = [
        # (r, y)
        (0.208, y_base),
        (0.185, 0.435),
        (r_neck, 0.48),
        (r_neck, 0.72),
        (r_neck + 0.005, 0.735),
        (r_neck - 0.015, 0.748),
        (0.145, 0.748),
        (0.138, 0.735),
        (0.138, 0.450),
        (0.000, 0.450)
    ]
    
    lathe_verts = []
    lathe_normals = []
    lathe_uvs = []
    lathe_indices = []
    
    vert_base_lathe = len(collar_verts)
    n_p = len(neck_prof)
    
    for i in range(n_ring):
        phi = 2.0 * math.pi * i / n_ring
        cos_p = math.cos(phi)
        sin_p = math.sin(phi)
        
        for j in range(n_p):
            r, y = neck_prof[j]
            x = r * cos_p
            z = r * sin_p
            
            # normal estimation
            if j < n_p - 1:
                dr = neck_prof[j+1][0] - neck_prof[j][0]
                dy = neck_prof[j+1][1] - neck_prof[j][1]
                # tangent is (dr, dy), normal is (dy, -dr)
                nr = dy
                ny = -dr
            else:
                nr, ny = 0.0, 1.0
                
            n_len = math.sqrt(nr*nr + ny*ny)
            if n_len > 1e-6:
                nr /= n_len; ny /= n_len
            else:
                nr, ny = 1.0, 0.0
                
            nx = nr * cos_p
            nz = nr * sin_p
            
            u = (phi / (2 * math.pi)) * 0.2 + 0.25
            v = ((y - 0.4) / 0.45) * 0.2 + 0.15
            
            lathe_verts.append((x, y, z))
            lathe_normals.append((nx, ny, nz))
            lathe_uvs.append((u, v))
            
    for i in range(n_ring):
        i_next = (i + 1) % n_ring
        for j in range(n_p - 1):
            i0 = vert_base_lathe + i * n_p + j
            i1 = vert_base_lathe + i_next * n_p + j
            i2 = vert_base_lathe + i_next * n_p + (j + 1)
            i3 = vert_base_lathe + i * n_p + (j + 1)
            lathe_indices.extend([i0, i1, i2, i0, i2, i3])
            
    # 3. Helical Screw Threads (3 turns, crest r = 0.190)
    n_turns = 2.75
    y_start = 0.505
    y_end = 0.705
    total_height = y_end - y_start
    pitch = total_height / n_turns
    
    r_thread_bump = 0.014
    h_thread = 0.024
    
    thread_verts = []
    thread_normals = []
    thread_uvs = []
    thread_indices = []
    
    steps_per_turn = 72
    total_steps = int(n_turns * steps_per_turn)
    n_t_arc = 7
    
    vert_base_thread = len(collar_verts) + len(lathe_verts)
    
    for s in range(total_steps + 1):
        t = s / total_steps
        phi = 2.0 * math.pi * n_turns * t
        y_center = y_start + pitch * (phi / (2.0 * math.pi))
        
        taper_len = 0.35 / n_turns
        if t < taper_len:
            taper = 0.5 - 0.5 * math.cos(math.pi * (t / taper_len))
        elif t > (1.0 - taper_len):
            taper = 0.5 - 0.5 * math.cos(math.pi * ((1.0 - t) / taper_len))
        else:
            taper = 1.0
            
        cur_bump = r_thread_bump * taper
        cur_h = h_thread * (0.3 + 0.7 * taper)
        
        cos_p = math.cos(phi)
        sin_p = math.sin(phi)
        
        for j in range(n_t_arc):
            alpha = -math.pi / 2.0 + math.pi * j / (n_t_arc - 1)
            dr = cur_bump * math.cos(alpha)
            dy_offset = (cur_h / 2.0) * math.sin(alpha)
            
            x = (r_neck + dr) * cos_p
            z = (r_neck + dr) * sin_p
            y = y_center + dy_offset
            
            nx = math.cos(alpha) * cos_p
            nz = math.cos(alpha) * sin_p
            ny = math.sin(alpha)
            length = math.sqrt(nx*nx + ny*ny + nz*nz)
            nx /= length; ny /= length; nz /= length
            
            u = ((phi / (2 * math.pi)) % 1.0) * 0.2 + 0.25
            v = ((y - 0.4) / 0.45) * 0.2 + 0.15
            
            thread_verts.append((x, y, z))
            thread_normals.append((nx, ny, nz))
            thread_uvs.append((u, v))
            
    for s in range(total_steps):
        s_next = s + 1
        for j in range(n_t_arc - 1):
            i0 = vert_base_thread + s * n_t_arc + j
            i1 = vert_base_thread + s_next * n_t_arc + j
            i2 = vert_base_thread + s_next * n_t_arc + (j + 1)
            i3 = vert_base_thread + s * n_t_arc + (j + 1)
            thread_indices.extend([i0, i1, i2, i0, i2, i3])
            
    all_verts = collar_verts + lathe_verts + thread_verts
    all_normals = collar_normals + lathe_normals + thread_normals
    all_uvs = collar_uvs + lathe_uvs + thread_uvs
    all_indices = collar_indices + lathe_indices + thread_indices
    
    return all_verts, all_normals, all_uvs, all_indices

def split_and_create_glb(output_path):
    # Read original clean GLB from git 0ac0a27
    p = subprocess.Popen(['git', 'show', '0ac0a27:src/assets/products/liver-booster.glb'], stdout=subprocess.PIPE)
    raw = p.communicate()[0]
    
    chunk_len = int.from_bytes(raw[12:16], 'little')
    gltf = json.loads(raw[20:20+chunk_len].decode('utf-8'))
    bin_data = raw[28+chunk_len:]
    
    pos_acc = gltf['accessors'][0]
    bv_pos = gltf['bufferViews'][pos_acc['bufferView']]
    pts = np.array([struct.unpack_from('<fff', bin_data, bv_pos['byteOffset'] + i*12) for i in range(pos_acc['count'])])
    
    uv_acc = gltf['accessors'][1]
    bv_uv = gltf['bufferViews'][uv_acc['bufferView']]
    uvs = np.array([struct.unpack_from('<ff', bin_data, bv_uv['byteOffset'] + i*8) for i in range(uv_acc['count'])])
    
    norm_acc = gltf['accessors'][2]
    bv_norm = gltf['bufferViews'][norm_acc['bufferView']]
    normals = np.array([struct.unpack_from('<fff', bin_data, bv_norm['byteOffset'] + i*12) for i in range(norm_acc['count'])])
    
    ind_acc = gltf['accessors'][3]
    bv_ind = gltf['bufferViews'][ind_acc['bufferView']]
    indices = np.array([struct.unpack_from('<I', bin_data, bv_ind['byteOffset'] + i*4)[0] for i in range(ind_acc['count'])]).reshape(-1, 3)
    
    # Split triangles
    tri_mid_y = pts[indices].mean(axis=1)[:, 1]
    bottle_tri_mask = tri_mid_y < 0.430
    cap_tri_mask = tri_mid_y >= 0.430
    
    bottle_tris = indices[bottle_tri_mask]
    cap_tris = indices[cap_tri_mask]
    
    # Remap vertices for Bottle
    bottle_unique_v, bottle_remapped = np.unique(bottle_tris, return_inverse=True)
    bottle_pts = [tuple(pts[i]) for i in bottle_unique_v]
    bottle_uvs = [tuple(uvs[i]) for i in bottle_unique_v]
    bottle_normals = [tuple(normals[i]) for i in bottle_unique_v]
    bottle_indices = [int(x) for x in bottle_remapped.flatten()]
    
    # Generate and append threaded neck to Bottle
    neck_verts, neck_normals, neck_uvs, neck_indices = generate_threaded_neck()
    b_v_count = len(bottle_pts)
    bottle_pts.extend(neck_verts)
    bottle_normals.extend(neck_normals)
    bottle_uvs.extend(neck_uvs)
    for idx in neck_indices:
        bottle_indices.append(int(b_v_count + idx))
        
    # Remap vertices for Cap
    cap_unique_v, cap_remapped = np.unique(cap_tris, return_inverse=True)
    cap_pts = [tuple(pts[i]) for i in cap_unique_v]
    cap_uvs = [tuple(uvs[i]) for i in cap_unique_v]
    cap_normals = [tuple(normals[i]) for i in cap_unique_v]
    cap_indices = [int(x) for x in cap_remapped.flatten()]
    
    # Add an inner floor/cavity to Cap so it is a closed shell
    n_ring = 48
    cap_floor_verts = []
    cap_floor_normals = []
    cap_floor_uvs = []
    cap_floor_indices = []
    cap_base_v = len(cap_pts)
    
    # Center vertex inside cap cavity at y = 0.50
    cap_floor_verts.append((0.0, 0.50, 0.0))
    cap_floor_normals.append((0.0, -1.0, 0.0))
    cap_floor_uvs.append((0.35, 0.25))
    
    r_cavity = 0.200
    for i in range(n_ring):
        phi = 2.0 * math.pi * i / n_ring
        x = r_cavity * math.cos(phi)
        z = r_cavity * math.sin(phi)
        cap_floor_verts.append((x, 0.435, z))
        cap_floor_normals.append((0.0, -1.0, 0.0))
        cap_floor_uvs.append((0.35, 0.25))
        
    for i in range(n_ring):
        i_next = (i + 1) % n_ring
        # facing downward inside cap
        cap_floor_indices.extend([cap_base_v, cap_base_v + 1 + i, cap_base_v + 1 + i_next])
        
    cap_pts.extend(cap_floor_verts)
    cap_normals.extend(cap_floor_normals)
    cap_uvs.extend(cap_floor_uvs)
    cap_indices.extend(cap_floor_indices)
    
    print(f"Bottle: {len(bottle_pts)} verts, {len(bottle_indices)//3} tris")
    print(f"Cap: {len(cap_pts)} verts, {len(cap_indices)//3} tris")
    
    # Build binary buffers:
    # Part 0: Bottle indices (uint32)
    b_ind_bytes = bytearray()
    for idx in bottle_indices:
        b_ind_bytes.extend(struct.pack('<I', int(idx)))
        
    # Part 1: Bottle positions (float32 vec3)
    b_pos_bytes = bytearray()
    for x, y, z in bottle_pts:
        b_pos_bytes.extend(struct.pack('<fff', float(x), float(y), float(z)))
        
    # Part 2: Bottle uvs (float32 vec2)
    b_uv_bytes = bytearray()
    for u, v in bottle_uvs:
        b_uv_bytes.extend(struct.pack('<ff', float(u), float(v)))
        
    # Part 3: Bottle normals (float32 vec3)
    b_norm_bytes = bytearray()
    for nx, ny, nz in bottle_normals:
        b_norm_bytes.extend(struct.pack('<fff', float(nx), float(ny), float(nz)))
        
    # Part 4: Cap indices (uint32)
    c_ind_bytes = bytearray()
    for idx in cap_indices:
        c_ind_bytes.extend(struct.pack('<I', int(idx)))
        
    # Part 5: Cap positions (float32 vec3)
    c_pos_bytes = bytearray()
    for x, y, z in cap_pts:
        c_pos_bytes.extend(struct.pack('<fff', float(x), float(y), float(z)))
        
    # Part 6: Cap uvs (float32 vec2)
    c_uv_bytes = bytearray()
    for u, v in cap_uvs:
        c_uv_bytes.extend(struct.pack('<ff', float(u), float(v)))
        
    # Part 7: Cap normals (float32 vec3)
    c_norm_bytes = bytearray()
    for nx, ny, nz in cap_normals:
        c_norm_bytes.extend(struct.pack('<fff', float(nx), float(ny), float(nz)))
        
    # Images (3 JPEG textures)
    images_raw = [
        bin_data[gltf['bufferViews'][i]['byteOffset']:gltf['bufferViews'][i]['byteOffset'] + gltf['bufferViews'][i]['byteLength']]
        for i in range(4, 7)
    ]
    
    all_binary_parts = [
        bytes(b_ind_bytes), bytes(b_pos_bytes), bytes(b_uv_bytes), bytes(b_norm_bytes),
        bytes(c_ind_bytes), bytes(c_pos_bytes), bytes(c_uv_bytes), bytes(c_norm_bytes)
    ] + images_raw
    
    new_bin = bytearray()
    new_bvs = []
    
    for i, part in enumerate(all_binary_parts):
        while len(new_bin) % 4 != 0:
            new_bin.append(0)
        offset = len(new_bin)
        length = len(part)
        new_bin.extend(part)
        
        bv_dict = {'buffer': 0, 'byteOffset': offset, 'byteLength': length}
        if i in [0, 4]:
            bv_dict['target'] = 34963 # ELEMENT_ARRAY_BUFFER
        elif i in [1, 2, 3, 5, 6, 7]:
            bv_dict['target'] = 34962 # ARRAY_BUFFER
        new_bvs.append(bv_dict)
        
    # Accessors
    accessors = [
        # 0: Bottle POSITION
        {
            'bufferView': 1, 'componentType': 5126, 'count': len(bottle_pts), 'type': 'VEC3',
            'min': [min(p[0] for p in bottle_pts), min(p[1] for p in bottle_pts), min(p[2] for p in bottle_pts)],
            'max': [max(p[0] for p in bottle_pts), max(p[1] for p in bottle_pts), max(p[2] for p in bottle_pts)]
        },
        # 1: Bottle TEXCOORD_0
        {
            'bufferView': 2, 'componentType': 5126, 'count': len(bottle_pts), 'type': 'VEC2',
            'min': [min(u[0] for u in bottle_uvs), min(u[1] for u in bottle_uvs)],
            'max': [max(u[0] for u in bottle_uvs), max(u[1] for u in bottle_uvs)]
        },
        # 2: Bottle NORMAL
        {
            'bufferView': 3, 'componentType': 5126, 'count': len(bottle_pts), 'type': 'VEC3'
        },
        # 3: Bottle INDICES
        {
            'bufferView': 0, 'componentType': 5125, 'count': len(bottle_indices), 'type': 'SCALAR',
            'min': [0], 'max': [len(bottle_pts) - 1]
        },
        # 4: Cap POSITION
        {
            'bufferView': 5, 'componentType': 5126, 'count': len(cap_pts), 'type': 'VEC3',
            'min': [min(p[0] for p in cap_pts), min(p[1] for p in cap_pts), min(p[2] for p in cap_pts)],
            'max': [max(p[0] for p in cap_pts), max(p[1] for p in cap_pts), max(p[2] for p in cap_pts)]
        },
        # 5: Cap TEXCOORD_0
        {
            'bufferView': 6, 'componentType': 5126, 'count': len(cap_pts), 'type': 'VEC2',
            'min': [min(u[0] for u in cap_uvs), min(u[1] for u in cap_uvs)],
            'max': [max(u[0] for u in cap_uvs), max(u[1] for u in cap_uvs)]
        },
        # 6: Cap NORMAL
        {
            'bufferView': 7, 'componentType': 5126, 'count': len(cap_pts), 'type': 'VEC3'
        },
        # 7: Cap INDICES
        {
            'bufferView': 4, 'componentType': 5125, 'count': len(cap_indices), 'type': 'SCALAR',
            'min': [0], 'max': [len(cap_pts) - 1]
        }
    ]
    
    # 2 Meshes: Bottle and Cap
    meshes = [
        {
            'name': 'Bottle',
            'primitives': [{
                'attributes': {'POSITION': 0, 'TEXCOORD_0': 1, 'NORMAL': 2},
                'indices': 3,
                'material': 0,
                'mode': 4
            }]
        },
        {
            'name': 'Cap',
            'primitives': [{
                'attributes': {'POSITION': 4, 'TEXCOORD_0': 5, 'NORMAL': 6},
                'indices': 7,
                'material': 0,
                'mode': 4
            }]
        }
    ]
    
    # 2 Nodes
    nodes = [
        {'name': 'Bottle', 'mesh': 0},
        {'name': 'Cap', 'mesh': 1}
    ]
    
    # Update GLTF structure
    gltf['accessors'] = accessors
    gltf['bufferViews'] = new_bvs
    gltf['meshes'] = meshes
    gltf['nodes'] = nodes
    gltf['scenes'][0]['nodes'] = [0, 1]
    
    # Images point to bufferViews 8, 9, 10
    gltf['images'][0]['bufferView'] = 8
    gltf['images'][1]['bufferView'] = 9
    gltf['images'][2]['bufferView'] = 10
    
    gltf['buffers'][0]['byteLength'] = len(new_bin)
    
    # Pack GLB
    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    while len(new_json_bytes) % 4 != 0:
        new_json_bytes += b' '
    while len(new_bin) % 4 != 0:
        new_bin.append(0)
        
    total_len = 12 + 8 + len(new_json_bytes) + 8 + len(new_bin)
    
    with open(output_path, "wb") as f:
        f.write(b'glTF')
        f.write(struct.pack('<I', 2))
        f.write(struct.pack('<I', total_len))
        f.write(struct.pack('<I', len(new_json_bytes)))
        f.write(b'JSON')
        f.write(new_json_bytes)
        f.write(struct.pack('<I', len(new_bin)))
        f.write(b'BIN\x00')
        f.write(new_bin)
        
    print(f"Successfully generated 2-part GLB at {output_path} (size: {total_len} bytes)")

if __name__ == '__main__':
    split_and_create_glb('src/assets/products/liver-booster.glb')

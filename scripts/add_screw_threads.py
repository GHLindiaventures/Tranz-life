import json
import struct
import math
import numpy as np

def build_threads_and_collar():
    # Further reduced width as requested:
    # r_neck reduced from 0.201 to 0.194
    # r_thread_bump reduced to 0.0035 (fine, subtle glass ridges)
    # r_collar_bump reduced to 0.004
    r_neck = 0.194
    r_thread_bump = 0.0035
    h_thread = 0.014
    
    y_collar = 0.485
    r_collar_bump = 0.004
    h_collar = 0.014
    
    # 1. Collar ring (transfer ring)
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
            nx /= length
            ny /= length
            nz /= length
            
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
            
    # 2. Helical Screw Threads
    n_turns = 2.5
    y_start = 0.53
    y_end = 0.71
    total_height = y_end - y_start
    pitch = total_height / n_turns
    
    thread_verts = []
    thread_normals = []
    thread_uvs = []
    thread_indices = []
    
    steps_per_turn = 72
    total_steps = int(n_turns * steps_per_turn)
    n_t_arc = 7
    
    vert_base_idx = len(collar_verts)
    
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
            i0 = vert_base_idx + s * n_t_arc + j
            i1 = vert_base_idx + s_next * n_t_arc + j
            i2 = vert_base_idx + s_next * n_t_arc + (j + 1)
            i3 = vert_base_idx + s * n_t_arc + (j + 1)
            thread_indices.extend([i0, i1, i2, i0, i2, i3])
            
    all_verts = collar_verts + thread_verts
    all_normals = collar_normals + thread_normals
    all_uvs = collar_uvs + thread_uvs
    all_indices = collar_indices + thread_indices
    
    return all_verts, all_normals, all_uvs, all_indices

def update_glb(input_path, output_path):
    with open(input_path, "rb") as f:
        magic = f.read(4)
        version = int.from_bytes(f.read(4), "little")
        total_len = int.from_bytes(f.read(4), "little")
        json_len = int.from_bytes(f.read(4), "little")
        json_type = f.read(4)
        json_data = f.read(json_len)
        bin_len = int.from_bytes(f.read(4), "little")
        bin_type = f.read(4)
        bin_data = f.read(bin_len)
        
    gltf = json.loads(json_data.decode("utf-8"))
    
    base_vert_count = 40164
    
    # Generate new reduced geometry
    new_verts, new_normals, new_uvs, new_indices = build_threads_and_collar()
    num_new_verts = len(new_verts)
    
    orig_indices_raw = bin_data[gltf['bufferViews'][0]['byteOffset']:gltf['bufferViews'][0]['byteOffset'] + 204888 * 4]
    orig_pos_raw = bin_data[gltf['bufferViews'][1]['byteOffset']:gltf['bufferViews'][1]['byteOffset'] + base_vert_count * 12]
    orig_uv_raw = bin_data[gltf['bufferViews'][2]['byteOffset']:gltf['bufferViews'][2]['byteOffset'] + base_vert_count * 8]
    orig_norm_raw = bin_data[gltf['bufferViews'][3]['byteOffset']:gltf['bufferViews'][3]['byteOffset'] + base_vert_count * 12]
    
    images_raw = [
        bin_data[gltf['bufferViews'][i]['byteOffset']:gltf['bufferViews'][i]['byteOffset'] + gltf['bufferViews'][i]['byteLength']]
        for i in range(4, 7)
    ]
    
    new_indices_bytes = bytearray(orig_indices_raw)
    for idx in new_indices:
        new_indices_bytes.extend(struct.pack('<I', base_vert_count + idx))
        
    new_pos_bytes = bytearray(orig_pos_raw)
    for x, y, z in new_verts:
        new_pos_bytes.extend(struct.pack('<fff', x, y, z))
        
    new_uv_bytes = bytearray(orig_uv_raw)
    for u, v in new_uvs:
        new_uv_bytes.extend(struct.pack('<ff', u, v))
        
    new_norm_bytes = bytearray(orig_norm_raw)
    for nx, ny, nz in new_normals:
        new_norm_bytes.extend(struct.pack('<fff', nx, ny, nz))
        
    new_bin_parts = [
        bytes(new_indices_bytes),
        bytes(new_pos_bytes),
        bytes(new_uv_bytes),
        bytes(new_norm_bytes)
    ] + images_raw
    
    new_bin = bytearray()
    new_bvs = []
    
    for i, part in enumerate(new_bin_parts):
        while len(new_bin) % 4 != 0:
            new_bin.append(0)
        offset = len(new_bin)
        length = len(part)
        new_bin.extend(part)
        
        orig_bv = gltf['bufferViews'][i]
        bv_dict = {
            'buffer': 0,
            'byteOffset': offset,
            'byteLength': length
        }
        if 'target' in orig_bv:
            bv_dict['target'] = orig_bv['target']
        new_bvs.append(bv_dict)
        
    gltf['bufferViews'] = new_bvs
    gltf['buffers'][0]['byteLength'] = len(new_bin)
    
    total_verts = base_vert_count + num_new_verts
    gltf['accessors'][0]['count'] = total_verts
    gltf['accessors'][1]['count'] = total_verts
    gltf['accessors'][2]['count'] = total_verts
    gltf['accessors'][3]['count'] = len(new_indices_bytes) // 4
    
    min_x = min(-0.302857, min(v[0] for v in new_verts))
    min_y = min(-0.951889, min(v[1] for v in new_verts))
    min_z = min(-0.302917, min(v[2] for v in new_verts))
    max_x = max(0.301897, max(v[0] for v in new_verts))
    max_y = max(0.950984, max(v[1] for v in new_verts))
    max_z = max(0.301865, max(v[2] for v in new_verts))
    gltf['accessors'][0]['min'] = [min_x, min_y, min_z]
    gltf['accessors'][0]['max'] = [max_x, max_y, max_z]
    gltf['accessors'][3]['max'] = [total_verts - 1]
    
    new_json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    while len(new_json_bytes) % 4 != 0:
        new_json_bytes += b' '
        
    while len(new_bin) % 4 != 0:
        new_bin.append(0)
        
    new_total_len = 12 + 8 + len(new_json_bytes) + 8 + len(new_bin)
    
    with open(output_path, "wb") as f:
        f.write(b'glTF')
        f.write(struct.pack('<I', 2))
        f.write(struct.pack('<I', new_total_len))
        f.write(struct.pack('<I', len(new_json_bytes)))
        f.write(b'JSON')
        f.write(new_json_bytes)
        f.write(struct.pack('<I', len(new_bin)))
        f.write(b'BIN\x00')
        f.write(new_bin)
        
    print(f"Successfully wrote {output_path} with slimmer width.")

if __name__ == '__main__':
    update_glb('src/assets/products/liver-booster.glb', 'src/assets/products/liver-booster.glb')

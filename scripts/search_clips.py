import subprocess
import json
import os

PROJECT_URL = 'https://invideo.io/@sadavasthula/botanical-pipeline'

queries = [
    ('01_sourcing', 'hands harvesting green herbs field'),
    ('02_extraction', 'essential oil distillation extraction'),
    ('03_formulation', 'chemical beaker liquid mixing'),
    ('04_testing', 'pipette drops laboratory test'),
    ('05_sensory', 'dropper amber bottle serum'),
    ('06_packaging', 'pharmaceutical bottles conveyor belt')
]

results = {}

for name, q in queries:
    cmd = f'invideo library search {PROJECT_URL} --library stock_video --query "{q}" --json'
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    try:
        data = json.loads(res.stdout)
        files = data.get('files', [])
        print(f"[{name}] query: '{q}' -> found {len(files)} clips")
        if files:
            best = files[0]
            print(f"   Top: {best.get('caption')} ({best.get('duration_s')}s)")
            results[name] = best
    except Exception as e:
        print(f"[{name}] error parsing JSON: {e}")
        print("stdout:", res.stdout[:200])

with open('scripts/found_clips.json', 'w') as f:
    json.dump(results, f, indent=2)

print("Saved found clips to scripts/found_clips.json")

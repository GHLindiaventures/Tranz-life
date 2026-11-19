import urllib.request
import re
import json

url = 'https://in.pinterest.com/pin/1131740581422759820/'
req = urllib.request.Request(
    url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
    }
)
try:
    with urllib.request.urlopen(req) as resp:why 
        html = resp.read().decode('utf-8', errors='ignore')
        with open('scratch_pin.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        title = re.search(r'<title>(.*?)</title>', html)
        print('TITLE:', title.group(1) if title else 'No title')
        
        for m in re.finditer(r'<meta\s+(?:property|name)=["\']([^"\']+)["\']\s+content=["\']([^"\']+)["\']', html):
            if any(k in m.group(1).lower() for k in ['video', 'title', 'description', 'image']):
                print(f'{m.group(1)}: {m.group(2)}')
                
        mp4s = list(set(re.findall(r'https://[^"\'\s]+\.mp4[^"\'\s]*', html)))
        print('MP4s found:', mp4s)
        
        m3u8s = list(set(re.findall(r'https://[^"\'\s]+\.m3u8[^"\'\s]*', html)))
        print('M3U8s found:', m3u8s)
except Exception as e:
    print('Error:', e)


#!/usr/bin/env python3
import argparse, base64, json, mimetypes, os, re, sys
from pathlib import Path
import requests

API_URL = 'https://openrouter.ai/api/v1/chat/completions'
DEFAULT_MODEL = 'google/gemini-3.1-flash-image-preview'

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--prompt', required=True)
    p.add_argument('--outdir', required=True)
    p.add_argument('--model', default=DEFAULT_MODEL)
    p.add_argument('--filename-prefix', default='generated_image')
    p.add_argument('--json', default='')
    p.add_argument('--system', default='')
    return p.parse_args()

def save_data_url(data_url: str, outdir: Path, prefix: str, idx: int) -> str:
    m = re.match(r'^data:(?P<mime>[^;]+);base64,(?P<data>.+)$', data_url, re.DOTALL)
    if not m:
        raise ValueError('Expected base64 data URL')
    mime = m.group('mime').lower().strip()
    data = base64.b64decode(m.group('data').strip())
    ext = mimetypes.guess_extension(mime) or '.bin'
    if ext == '.jpe':
        ext = '.jpg'
    path = outdir / f'{prefix}_{idx}{ext}'
    path.write_bytes(data)
    return str(path)

def main():
    args = parse_args()
    api_key = os.environ.get('OPENROUTER_API_KEY', '').strip()
    if not api_key:
        print('OPENROUTER_API_KEY is required', file=sys.stderr)
        sys.exit(2)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    messages = []
    if args.system.strip():
        messages.append({'role':'system','content':args.system.strip()})
    messages.append({'role':'user','content':args.prompt})
    payload = {
        'model': args.model,
        'messages': messages,
        'modalities': ['image','text']
    }
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    r = requests.post(API_URL, headers=headers, data=json.dumps(payload), timeout=240)
    r.raise_for_status()
    result = r.json()
    if args.json:
        Path(args.json).write_text(json.dumps(result, indent=2), encoding='utf-8')
    choices = result.get('choices') or []
    if not choices:
        print(json.dumps(result, indent=2))
        sys.exit(3)
    message = choices[0].get('message') or {}
    text = message.get('content', '')
    if isinstance(text, list):
        text = '\n'.join([part.get('text','') if isinstance(part, dict) else str(part) for part in text])
    (outdir/'response_text.txt').write_text((text or '') + '\n', encoding='utf-8')
    saved = []
    for idx, img in enumerate(message.get('images') or [], start=1):
        url = ((img or {}).get('image_url') or {}).get('url','')
        if url:
            saved.append(save_data_url(url, outdir, args.filename-prefix if False else args.filename_prefix, idx))
    print(json.dumps({'outdir': str(outdir), 'saved_images': saved, 'count': len(saved)}, indent=2))

if __name__ == '__main__':
    main()

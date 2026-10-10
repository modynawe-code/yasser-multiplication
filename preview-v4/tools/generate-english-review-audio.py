"""Generate the exact manifest text with Microsoft en-GB-RyanNeural.
Requires edge-tts and ffprobe. Run from any working directory; --check only validates.
Never skips an invalid existing file or changes review/answer text.
"""
import argparse
import asyncio
import json
from pathlib import Path
import ssl
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/modules/yasser/reviews/english-audio-manifest.js'

def inventory():
    code = f"import {{ENGLISH_AUDIO_CLIPS}} from {json.dumps(MANIFEST.as_uri())}; console.log(JSON.stringify(ENGLISH_AUDIO_CLIPS));"
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code], text=True))

def verify(path):
    if not path.exists() or path.stat().st_size < 1000:
        return False
    try:
        data = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_name', '-of', 'json', str(path)], text=True))
        return float(data['format']['duration']) > 0.2 and data['streams'][0]['codec_name'] == 'mp3'
    except (subprocess.CalledProcessError, KeyError, ValueError):
        return False

async def generate(clips):
    import edge_tts
    import edge_tts.communicate as communicate
    # Add the operating system's trusted roots without disabling TLS verification.
    roots = ssl.get_default_verify_paths().cafile
    if roots:
        communicate._SSL_CTX.load_verify_locations(roots)
    for index, clip in enumerate(clips):
        path = ROOT / clip['path']
        if not verify(path):
            path.parent.mkdir(parents=True, exist_ok=True)
            temp = path.with_suffix('.tmp.mp3')
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(clip['text'], 'en-GB-RyanNeural').save(str(temp))
                    if not verify(temp):
                        raise RuntimeError(f'Invalid generated audio: {path.name}')
                    temp.replace(path)
                    break
                except Exception:
                    if attempt == 2:
                        raise
        print(f'{index+1}/{len(clips)} {path.name}', flush=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    clips = inventory()
    if not args.check:
        asyncio.run(generate(clips))
    invalid = [clip['path'] for clip in clips if not verify(ROOT / clip['path'])]
    if invalid:
        raise SystemExit('Invalid/missing audio: ' + ', '.join(invalid))
    print(f'Validated {len(clips)} MP3 files (Ryan en-GB).')

import argparse
import asyncio
import json
import os
from pathlib import Path

VOICE = "ar-SA-HamedNeural"
RATE = "-4%"
VOLUME = "+0%"
PITCH = "-2Hz"
ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "build" / "voice" / "human-voice-recording-script.json"
SAMPLE_OUT = ROOT / "build" / "voice" / "saudi-voice-sample.mp3"


def parse_args():
    parser = argparse.ArgumentParser(description="Generate Saudi Arabic neural voice clips from the existing voice corpus.")
    parser.add_argument("--sample", action="store_true", help="Generate one sample only.")
    parser.add_argument("--force", action="store_true", help="Regenerate files that already exist.")
    parser.add_argument("--concurrency", type=int, default=3, help="Parallel synthesis requests (default: 3).")
    return parser.parse_args()


def load_inventory():
    if not INVENTORY.exists():
        raise SystemExit("Voice inventory is missing. Run: npm run voice:inventory")
    payload = json.loads(INVENTORY.read_text(encoding="utf-8"))
    return payload.get("items", [])


async def synthesize(edge_tts, text: str, output: Path, retries: int = 3):
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix(output.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            if temp.exists():
                temp.unlink()
            communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, volume=VOLUME, pitch=PITCH)
            await communicate.save(str(temp))
            if not temp.exists() or temp.stat().st_size < 512:
                raise RuntimeError("empty audio output")
            os.replace(temp, output)
            return
        except Exception:
            if temp.exists():
                temp.unlink(missing_ok=True)
            if attempt == retries:
                raise
            await asyncio.sleep(attempt * 1.5)


async def run_sample(edge_tts):
    text = "مرحبا يا خالد، جاهز نبدأ التحدي؟"
    await synthesize(edge_tts, text, SAMPLE_OUT)
    print(f"Saudi voice sample: {SAMPLE_OUT}")
    print(f"Voice: {VOICE}")


async def run_corpus(edge_tts, items, force: bool, concurrency: int):
    pending = []
    for item in items:
        asset = str(item.get("asset") or "").strip().replace("/", os.sep)
        text = str(item.get("text") or "").strip()
        if not asset or not text:
            continue
        output = ROOT / asset
        if output.exists() and not force:
            continue
        pending.append((text, output))

    total = len(pending)
    print(f"Saudi voice: {VOICE}")
    print(f"Corpus items: {len(items)}")
    print(f"Already present: {len(items) - total}")
    print(f"To generate: {total}")
    if not total:
        return

    semaphore = asyncio.Semaphore(max(1, min(6, concurrency)))
    completed = 0
    failed = []
    lock = asyncio.Lock()

    async def one(index, text, output):
        nonlocal completed
        async with semaphore:
            try:
                await synthesize(edge_tts, text, output)
            except Exception as exc:
                failed.append((str(output.relative_to(ROOT)), str(exc)))
            async with lock:
                completed += 1
                if completed == 1 or completed % 25 == 0 or completed == total:
                    print(f"Generated: {completed}/{total}")

    await asyncio.gather(*(one(i, text, output) for i, (text, output) in enumerate(pending, start=1)))
    if failed:
        print(f"Failed clips: {len(failed)}")
        for path, error in failed[:20]:
            print(f"  {path}: {error}")
        raise SystemExit(2)
    print("Saudi neural voice corpus complete.")


async def main():
    args = parse_args()
    try:
        import edge_tts
    except ImportError:
        raise SystemExit("Missing edge-tts. Install once with: py -m pip install --user edge-tts")

    if args.sample:
        await run_sample(edge_tts)
        return
    await run_corpus(edge_tts, load_inventory(), args.force, args.concurrency)


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""One-off DEVELOPMENT-ONLY Munajjam analysis of the exact bundled Al-Akhdar Fatiha MP3.

Output is *never* marked approved and is never loaded by the child's application.
Required: Munajjam + model dependencies, ffprobe, network for model download.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    audio = Path(args.audio).resolve(strict=True)
    data = audio.read_bytes()
    actual_sha = hashlib.sha256(data).hexdigest()
    if actual_sha != args.expected_sha256.lower():
        raise ValueError("Original bundled MP3 SHA-256 verification failed")

    duration = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio)],
        text=True,
    ).strip())
    if duration <= 0:
        raise ValueError("Invalid MP3 duration")

    # Do not send children's voices or private data. Only official bundled Quran audio.
    from munajjam.transcription import WhisperTranscriber
    from munajjam.data import load_surah_ayahs
    from munajjam.core import align

    print("Verified reciter audio SHA:", actual_sha, "Duration:", duration, flush=True)
    with WhisperTranscriber(device="cpu", model_type="faster-whisper") as transcriber:
        segments = transcriber.transcribe(str(audio), surah_id=1)
    print("Transcribed segments:", len(segments), flush=True)
    if not segments:
        raise RuntimeError("Munajjam returned no audio segments")

    ayahs = load_surah_ayahs(1)
    results = align(str(audio), segments, ayahs)
    output = []
    for item in results:
        output.append({
            "ayah_number": int(item.ayah.ayah_number),
            "start_time": float(item.start_time),
            "end_time": float(item.end_time),
            "similarity_score": float(item.similarity_score),
        })

    dest = Path(args.out)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Alignment candidate rows:", len(output), flush=True)
    print("Manual listening and verse-boundary review REQUIRED; NOT published.", flush=True)


if __name__ == "__main__":
    run()

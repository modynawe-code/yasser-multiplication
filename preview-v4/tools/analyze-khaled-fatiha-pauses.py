#!/usr/bin/env python3
"""Extract acoustic pause evidence from the exact original Al-Fatiha MP3.

No Qur'anic ayah timestamps are approved here. Silence breaks can also be breaths
*inside* an ayah and are NEVER sufficient by themselves to assign verse numbers.
Uses FFmpeg/ffprobe and Python standard library only (no ASR, no external upload).
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

START = re.compile(r"silence_start: ([0-9.]+)")
END = re.compile(r"silence_end: ([0-9.]+) \| silence_duration: ([0-9.]+)")


def find_pauses(audio, threshold_db, min_seconds):
    proc = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-i", str(audio),
         "-af", f"silencedetect=noise={threshold_db}dB:d={min_seconds}",
         "-f", "null", "-"],
        capture_output=True, text=True, timeout=45, check=False,
    )
    if proc.returncode:
        raise RuntimeError("ffmpeg silence detection failed: " + proc.stderr[-900:])
    pauses = []
    current = None
    for line in proc.stderr.splitlines():
        match_start = START.search(line)
        if match_start:
            current = float(match_start.group(1))
        match_end = END.search(line)
        if match_end and current is not None:
            end = float(match_end.group(1))
            if end > current:
                pauses.append({"start": round(current, 3),
                               "end": round(end, 3),
                               "length": round(end-current, 3),
                               "middle": round((current+end)/2, 3)})
            current = None
    return pauses


def inspect(audio, expected_sha):
    actual = hashlib.sha256(audio.read_bytes()).hexdigest()
    if actual != expected_sha:
        raise ValueError("original-file-sha256-mismatch")
    duration = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(audio)],
        text=True, timeout=15,
    ).strip())
    if not 0 < duration < 600:
        raise ValueError("unexpected-fatiha-duration")
    scenarios = []
    for threshold in [-38, -33, -28]:
        detected = find_pauses(audio, threshold, 0.16)
        interior = [p for p in detected if p["start"] > 0.4
                    and p["end"] < duration-0.4]
        scenarios.append({
            "thresholdDb": threshold, "minSilenceSeconds": 0.16,
            "interiorPauses": interior,
            "count": len(interior),
        })
    return {
        "status": "REQUIRES_HUMAN_AUDIO_REVIEW",
        "surah": 1, "reciter": "Ibrahim Al-Akhdar",
        "audioSha256": actual, "durationSeconds": round(duration, 4),
        "method": "ffmpeg silencedetect; NOT verse identification",
        "scenarios": scenarios,
        "warning": "Acoustic silences include breaths and intra-verse stops. "
                   "They are neither approved ayah boundaries nor playback metadata.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", required=True)
    parser.add_argument("--expected-sha256", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    report = inspect(Path(args.audio), args.expected_sha256.lower())
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Original audio verified", report["audioSha256"], report["durationSeconds"])
    for scenario in report["scenarios"]:
        print("Threshold", scenario["thresholdDb"], "pauses", scenario["count"])
        for pause in scenario["interiorPauses"]:
            print("  ", pause)
    print("NO VERSE TIMES APPROVED; human listening remains required.")


if __name__ == "__main__":
    main()

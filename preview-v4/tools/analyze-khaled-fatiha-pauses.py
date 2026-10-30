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


def build_review_cues(scenarios, duration, *, audio_sha):
    """Propose timing cuts only when three independent dB thresholds agree.

    This identifies acoustic pauses, NOT recognized Quran verse boundaries.
    Six stable cuts are necessary for seven tentative Al-Fatiha spans.
    """
    if not isinstance(audio_sha, str) or len(audio_sha) != 64:
        raise ValueError("verified-audio-sha-required")
    if not 0 < duration < 600 or len(scenarios) < 3:
        raise ValueError("invalid-acoustic-evidence")
    groups = []
    for scenario in scenarios:
        threshold = scenario["thresholdDb"]
        if any(threshold in group["votes"] for group in groups):
            raise ValueError("duplicate-threshold")
        for pause in scenario["interiorPauses"]:
            middle = float(pause["middle"])
            match = next((g for g in groups if abs(g["center"]-middle) < 0.35
                          and threshold not in g["votes"]), None)
            if match is None:
                groups.append({"center": middle, "centers": [middle],
                               "votes": {threshold}})
            else:
                match["centers"].append(middle)
                match["votes"].add(threshold)
                match["center"] = sum(match["centers"]) / len(match["centers"])
    stable = sorted((g for g in groups if len(g["votes"]) == len(scenarios)),
                    key=lambda g: g["center"])
    if len(stable) != 6:
        raise ValueError(f"need-six-stable-pauses-found-{len(stable)}")
    cuts = [round(g["center"], 3) for g in stable]
    if any(b-a < 2.0 for a, b in zip(cuts, cuts[1:])):
        raise ValueError("acoustic-cuts-too-close")
    if cuts[0] < 1.0 or duration-cuts[-1] < 2.0:
        raise ValueError("missing-leading-or-last-verse-duration")
    # Deliberately include original lead-in and tail: trimming a sacred
    # syllable is less acceptable than a review player having extra silence.
    boundaries = [0.0] + cuts + [round(duration, 4)]
    return [{
        "ayahKey": f"1:{idx+1}", "startMs": round(boundaries[idx]*1000),
        "endMs": round(boundaries[idx+1]*1000),
        "reviewStatus": "ACOUSTIC_ONLY_UNVERIFIED",
    } for idx in range(7)]


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
    proposed = build_review_cues(scenarios, duration, audio_sha=actual)
    return {
        "status": "REQUIRES_HUMAN_AUDIO_REVIEW",
        "surah": 1, "reciter": "Ibrahim Al-Akhdar",
        "audioSha256": actual, "durationSeconds": round(duration, 4),
        "method": "ffmpeg silencedetect; NOT verse identification",
        "scenarios": scenarios,
        "proposedReviewCues": proposed,
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
    print("Review-only candidate cues:", report["proposedReviewCues"])
    print("NO VERSE TIMES APPROVED; human listening remains required.")


if __name__ == "__main__":
    main()

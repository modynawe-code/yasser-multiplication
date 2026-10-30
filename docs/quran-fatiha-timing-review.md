# Al-Fatiha alignment — human verification gate

Scope: the already-bundled `preview-v4/assets/recitation/ibrahim-al-akhdar-hafs-1-al-fatiha.mp3` (Ibrahim Al-Akhdar, Hafs). This is **not** a Quran-player feature release.

## Generated evidence
- Experiment: `.github/workflows/khaled-fatiha-alignment.yml` pins the Itqan Munajjam source commit and runs only for its own workflow-file push.
- Only an alignment JSON candidate is uploaded as a GitHub Actions artifact. The approved Quran MP3 is read from the existing repository; the workflow does not replace or alter that source.
- Raw: `analysis-output/fatiha-munajjam-raw.json`; SHA-checked candidate: `analysis-output/fatiha-human-review-candidate.json`.
- These files MUST remain outside the child-facing runtime. The candidate status must stay `REQUIRES_HUMAN_AUDIO_REVIEW`.

## Manual listening — REQUIRED for each verse
- [ ] Confirm the actual local MP3 SHA256 equals the manifest SHA256. Verify its duration with `ffprobe`.
- [ ] Seven entries exactly, surah 1 verses 1–7 in order; all starts/ends positive, increasing and within the MP3 duration.
- [ ] Listen to **each of the seven intervals** with at least 0.4 seconds context before and after every boundary. Confirm the first phoneme and last phoneme of the verse are not clipped.
- [ ] Confirm boundaries do not include recitation from adjacent verses, repeated invocations, silence-only sections or spoken introductory material.
- [ ] Review long vowels, prolonged final consonants, the last verse's ending and any intentional pause that might affect repetition.
- [ ] Correct mistaken intervals manually only against the same original audio; record old/new timings with an audit explanation. Similarity score alone cannot approve Quran content.
- [ ] Verify repeated playback at 1, 3 and 5 repetitions, pause/resume, seek, stop and navigation back. The track must never continue after switching children.
- [ ] Test on actual Galaxy Tab and iPad/iPhone (both orientations where relevant), with slow network, offline/reconnect, RTL and large touch controls.
- [ ] Verify that Yasser's and Mashaal's original Quran paths, lessons, records and all learner progress are unchanged.

## Release contract
Do **not** copy inferred timestamps into the live application, add new data migrations, mark GitHub issue #94 completed or merge draft PR #93 until all seven verses pass a human source/audio review plus the device tests. Any activation must occur in its own minimal, independently testable commit, with a source-file SHA256 pin and a rollback path.

References: https://github.com/Itqan-community/Munajjam and https://github.com/modynawe-code/yasser-multiplication/issues/94

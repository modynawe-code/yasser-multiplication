"""Unit tests for conservative six-pause consensus. Synthetic timing only."""
import importlib.util
import pathlib
import unittest

module = pathlib.Path(__file__).with_name("analyze-khaled-fatiha-pauses.py")
spec = importlib.util.spec_from_file_location("fatiha_pauses", module)
acoustic = importlib.util.module_from_spec(spec)
spec.loader.exec_module(acoustic)


def report(*, include_spurious=False, missing=False):
    positions = [13.2, 20.0, 25.6, 31.5, 39.2, 45.8]
    rows = []
    for idx, level in enumerate([-38, -33, -28]):
        observations = positions[:-1] if missing and idx == 2 else positions
        pauses = [{"middle": v+(idx-1)*0.08} for v in observations]
        if include_spurious and idx == 2:
            pauses.append({"middle": 6.952})
        rows.append({"thresholdDb": level, "interiorPauses": pauses})
    return rows


class FatihaReviewCues(unittest.TestCase):
    def test_six_stable_verses_from_three_independent_thresholds(self):
        cues = acoustic.build_review_cues(report(include_spurious=True), 64.9568,
                                           audio_sha="a"*64)
        self.assertEqual(len(cues), 7)
        self.assertEqual(cues[0]["startMs"], 0)
        self.assertEqual(cues[-1]["endMs"], 64957)
        self.assertEqual([x["endMs"] for x in cues[:-1]],
                         [13200, 20000, 25600, 31500, 39200, 45800])
        self.assertTrue(all(x["reviewStatus"] == "ACOUSTIC_ONLY_UNVERIFIED" for x in cues))

    def test_missing_independent_confirmation_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "need-six-stable-pauses"):
            acoustic.build_review_cues(report(missing=True), 65, audio_sha="a"*64)

    def test_no_source_hash_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "verified-audio-sha"):
            acoustic.build_review_cues(report(), 65, audio_sha="")

    def test_large_disagreement_is_rejected(self):
        rows = report()
        rows[2]["interiorPauses"][2]["middle"] += 1.0
        with self.assertRaisesRegex(ValueError, "need-six-stable-pauses"):
            acoustic.build_review_cues(rows, 65, audio_sha="a"*64)


if __name__ == "__main__":
    unittest.main()

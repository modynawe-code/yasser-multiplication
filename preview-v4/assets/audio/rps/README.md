# RPS recorded audio

This folder is the source-of-truth for human-recorded Rock–Paper–Scissors audio.

Required filenames:

- `turn-yasser.mp3` — short human line announcing Yasser's turn.
- `turn-khaled.mp3` — short human line announcing Khaled's turn.
- `point-yasser.mp3` — short human line announcing Yasser won the round.
- `point-khaled.mp3` — short human line announcing Khaled won the round.
- `draw.mp3` — short human line announcing a draw.
- `win-yasser.mp3` — short human line announcing Yasser won the match.
- `win-khaled.mp3` — short human line announcing Khaled won the match.
- `sfx-choose.mp3` — brief physical selection/click effect.
- `sfx-reveal.mp3` — brief reveal/impact effect.
- `sfx-point.mp3` — brief point-award effect.

Do not synthesize child-facing game voice with Web Speech, Android TTS, oscillators, or generated tones. Missing clips fail silently so the game remains playable until approved recordings are supplied. Dynamic educational questions continue to use the app's separate speech service.

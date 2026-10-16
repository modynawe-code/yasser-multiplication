# Domino reference implementation contract

Reference: `andrew1407/Domino` pinned at commit `3b483ad5eb07c399801cf35582590082fc2f32b4` (MIT).

This contract is the acceptance baseline for the family Domino experience.

## Non-negotiable implementation rules

1. Vendor all 28 Double-Six SVG tile assets locally under `assets/domino/tiles`; runtime must not hotlink the upstream repository.
2. Use the upstream path-placement approach (`drawing.js`, `tilePosition.js`, `deck.js`, `iteartors.js`) as the reference for connected turns, adapted only for this responsive family UI.
3. The opening tile is always visually horizontal, including an opening double.
4. Every later tile must physically touch its neighboring tile; row/segment changes must be real connected 90-degree turns, never detached groups.
5. A later double is perpendicular to the local chain direction.
6. The board must fit the full Double-Six set without horizontal scrolling or clipping on supported layouts; scaling is allowed when necessary.
7. If a tile can play on both ends and both ends expose the same value, choose the less crowded visual side automatically. If the ends differ, select the tile and let the child tap a highlighted board endpoint; do not show a separate left/right text picker.
8. Round-complete state replaces the hand area as already implemented.
9. Recalculate the board path after a board resize without changing gameplay state.
10. Do not change the backend game rules, online room/session protocol, or persistence as part of this visual/interaction repair.

## Required validation

- Short chain remains connected.
- Long chain turns and remains connected.
- 28-tile capacity stays inside phone, Galaxy Tab portrait/landscape, and desktop board bounds.
- Opening double is horizontal.
- Later double is perpendicular.
- Equivalent two-end move is automatic.
- Strategic two-end move uses the board endpoints.
- No horizontal board scrollbar.
- Local SVG set contains all 28 expected files.
- Targeted tests and project CI must pass before this work is considered complete.

Actual device/browser visual verification remains required; passing code/tests alone is not a claim that a physical device was visually inspected.

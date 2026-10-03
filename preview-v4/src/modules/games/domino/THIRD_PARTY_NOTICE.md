# Third-party notice — Domino engine and tile artwork

The family Domino implementation adapts the classic game-rule flow and frontend board-placement approach from the open-source project `andrew1407/Domino`:

https://github.com/andrew1407/Domino

The upstream source is pinned for this integration at commit:

`3b483ad5eb07c399801cf35582590082fc2f32b4`

The adapted backend engine is implemented in `backend/src/domino-classic-engine.mjs` and follows the upstream classic behavior for the double-six deck, deal size, automatic opening move, move validation/orientation, drawing, automatic skipping when the stock is empty, and dead-end detection.

Relevant upstream backend sources include:

- `server/src/gameSession/classicDomino.service.ts`
- `server/src/gameSession/entities/DominoTile.ts`
- `server/src/gameSession/gameSession.gateway.ts`
- `server/src/gameSession/storage/storage.service.ts`

The frontend also vendors the upstream Double-Six tile artwork locally. The 28 SVG files under `preview-v4/assets/domino/tiles/` come from:

- `client/public/static/tiles/0-0.svg` through `client/public/static/tiles/6-6.svg`

The responsive connected board layout is adapted from the upstream placement concepts in:

- `client/src/canvas/drawing.js`
- `client/src/canvas/tilePosition.js`
- `client/src/canvas/deck.js`
- `client/src/canvas/iteartors.js`

Family-specific changes include a horizontal opening tile, responsive board scaling, shorter turn segments for phone/tablet boards, automatic equivalent-end placement, and direct endpoint selection when the side choice is strategically meaningful.

The upstream project is distributed under the MIT License:

MIT License

Copyright (c) 2021 Andrew1407

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

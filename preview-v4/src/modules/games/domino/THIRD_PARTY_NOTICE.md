# Third-party notice — Domino engine

The family Domino implementation adapts the classic game-rule flow from the open-source project `andrew1407/Domino`:

https://github.com/andrew1407/Domino

The adapted backend engine is implemented in `backend/src/domino-classic-engine.mjs` and follows the upstream classic behavior for the double-six deck, deal size, automatic opening move, move validation/orientation, drawing, automatic skipping when the stock is empty, and dead-end detection.

Relevant upstream sources include:

- `server/src/gameSession/classicDomino.service.ts`
- `server/src/gameSession/entities/DominoTile.ts`
- `server/src/gameSession/gameSession.gateway.ts`
- `server/src/gameSession/storage/storage.service.ts`

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

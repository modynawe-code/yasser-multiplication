# Arabic Figma Monopoly assets

SVG adaptations of the supplied Figma kit, kept with the game.

- `board.svg`: Arabic 40-space board reference based on the Figma Simple Template. The live board stays DOM-rendered for tokens, ownership, movement, and controls.
- `property-cards.svg`: 28-card reference sheet. Labels and purchase prices were checked against the current `BOARD` data. Live rent, build costs, and ownership remain sourced from `monopoly-engine.js`.
- `chance-community-cards.svg`: translated Figma card faces. The game uses live card text and derives the effect summary from the pending engine card.
- `../../figma-cards.css`: applies the Figma card structure and palette to dynamic cards.

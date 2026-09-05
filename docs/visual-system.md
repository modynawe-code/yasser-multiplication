# V4.2 Visual System

## Purpose
The visual layer must remain independent from learning logic, storage, reporting and future backend integrations.

## Character roles
- Yasser is the primary learning character.
- Calculator is the secondary helper.
- Characters never determine application state; UI state selects a visual asset.

## Yasser states
- welcome
- thinking
- encourage
- success
- mastery

## Assistant states
- neutral
- thinking
- success

## Asset policy
- WebP with transparency for runtime delivery.
- Original high-resolution generated assets are not coupled to component logic.
- UI references semantic state names rather than generation filenames.
- Assets should remain replaceable without changing training or mastery code.

## Motion policy
Motion is short, optional and disabled by `prefers-reduced-motion`. No continuous distracting animation during exams.

## Performance
Character assets are loaded only where needed and kept small enough for tablet/mobile PWA use.

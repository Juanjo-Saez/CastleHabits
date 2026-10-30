# Runtime Validation Report

**Generated**: 2026-10-30  
**Target**: CastleHabits — castillo pixel-art (`openspec/changes/castle-pixel-art-asset/`)

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Startup | PASS | 0 | Vite dev server at `http://127.0.0.1:5173`, Castillo page served |
| Unit/integration tests | PASS | 0 | `npm test`: 113 passed, 0 failed (5 new asset tests) |
| TypeScript | PASS | 0 | `npx tsc -b` |
| Production build | PASS | 0 | `npm run build`; only the existing >500 kB chunk warning |
| Focused lint | PASS | 0 | ESLint on changed source, test and script files |
| Diff validation | PASS | 0 | `git diff --check` |
| Browser validation | PASS | 0 | Headless Edge (Playwright for Python), clean profile per capture |

**Overall**: PASS

## Asset

- `src/assets/castle.png`: indexed PNG, `738×414`, 50.6 KB, binary transparency.
- Generated from `art/references/castle-reference.png` by `scripts/extract-castle.py`.
- Bundled as a hashed asset and precached by the PWA; neither reference image
  is published in `public/` nor present in `dist/` or `sw.js`.

## Browser Evidence

- Viewports: `390×844`, `768×1024`, `1024×768`, `1440×900`.
- The central tower stays on the horizontal centre in every viewport; on mobile
  the asset renders at `1053×591` and crops its sides symmetrically.
- The moon stays `112×112 px` and above the spires in every viewport.
- `clear`, `clouded`, `fog`, `rain`, `storm` and `eclipse` render over the
  castle without hiding it; the backlight tints cold, violet (eclipse) or red (boss).
- Active boss: `data-weather="boss"`, blood moon, storm, and the boss sprite
  centred on the moon (mobile `301.5` vs `303`; desktop `851.5` vs `852`).
- The boss dialog banner renders the castle behind the boss.
- Keyboard: the first Tab reaches the boss, Enter opens its dialog, Escape closes it.
- The castle layer has `pointer-events: none` and `image-rendering: pixelated`;
  hit-testing over it returns the interactive scene, not the image.
- `prefers-reduced-motion: reduce` reduces storm, clouds, stars, bats and boss
  float animations to `0.001ms` while keeping the composition.

## Environment

- Node.js `v22.23.2`; Python `3.14.7` with Pillow, NumPy and Playwright
  (installed for the asset pipeline and validation only, not app dependencies).
- npm registry unreachable from this network, so browser automation used
  Playwright for Python driving the installed Microsoft Edge.
- Docker not required: client-side visual change with no infrastructure.

## Known Issues

- Vite still warns that the main JavaScript chunk exceeds 500 kB after
  minification; unrelated to this change.
- On some viewports the moon overlaps the right end of the sky subtitle; this
  layout predates the change and was not modified.

# Runtime Validation Report

**Target**: CastleHabits — sustitución por la composición completa del Castillo

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Unit tests | PASS | 0 | `npm test`: 116 passed, 0 failed |
| TypeScript and production build | PASS | 0 | `npm run build` (`tsc -b` + Vite) |
| Focused lint | PASS | 0 | ESLint on changed components and test |
| Full lint | FAIL | 1 | Existing `react-hooks/set-state-in-effect` in `src/components/NumberField.tsx:27`, untouched by this change |
| Browser visual review | PASS | 0 | Local Vite app reviewed at four responsive viewports |
| Diff validation | PASS | 0 | `git diff --check` |

## Asset

- Runtime asset: `src/assets/castle-scene.webp`, lossless WebP, `1367×768`,
  approximately 825 KB.
- The original is retained at `art/references/castle-scene-reference.png`;
  it is outside `public/`.
- The prior transparent castle crop, geometry helper, and extraction script
  have been removed.
- Production build includes the WebP in the app bundle and PWA precache.

## Browser Evidence

- Viewports checked: `390×844`, `768×1024`, `1024×768`, `1440×900`.
- The scene image fills each viewport; the page has no horizontal or vertical
  overflow at those sizes.
- The application moon remains a separate `112×112 px` overlay.
- Desktop and mobile screenshots show the new full-scene composition, with the
  central tower prioritized by `object-position: 55% center`.
- The boss dialog was not triggered in the browser; its full-scene background
  and moon stacking order are covered by the focused asset test.
- Dynamic weather and boss layers remain separate from the static image.

## Known Issues

- Full-project ESLint remains blocked by the unrelated existing error in
  `src/components/NumberField.tsx:27`.
- Vite reports the existing main JavaScript chunk exceeds 500 kB after
  minification; the new scene asset is 825 KB and lossless.

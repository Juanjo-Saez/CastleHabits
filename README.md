# Hábitos

## Corregir hoy y ayer

En **Calendario**, pulsa **Corregir ayer** o **Hoy** y abre **Corregir este día**. También hay un acceso desde **Castillo → Recientes**. Se pueden marcar y desmarcar obligaciones, hábitos y misiones secundarias, o guardar la cantidad total de una aparición.

- El día cambia a las **02:00**. Los días anteriores a ayer y los registros de expediciones terminadas no se pueden corregir.
- Se ajustan EXP, oro, vida, defensas usadas en los fallos de ayer, rachas y rutas. Los niveles del personaje ya alcanzados se conservan; al desmarcar se resta solo la EXP disponible.
- No se permite retirar oro ya gastado. Una corrección que causa la muerte requiere confirmación y no puede deshacerse después.
- Las tareas con margen mantienen un solo registro acumulado. Para corregirlo hay que abrir su día; no se puede duplicar en otro día. El avance normal de una tarea cuantitativa con margen sigue disponible aunque comenzara antes de ayer.
- Los perfiles antiguos requieren confirmar que hoy y ayer pertenecen a la expedición actual antes de habilitar la edición. No se borran datos. En nuevas expediciones el inicio se registra automáticamente.
- Las correcciones se guardan en IndexedDB y se incluyen en las copias de seguridad. Esta versión no añade todavía el resumen diario animado.

## Validación

Con Node.js 24, `npm test` ejecuta las pruebas de corrección con el runner integrado de Node y el bundler de Vite, sin añadir dependencias de pruebas. `npm run build` comprueba tipos y genera la aplicación; `npm run lint` ejecuta ESLint.

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

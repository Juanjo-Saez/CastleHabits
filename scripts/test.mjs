import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'

// Usa el mismo bundler que la app para TypeScript y los paquetes CommonJS.
const output = mkdtempSync(join(tmpdir(), 'castlehabits-tests-'))
try {
  await build({
    configFile: false,
    logLevel: 'error',
    ssr: { noExternal: true },
    build: {
      ssr: 'tests/dayCorrections.test.mjs',
      outDir: output,
      emptyOutDir: false,
      copyPublicDir: false,
      rolldownOptions: { output: { entryFileNames: 'dayCorrections.test.mjs' } },
    },
  })
  const result = spawnSync(process.execPath, ['--test', join(output, 'dayCorrections.test.mjs')], { stdio: 'inherit' })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(output, { recursive: true })
}

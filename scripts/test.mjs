import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'

const suites = ['dayCorrections', 'dailySummary', 'bosses', 'castleAsset', 'eclipse', 'moon']

// Usa el mismo bundler que la app para TypeScript y los paquetes CommonJS.
const output = mkdtempSync(join(tmpdir(), 'castlehabits-tests-'))
try {
  for (const suite of suites) {
    await build({
      configFile: false,
      logLevel: 'error',
      ssr: { noExternal: true },
      build: {
        ssr: `tests/${suite}.test.mjs`,
        outDir: output,
        emptyOutDir: false,
        copyPublicDir: false,
        rolldownOptions: { output: { entryFileNames: `${suite}.test.mjs` } },
      },
    })
  }
  const result = spawnSync(
    process.execPath,
    ['--test', ...suites.map((suite) => join(output, `${suite}.test.mjs`))],
    { stdio: 'inherit' },
  )
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(output, { recursive: true })
}

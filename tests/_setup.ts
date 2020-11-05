import * as fs from 'fs-jetpack'
import * as Path from 'path'
import * as tsm from 'ts-morph'
import * as ts from 'typescript'
;(global as any).TS_FORMAT_PROJECT_ROOT = 'src/'

const formatTSDiagonsticsForJest = (diagnostics: readonly ts.Diagnostic[]): string => {
  const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  }

  const tsReport = ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)

  const sourcePath = process.cwd() + '/' + (((global as any).TS_FORMAT_PROJECT_ROOT as string) || '')

  const summaryReport = `${diagnostics.length} Type Error(s):\n\n${diagnostics
    .map((d) => (d.file ? d.file.fileName.replace(sourcePath, '') : '<unknown file>'))
    .join('\n')}`

  const jestReport = `${summaryReport}\n\n${tsReport}`

  return jestReport
}

expect.extend({
  toTypeCheck(input: string | string[] | { rootDir: string }, compilerOptions: tsm.CompilerOptions) {
    let rootDir
    let fileNames: string[]
    if (typeof input !== 'string' && !Array.isArray(input)) {
      rootDir = input.rootDir
      fileNames = []
    } else {
      fileNames = Array.isArray(input) ? input : [input]
      rootDir = Path.dirname(fileNames[0])
    }

    // check for tsconfig
    let tsConfigFilePath
    const maybeTsConfigFilePath = `${rootDir}/tsconfig.json`
    if (fs.exists(maybeTsConfigFilePath)) {
      tsConfigFilePath = maybeTsConfigFilePath
    }

    const project = new tsm.Project({
      tsConfigFilePath,
      compilerOptions,
      addFilesFromTsConfig: true,
    })

    if (fileNames.length) {
      project.addSourceFilesAtPaths(fileNames)
    }

    const preEmitDiagnostics = project.getPreEmitDiagnostics()
    const emitDiagnostics = project.emitSync().getDiagnostics()

    const pass = preEmitDiagnostics.length === 0 && emitDiagnostics.length === 0

    return {
      message: () =>
        pass
          ? 'expected program to not typecheck'
          : project.formatDiagnosticsWithColorAndContext(preEmitDiagnostics) +
            '\n\n\n' +
            project.formatDiagnosticsWithColorAndContext(emitDiagnostics),
      pass,
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toTypeCheck(config: ts.CompilerOptions): R
    }
  }
}

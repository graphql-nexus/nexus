import ts from 'typescript'
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
  toTypeCheck(fileNames: string[], config: ts.CompilerOptions) {
    const diagnostics = ts.createProgram(fileNames, config).emit().diagnostics

    const pass = diagnostics.length === 0

    return {
      message: () => (pass ? 'expected program to not typecheck' : formatTSDiagonsticsForJest(diagnostics)),
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

import * as fs from 'fs-jetpack'
import * as Path from 'path'
import * as tsm from 'ts-morph'
import * as ts from 'typescript'
;(global as any).TS_FORMAT_PROJECT_ROOT = 'src/'

export function typeCheck(
  input: string | string[] | { rootDir: string },
  compilerOptions: tsm.CompilerOptions = { outDir: `/tmp/nexus-integration-test-${Date.now()}` }
) {
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

  return {
    project,
    emitDiagnostics,
    preEmitDiagnostics,
  }
}

expect.extend({
  toTypeCheck(input: string | string[] | { rootDir: string }, compilerOptions: tsm.CompilerOptions) {
    const { project, emitDiagnostics, preEmitDiagnostics } = typeCheck(input, compilerOptions)

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
  toNotTypeCheck(
    input: string | string[] | { rootDir: string },
    compilerOptions: tsm.CompilerOptions,
    predicate?: (args: {
      project: tsm.Project
      emitDiagnostics: tsm.Diagnostic<tsm.ts.Diagnostic>[]
      preEmitDiagnostics: tsm.Diagnostic<tsm.ts.Diagnostic>[]
    }) => boolean
  ) {
    const { project, emitDiagnostics, preEmitDiagnostics } = typeCheck(input, compilerOptions)

    const pass = predicate
      ? predicate({ project, emitDiagnostics, preEmitDiagnostics })
      : preEmitDiagnostics.length > 0 || emitDiagnostics.length > 0

    return {
      message: () => (pass ? 'all good' : 'expected program to not typecheck'),
      pass,
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toTypeCheck(config: ts.CompilerOptions): R
      toNotTypeCheck(config: ts.CompilerOptions): R
    }
  }
}

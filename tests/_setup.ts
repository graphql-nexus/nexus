import ts from "typescript";

expect.extend({
  toTypeCheck(fileNames: string[], config: ts.CompilerOptions) {
    const diagnostics = ts.createProgram(fileNames, config).emit().diagnostics;

    const formatHost: ts.FormatDiagnosticsHost = {
      getCanonicalFileName: (path) => path,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getNewLine: () => ts.sys.newLine,
    };

    const pass = diagnostics.length === 0;

    return {
      message: () =>
        pass
          ? "expected program to not typecheck"
          : ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
      pass,
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toTypeCheck(config: ts.CompilerOptions): R;
    }
  }
}

import ts from "typescript";

export const compileTypescript = (fileNames: string[]) => {
  const diagnostics = ts
    .createProgram(fileNames, {
      sourceMap: false,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      target: ts.ScriptTarget.ES5,
      outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      noErrorTruncation: false,
    })
    .emit().diagnostics;

  const formatHost: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };

  if (diagnostics.length > 0) {
    console.log(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)
    );
    throw new Error(
      `TypeScript failed to compile with ${diagnostics.length} errors`
    );
  }
};

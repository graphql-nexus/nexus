import ts from "typescript";

const printTypescriptErrors = (diagnotics: ReadonlyArray<ts.Diagnostic>) => {
  diagnotics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
      );
    }
  });
};

export const compileTypescript = (fileNames: string[]) => {
  const errors = ts
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

  if (errors.length > 0) {
    printTypescriptErrors(errors);
    throw new Error(
      `TypeScript failed to compile with ${errors.length} errors`
    );
  }
};

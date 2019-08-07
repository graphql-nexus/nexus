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
      // moduleResolution:
      sourceMap: false,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      // lib: ["esnext", "dom"],
      target: ts.ScriptTarget.ES5,
      // module: ts.ModuleKind.CommonJS,
      // outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      outDir: __dirname,
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

import { join } from "path";
import { generateSchema as doGenerateSchema } from "../../src/builder";
import ts from "typescript";
import { unlinkSync } from "fs";

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

export const testSchema = (name: string) => {
  it(`can be compiled with types generated from ${name} schema`, async () => {
    const appFilePath = join(__dirname, `./_${name}.ts`);
    const typegenFilePath = join(__dirname, `./${name}.d.ts`);
    await doGenerateSchema({
      types: require(`./_${name}`),
      outputs: {
        typegen: typegenFilePath,
        schema: false,
      },
    });

    try {
      compileTypescript([appFilePath, typegenFilePath]);
    } finally {
      unlinkSync(typegenFilePath);
    }
  });
};

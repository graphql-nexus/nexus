import { join } from "path";
import { generateSchema as doGenerateSchema } from "../../src/builder";
import ts from "typescript";

export const testSchema = (name: string) => {
  it(`can be compiled with types generated from ${name} schema`, async () => {
    const appFilePath = join(__dirname, `./_${name}.ts`);
    const typegenFilePath = `/tmp/nexus-integration-test-typegen-${name}-${Date.now()}.d.ts`;
    await doGenerateSchema({
      types: require(`./_${name}`),
      outputs: {
        typegen: typegenFilePath,
        schema: false,
      },
    });

    expect([appFilePath, typegenFilePath]).toTypeCheck({
      sourceMap: false,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      target: ts.ScriptTarget.ES5,
      outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      noErrorTruncation: false,
    });
  });
};

/// <reference path="../_setup.ts" />
import { join } from "path";
import { generateSchema } from "../../src/builder";
import ts from "typescript";
import { typegenFormatPrettier } from "../../src/core";

export const testSchema = (name: string) => {
  it(`can compile ${name} app with its typegen`, async () => {
    const appFilePath = join(__dirname, `./_${name}.ts`);
    const typegenFilePath = join(__dirname, `_${name}.typegen.ts`);
    await generateSchema({
      types: require(`./_${name}`),
      outputs: {
        typegen: typegenFilePath,
        schema: false,
      },
      async formatTypegen(content, type) {
        const result = await typegenFormatPrettier({})(content, type);
        return result.replace('"nexus"', '"../.."');
      },
    });

    expect([appFilePath]).toTypeCheck({
      sourceMap: false,
      downlevelIteration: true,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      target: ts.ScriptTarget.ES5,
      outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      noErrorTruncation: false,
    });
  });
};

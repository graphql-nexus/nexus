/// <reference path="../_setup.ts" />
import { join } from "path";
import { core } from "../..";
import * as ts from "typescript";
const { generateSchema, typegenFormatPrettier } = core;

const NO_OP = () => {};

export const testSchema = (
  name: string,
  additionalTests: (getSchema: () => core.NexusSchema) => void = NO_OP
) => {
  let schema: core.NexusSchema;
  const typegenFilePath = join(__dirname, `_${name}.typegen.ts`);
  const { plugins, ...rest } = require(`./_${name}`);

  beforeAll(async () => {
    schema = await generateSchema({
      types: rest,
      outputs: {
        typegen: typegenFilePath,
        schema: false,
      },
      plugins: plugins || [],
      async formatTypegen(source, type) {
        const content = await typegenFormatPrettier({
          trailingComma: "es5",
          arrowParens: "always",
        })(source, type);
        return content.replace('"nexus"', '"../.."');
      },
    });
  });

  it(`can compile ${name} app with its typegen`, async () => {
    const appFilePath = join(__dirname, `./_${name}.ts`);
    expect([appFilePath]).toTypeCheck({
      sourceMap: false,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      target: ts.ScriptTarget.ES5,
      outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      noErrorTruncation: false,
    });
  });

  additionalTests(() => schema);
};

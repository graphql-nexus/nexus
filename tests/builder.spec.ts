import {
  resolveBuilderConfig,
  InternalBuilderConfig,
  BuilderConfig,
} from "../src/builder";
import * as Path from "path";
import { restoreEnvAfterEach } from "../src/core";

const relativePath = (...paths: string[]): string => Path.join(__dirname, ...paths); // prettier-ignore
const atTypesPath = relativePath("../node_modules/@types");
const typegenDefault = Path.join(atTypesPath, "/__nexus-typegen__core/index.d.ts"); // prettier-ignore
const schemaDefaultPath = relativePath("../schema.graphql");

describe("resolveBuilderConfig() outputs", () => {
  restoreEnvAfterEach();

  /**
   * These are outputs that the internalConfig can have. Reference these to
   * reduce duplication in test cases.
   */
  const outputs = {
    none: { outputs: { schema: false, typegen: false } },
    justTypegen: { outputs: { schema: false, typegen: typegenDefault } },
    justSchema: { outputs: { schema: schemaDefaultPath, typegen: false } },
    all: { outputs: { schema: schemaDefaultPath, typegen: typegenDefault } },
    custom: {
      justTypegen: { outputs: { schema: false, typegen: "/typegen.ts" } },
      justSchema: { outputs: { schema: "/schema.graphql", typegen: false } },
      all: { outputs: { schema: "/schema.graphql", typegen: "/typegen.ts" } },
    },
  } as const;

  type Cases = [BuilderConfig, InternalBuilderConfig][];
  const genOn: Cases = [
    // defaults
    [{}, outputs.justTypegen], // prettier-ignore
    [{ outputs: {} }, outputs.justTypegen], // prettier-ignore
    // selective
    [{ outputs: { schema: true } }, outputs.all], // prettier-ignore
    [{ outputs: { typegen: false } }, outputs.none], // prettier-ignore
    [{ outputs: { typegen:true } }, outputs.justTypegen], // prettier-ignore
    [{ outputs: { schema: true, typegen:false } }, outputs.justSchema], // prettier-ignore
    // custom paths
    [{ outputs: { schema: '/schema.graphql', typegen:'/typegen.ts' } }, outputs.custom.all], // prettier-ignore
    [{ outputs: { typegen:'/typegen.ts' } }, outputs.custom.justTypegen], // prettier-ignore
    [{ outputs: { schema: '/schema.graphql', typegen:false } }, outputs.custom.justSchema], // prettier-ignore
  ];

  const genOff: Cases = [
    [{}, outputs.none], // prettier-ignore
    [{ outputs: true }, outputs.none], // prettier-ignore
  ];

  it.each(genOn)("with shouldGenerateArtifacts: true %j", (given, expected) => {
    const internalConfig = resolveBuilderConfig({ ...given, shouldGenerateArtifacts: true }) // prettier-ignore
    expect(internalConfig.outputs).toEqual(expected.outputs);
  });

  it.each(genOn)("with NODE_ENV='' %j", (given, expected) => {
    process.env.NODE_ENV = "";
    expect(resolveBuilderConfig(given).outputs).toEqual(expected.outputs);
  });

  it.each(genOn)("with NODE_ENV=development %j", (given, expected) => {
    process.env.NODE_ENV = "development";
    expect(resolveBuilderConfig(given).outputs).toEqual(expected.outputs);
  });

  it.each(genOff)(
    "with shouldGenerateArtifacts: false %j",
    (given, expected) => {
      const internalConfig = resolveBuilderConfig({...given, shouldGenerateArtifacts: false }); // prettier-ignore
      expect(internalConfig.outputs).toEqual(expected.outputs);
    }
  );

  it.each(genOff)("with NODE_ENV=production %j", (given, expected) => {
    process.env.NODE_ENV = "production";
    expect(resolveBuilderConfig(given).outputs).toEqual(expected.outputs);
  });

  it.each(genOff)("with NODE_ENV=unknown %j", (given, expected) => {
    process.env.NODE_ENV = "unknown";
    expect(resolveBuilderConfig(given).outputs).toEqual(expected.outputs);
  });
});

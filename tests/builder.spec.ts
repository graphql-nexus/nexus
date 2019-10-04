import {
  resolveBuilderConfig,
  InternalBuilderConfig,
  BuilderConfig,
} from "../src/builder";
import * as Path from "path";
import { restoreEnvBeforeEach } from "../src/core";

const relativePath = (...paths: string[]): string => Path.join(__dirname, ...paths); // prettier-ignore
const atTypesPath = relativePath("../node_modules/@types");
const typegenDefault = Path.join(atTypesPath, "/__nexus-typegen__core/index.d.ts"); // prettier-ignore
const schemaDefaultPath = relativePath("../schema.graphql");
/**
 * These are outputs that the internalConfig can have. Reference these to
 * reduce duplication in test cases.
 */
const outputs = {
  default: { outputs: { schema: false, typegen: typegenDefault } },
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

describe("resolveBuilderConfig() outputs", () => {
  restoreEnvBeforeEach();

  type Cases = [BuilderConfig, InternalBuilderConfig][];
  const onCases: Cases = [
    // defaults
    [{}, outputs.justTypegen],
    [{ outputs: {} }, outputs.justTypegen],
    // selective
    [{ outputs: { schema: true } }, outputs.all],
    [{ outputs: { typegen: false } }, outputs.none],
    [{ outputs: { typegen:true } }, outputs.justTypegen],
    [{ outputs: { schema: true, typegen:false } }, outputs.justSchema],
    // custom paths
    [{ outputs: { schema: '/schema.graphql', typegen:'/typegen.ts' } }, outputs.custom.all],
    [{ outputs: { typegen:'/typegen.ts' } }, outputs.custom.justTypegen],
    [{ outputs: { schema: '/schema.graphql', typegen:false } }, outputs.custom.justSchema],
  ]; // prettier-ignore

  const offCases: Cases = [
    [{}, outputs.none],
    [{ outputs: true }, outputs.none],
  ]; // prettier-ignore

  it.each(onCases)("with shouldGenerateArtifacts: true + %j", (given, expected) => {
      const internalConfig = resolveBuilderConfig({ ...given, shouldGenerateArtifacts: true })
      expect(internalConfig.outputs).toEqual(expected.outputs);
    }
  ) // prettier-ignore

  it.each(offCases)("with shouldGenerateArtifacts: false + %j", (given, expected) => {
      const internalConfig = resolveBuilderConfig({...given, shouldGenerateArtifacts: false });
      expect(internalConfig.outputs).toEqual(expected.outputs);
    }
  ); // prettier-ignore
});

describe("Environment variable influence over builder config shouldGenerateArtifacts", () => {
  restoreEnvBeforeEach();

  it.each([
    [{ NODE_ENV: "production" }, { shouldGenerateArtifacts: true }],
    [{ NODE_ENV: "development" }, { shouldGenerateArtifacts: false }],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "false" }, { shouldGenerateArtifacts: true }],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "true" }, { shouldGenerateArtifacts: false }],
  ])(
    "when defined, overrules environment variables %j",
    (envEntries, config) => {
      Object.assign(process.env, envEntries);
      const internalConfig = resolveBuilderConfig(config);
      const expectedOutputs = config.shouldGenerateArtifacts ? outputs.default.outputs : outputs.none.outputs;
      expect(internalConfig.outputs).toEqual(expectedOutputs);
    }
  ); // prettier-ignore

  it.each([
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "true" }, true],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "false" }, false],
    // Test that NODE_ENV is overruled
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "true", NODE_ENV: "production" }, true],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "false", NODE_ENV: "development" }, false],
  ])(
    "when undefined, NEXUS_SHOULD_GENERATE_ARTIFACTS is used (%j)",
    (envEntries, isGenOn) => {
      Object.assign(process.env, envEntries);
      const internalConfig = resolveBuilderConfig({});
      const expectedOutputs = isGenOn ? outputs.default.outputs : outputs.none.outputs;
      expect(internalConfig.outputs).toEqual(expectedOutputs);
    }
  ); // prettier-ignore

  it.each([
    [{ NODE_ENV: "production" }, false],
    [{ NODE_ENV: "unknown" }, false],
    [{ NODE_ENV: "development" }, true],
    [{ NODE_ENV: "" }, true],
    [{ NODE_ENV: undefined }, true],
  ])(
    "when undefined, and no NEXUS_SHOULD_GENERATE_ARTIFACTS, NODE_ENV is used (%j)",
    (envEntries, isGenOn) => {
      Object.assign(process.env, envEntries);
      const internalConfig = resolveBuilderConfig({});
      const expectedOutputs = isGenOn ? outputs.default.outputs : outputs.none.outputs;
      expect(internalConfig.outputs).toEqual(expectedOutputs);
    }
  ); // prettier-ignore
});

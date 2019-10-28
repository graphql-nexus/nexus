import {
  resolveBuilderConfig,
  InternalBuilderConfig,
  BuilderConfig,
} from "../src/builder";
import * as Path from "path";
import { restoreEnvBeforeEach } from "./_helpers";
import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";

const relativePath = (...paths: string[]): string => Path.join(__dirname, ...paths); // prettier-ignore
const atTypesPath = relativePath("../../@types");
const typegenDefault = Path.join(atTypesPath, "/nexus-typegen/index.d.ts"); // prettier-ignore
const schemaDefaultPath = relativePath("../schema.graphql");

/**
 * These are outputs that the internalConfig can have. Reference these to
 * reduce duplication in test cases.
 */
const outputs = {
  default: { outputs: { schema: false, typegen: typegenDefault }, shouldExitAfterGenerateArtifacts: false },
  none: { outputs: { schema: false, typegen: false }, shouldExitAfterGenerateArtifacts: false },
  justTypegen: { outputs: { schema: false, typegen: typegenDefault }, shouldExitAfterGenerateArtifacts: false },
  justSchema: { outputs: { schema: schemaDefaultPath, typegen: false }, shouldExitAfterGenerateArtifacts: false },
  all: { outputs: { schema: schemaDefaultPath, typegen: typegenDefault }, shouldExitAfterGenerateArtifacts: false, },
  custom: {
    justTypegen: { outputs: { schema: false, typegen: "/typegen.ts" }, shouldExitAfterGenerateArtifacts: false },
    justSchema: { outputs: { schema: "/schema.graphql", typegen: false }, shouldExitAfterGenerateArtifacts: false },
    all: { outputs: { schema: "/schema.graphql", typegen: "/typegen.ts" }, shouldExitAfterGenerateArtifacts: false },
  },
} as const; // prettier-ignore

function assignEnv(entries: object): NodeJS.ProcessEnv {
  return Object.assign(process.env, entries);
}

function nexusConfigEnv(config: BuilderConfig): NodeJS.ProcessEnv {
  return assignEnv({
    NEXUS_CONFIG: JSON.stringify(config),
  });
}

const matchers = {
  typegenDefault: {
    outputs: {
      typegen: expect.stringMatching(/.+\/@types\/nexus-typegen\/index.d.ts/),
    },
  },
};

restoreEnvBeforeEach();

describe("resolveBuilderConfig() outputs", () => {
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

// describe('NEXUS_CONFIG')

describe("shouldExitAfterGenerateArtifacts", () => {
  it("takes default of false", () => {
    expect(resolveBuilderConfig({}).shouldExitAfterGenerateArtifacts).toEqual(
      false
    );
  });
  describe("via NEXUS_CONFIG", () => {
    it("can be set true ", () => {
      nexusConfigEnv({
        shouldExitAfterGenerateArtifacts: true,
      });

      expect(resolveBuilderConfig({}).shouldExitAfterGenerateArtifacts).toEqual(
        true
      );
    });

    it("can be set false", () => {
      nexusConfigEnv({
        shouldExitAfterGenerateArtifacts: false,
      });
      expect(resolveBuilderConfig({}).shouldExitAfterGenerateArtifacts).toEqual(
        false
      );
    });
    it("overrules code config", () => {
      nexusConfigEnv({
        shouldExitAfterGenerateArtifacts: true,
      });

      expect(
        resolveBuilderConfig({ shouldExitAfterGenerateArtifacts: false })
          .shouldExitAfterGenerateArtifacts
      ).toEqual(true);
    });
  });

  it("will exit the process after artifact generation", () => {
    const appPath = Path.join(__dirname, "./app.tmp.ts");
    const app = `
      import { makeSchema, queryType } from '../src'

      makeSchema({
        shouldGenerateArtifacts: true,
        shouldExitAfterGenerateArtifacts: true,
        outputs: { schema: false, typegen: true },
        types: [queryType({ definition(t){ t.string('hello', () => 'world') }})],
      })

      setInterval(() => { console.log('<some long running process>' ) }, 10000)
    `;
    writeFileSync(appPath, app);
    let { stderr, stdout, status } = spawnSync("npx", ["ts-node", appPath], {
      encoding: "utf8",
    });
    stdout = stdout.replace(
      /\/.*(\/@types\/nexus-typegen\/index.d.ts)/,
      "__DYNAMIC__$1"
    );
    expect({ stderr, stdout, status }).toMatchInlineSnapshot(`
      Object {
        "status": 0,
        "stderr": "",
        "stdout": "Generatd Artifacts:

          TypeScript Types  ==>  __DYNAMIC__/@types/nexus-typegen/index.d.ts
          GraphQL Schema    ==>  (not enabled)
      ",
      }
    `);
    unlinkSync(appPath);
  });
});

describe("Environment variable influence over builder config shouldGenerateArtifacts", () => {
  it.each([
    [{ NODE_ENV: "production" }, { shouldGenerateArtifacts: true }],
    [{ NODE_ENV: "development" }, { shouldGenerateArtifacts: false }],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "false" }, { shouldGenerateArtifacts: true }],
    [{ NEXUS_SHOULD_GENERATE_ARTIFACTS: "true" }, { shouldGenerateArtifacts: false }],
  ])("when defined, overrules environment variables %j", (envEntries, config) => {
      assignEnv(envEntries)
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
  ])("when undefined, NEXUS_SHOULD_GENERATE_ARTIFACTS is used (%j)", (envEntries, isGenOn) => {
      assignEnv(envEntries)
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
  ])("when undefined, and no NEXUS_SHOULD_GENERATE_ARTIFACTS, NODE_ENV is used (%j)", (envEntries, isGenOn) => {
      assignEnv(envEntries)
      const internalConfig = resolveBuilderConfig({});
      const expectedOutputs = isGenOn ? outputs.default.outputs : outputs.none.outputs;
      expect(internalConfig.outputs).toEqual(expectedOutputs);
    }
  ); // prettier-ignore
});

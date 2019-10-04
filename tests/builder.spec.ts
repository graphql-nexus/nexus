import {
  resolveBuilderConfig,
  InternalBuilderConfig,
  BuilderConfig,
} from "../src/builder";
import * as Path from "path";

const relativePath = (...paths: string[]): string =>
  Path.join(__dirname, ...paths);
const atTypesPath = relativePath("../node_modules/@types");
const typegenDefault = Path.join(
  atTypesPath,
  "/__nexus-typegen__core/index.d.ts"
);
const schemaDefault = relativePath("../schema.graphql");

describe("resolveBuilderConfig", () => {
  type Scenario = Record<string, InternalBuilderConfig | BuilderConfig>;
  type Scenarios = Scenario[];
  type ScenariosExpanded = [
    Record<string, string>,
    BuilderConfig,
    InternalBuilderConfig
  ];

  let NODE_ENV: string | undefined;
  beforeAll(() => {
    NODE_ENV = process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
    delete process.env.NEXUS_SHOULD_GENERATE_ARTIFACTS;
  });

  const dev = "NODE_ENV=development";
  const prod = "NODE_ENV=production";
  const devGenOff =
    "NODE_ENV=development, NEXUS_SHOULD_GENERATE_ARTIFACTS=false";
  const prodGenOn = "NODE_ENV=production, NEXUS_SHOULD_GENERATE_ARTIFACTS=true";
  const cases: any = [
    // shorthand boolean cases
    {
      given: {},
      [dev]: {
        outputs: { schema: false, typegen: typegenDefault },
      },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: typegenDefault } },
    },
    {
      given: { outputs: true },
      [dev]: {
        outputs: { schema: schemaDefault, typegen: typegenDefault },
      },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: {
        outputs: { schema: schemaDefault, typegen: typegenDefault },
      },
    },
    // explicit partial boolean cases
    {
      given: { outputs: false },
      [dev]: { outputs: { schema: false, typegen: false } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: false } },
    },
    {
      given: { outputs: { schema: false } },
      [dev]: { outputs: { schema: false, typegen: typegenDefault } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: typegenDefault } },
    },
    {
      given: { outputs: { typegen: false } },
      [dev]: { outputs: { schema: false, typegen: false } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: false } },
    },
    // explicit boolean cases
    {
      given: { outputs: { schema: true, typegen: true } },
      [dev]: { outputs: { schema: schemaDefault, typegen: typegenDefault } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: {
        outputs: { schema: schemaDefault, typegen: typegenDefault },
      },
    },
    {
      given: { outputs: { schema: false, typegen: false } },
      [dev]: { outputs: { schema: false, typegen: false } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: false } },
    },
    // cusotm path cases
    {
      given: { outputs: { schema: "/foo", typegen: true } },
      [dev]: { outputs: { schema: "/foo", typegen: typegenDefault } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: "/foo", typegen: typegenDefault } },
    },
    {
      given: { outputs: { schema: true, typegen: "/foo" } },
      [dev]: { outputs: { schema: schemaDefault, typegen: "/foo" } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: schemaDefault, typegen: "/foo" } },
    },
    {
      given: { outputs: { schema: "/foo", typegen: "/bar" } },
      [dev]: { outputs: { schema: "/foo", typegen: "/bar" } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: "/foo", typegen: "/bar" } },
    },
    {
      given: { outputs: { typegen: "/foo" } },
      [dev]: { outputs: { schema: false, typegen: "/foo" } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: "/foo" } },
    },
    {
      given: { outputs: { schema: "/foo" } },
      [dev]: { outputs: { schema: "/foo", typegen: typegenDefault } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: "/foo", typegen: typegenDefault } },
    },
    // explicit shouldGenerateConfig cases
    {
      given: { outputs: true, shouldGenerateArtifacts: false },
      [dev]: { outputs: { schema: false, typegen: false } },
      [devGenOff]: { outputs: { schema: false, typegen: false } },
      [prod]: { outputs: { schema: false, typegen: false } },
      [prodGenOn]: { outputs: { schema: false, typegen: false } },
    },
    {
      given: {
        outputs: { schema: "/foo", typegen: "/bar" },
        shouldGenerateArtifacts: true,
      },
      [dev]: { outputs: { schema: "/foo", typegen: "/bar" } },
      [devGenOff]: { outputs: { schema: "/foo", typegen: "/bar" } },
      [prod]: { outputs: { schema: "/foo", typegen: "/bar" } },
      [prodGenOn]: { outputs: { schema: "/foo", typegen: "/bar" } },
    },
  ];
  const casesExpanded: any = cases.reduce((acc: any, kase: any) => {
    const { given, ...expectedUnderEnvs } = kase;
    return [
      ...acc,
      ...Object.entries(expectedUnderEnvs).map(([env, expected]) => [
        env
          .trim()
          .split(",")
          .map((kv) => kv.trim().split("="))
          .reduce((envAcc, [k, v]) => Object.assign(envAcc, { [k]: v }), {}),
        given,
        expected,
      ]),
    ] as any;
  }, []);

  it.each(casesExpanded)("env %j + config %j", (env, given, expected) => {
    Object.assign(process.env, env);
    expect(resolveBuilderConfig(given)).toEqual(expected);
  });
});

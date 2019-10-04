import {
  resolveBuilderConfig,
  InternalBuilderConfig,
  BuilderConfig,
} from "../src/builder";
import * as Path from "path";

const relativePath = (...paths: string[]): string =>
  Path.join(__dirname, ...paths);
const atTypesPath = relativePath("../node_modules/@types");
const typegenDefaultPath = Path.join(
  atTypesPath,
  "/__nexus-typegen__core/index.d.ts"
);
const schemaDefaultPath = relativePath("../schema.graphql");

describe("resolveBuilderConfig", () => {
  type Scenarios = [BuilderConfig, InternalBuilderConfig][];
  let NODE_ENV: string | undefined;
  beforeAll(() => {
    NODE_ENV = process.env.NODE_ENV;
  });
  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV;
  });

  const productionCases: Scenarios = [
    [{}, { outputs: { schema: false, typegen: false } }],
    [
      { outputs: true },
      {
        outputs: {
          schema: schemaDefaultPath,
          typegen: typegenDefaultPath,
        },
      },
    ],
    [{ outputs: false }, { outputs: { schema: false, typegen: false } }],
    [
      { outputs: { schema: false, typegen: true } },
      { outputs: { schema: false, typegen: typegenDefaultPath } },
    ],
    [
      { outputs: { schema: true, typegen: false } },
      { outputs: { schema: schemaDefaultPath, typegen: false } },
    ],
    [
      { outputs: { schema: true, typegen: true } },
      { outputs: { schema: schemaDefaultPath, typegen: typegenDefaultPath } },
    ],
    [
      { outputs: { schema: "/foo", typegen: true } },
      { outputs: { schema: "/foo", typegen: typegenDefaultPath } },
    ],
    [
      { outputs: { schema: true, typegen: "/foo" } },
      { outputs: { schema: schemaDefaultPath, typegen: "/foo" } },
    ],
    [
      { outputs: { typegen: "/foo" } },
      { outputs: { schema: false, typegen: "/foo" } },
    ],
    [
      { outputs: { schema: "/foo" } },
      { outputs: { schema: "/foo", typegen: false } },
    ],
  ];

  it.each(productionCases)("%j", (given, expected) => {
    process.env.NODE_ENV = "production";
    expect(resolveBuilderConfig(given)).toEqual(expected);
  });

  it.each(productionCases)("%j", (given, expected) => {
    process.env.NODE_ENV = "anything else";
    expect(resolveBuilderConfig(given)).toEqual(expected);
  });

  const devCases: Scenarios = [
    [{}, { outputs: { schema: false, typegen: typegenDefaultPath } }],
    [
      { outputs: { schema: "/foo" } },
      { outputs: { schema: "/foo", typegen: typegenDefaultPath } },
    ],
    [
      { outputs: { schema: "/foo", typegen: "/bar" } },
      { outputs: { schema: "/foo", typegen: "/bar" } },
    ],
    [
      { outputs: { typegen: "/bar" } },
      { outputs: { schema: false, typegen: "/bar" } },
    ],
  ];

  it.each(devCases)("%j", (given, expected) => {
    process.env.NODE_ENV = "development";
    expect(resolveBuilderConfig(given)).toEqual(expected);
  });

  it.each(devCases)("%j", (given, expected) => {
    process.env.NODE_ENV = "";
    expect(resolveBuilderConfig(given)).toEqual(expected);
  });
});

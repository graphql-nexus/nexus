import path from "path";
import {
  objectType,
  makeSchema,
  queryField,
  queryComplexityPlugin,
} from "../../src";
import { GraphQLObjectType } from "graphql";
import { generateSchema } from "../../src/core";

describe("queryComplexityPlugin", () => {
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  // consoleWarnSpy is not used in any tests but its here to prevent console warn
  // for the last test, which warns about specifying config value for makeSchema
  jest.spyOn(console, "warn").mockImplementation(() => {});

  afterEach(() => {
    jest.resetAllMocks();
  });

  const createTestSchema = (types?: any) => {
    return makeSchema({
      types,
      outputs: false,
      plugins: [queryComplexityPlugin()],
    });
  };

  test("complexity number should be set on field extension if defined", async () => {
    const testSchema = createTestSchema([
      objectType({
        name: "User",
        definition(t) {
          t.int("id", {
            // @ts-ignore
            complexity: 1,
          });
        },
      }),
    ]);
    const user = testSchema.getType("User") as GraphQLObjectType;
    const idField = user.getFields().id;
    expect(idField.extensions).toHaveProperty("complexity");
    expect(idField.extensions?.complexity).toBe(1);
  });

  test("complexity estimator should be set on field extension if defined", async () => {
    const estimator = () => 1;
    const testSchema = createTestSchema([
      objectType({
        name: "User",
        definition(t) {
          t.int("id", {
            // @ts-ignore
            complexity: estimator,
          });
        },
      }),
    ]);
    const user = testSchema.getType("User") as GraphQLObjectType;
    const idField = user.getFields().id;
    expect(idField.extensions).toHaveProperty("complexity");
    expect(idField.extensions?.complexity).toBe(estimator);
  });

  test("complexity number should work on query fields too", async () => {
    const testSchema = createTestSchema([
      queryField("ok", {
        type: "Boolean",
        // @ts-ignore
        complexity: 1,
        resolve: () => true,
      }),
    ]);
    const ok = testSchema.getQueryType()?.getFields().ok;
    expect(ok?.extensions).toHaveProperty("complexity");
    expect(ok?.extensions?.complexity).toBe(1);
  });

  test("complexity should not be set on field extension if not defined", async () => {
    const testSchema = createTestSchema([
      objectType({
        name: "User",
        definition(t) {
          t.int("id");
        },
      }),
    ]);
    const user = testSchema.getType("User") as GraphQLObjectType;
    const idField = user.getFields().id;
    expect(idField.extensions).not.toHaveProperty("complexity");
  });

  test("throws error if complexity is of invalid type", async () => {
    const testSchema = createTestSchema([
      objectType({
        name: "User",
        definition(t) {
          t.int("id", {
            // @ts-ignore
            complexity: "invalid",
          });
        },
      }),
    ]);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("printing the query complexity schema", async () => {
    const result = await generateSchema.withArtifacts(
      {
        types: [
          queryField("ok", {
            type: "Boolean",
            resolve: () => true,
          }),
        ],
        plugins: [queryComplexityPlugin()],
      },
      path.join(__dirname, "test.gen.ts")
    );
    expect(result.tsTypes).toMatchSnapshot("Full Type Output");
  });
});

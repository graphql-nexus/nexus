import {
  createPlugin,
  makeSchema,
  PluginConfig,
  queryType,
  objectType,
  PluginOnInstallHandler,
} from "../src";
import { printSchema } from "graphql";
import {
  NexusAcceptedTypeDef,
  buildTypes,
  inputObjectType,
  extendType,
  buildTypesInternal,
} from "../src/core";

const fooObject = objectType({
  name: "foo",
  definition(t) {
    t.string("bar");
  },
});

const queryField = extendType({
  type: "Query",
  definition(t) {
    t.string("something");
  },
});

describe("runtime config validation", () => {
  const whenGiven = (config: any) => () => createPlugin(config);

  it("checks name present", () => {
    expect(whenGiven({})).toThrowErrorMatchingInlineSnapshot(
      `"Plugin \\"undefined\\" is missing required properties: name"`
    );
  });

  it("checks name is string", () => {
    expect(whenGiven({ name: 1 })).toThrowErrorMatchingInlineSnapshot(
      `"Plugin \\"1\\" is giving an invalid value for property name: expected \\"string\\" type, got number type"`
    );
  });

  it("checks name is not empty", () => {
    expect(whenGiven({ name: "" })).toThrowErrorMatchingInlineSnapshot(
      `"Plugin \\"\\" is giving an invalid value for property name: empty string"`
    );
  });

  it("checks onInstall is a function if defined", () => {
    expect(
      whenGiven({ name: "x", onInstall: "foo" })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Plugin \\"x\\" is giving an invalid value for onInstall hook: expected \\"function\\" type, got string type"`
    );

    expect(
      whenGiven({ name: "x", onInstall: {} })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Plugin \\"x\\" is giving an invalid value for onInstall hook: expected \\"function\\" type, got object type"`
    );
  });
});

describe("runtime onInstall hook handler", () => {
  const whenGiven = (onInstall: any) => () =>
    makeSchema({
      types: [],
      plugins: [createPlugin({ name: "x", onInstall })],
    });

  it("validates return value against shallow schema", () => {
    expect(whenGiven(() => null)).toThrowErrorMatchingInlineSnapshot(`
"Plugin \\"x\\" returned invalid data for \\"onInstall\\" hook:

expected structure:

  { types: NexusAcceptedTypeDef[] }

got:

  null"
`);

    expect(whenGiven(() => ({ types: null })))
      .toThrowErrorMatchingInlineSnapshot(`
"Plugin \\"x\\" returned invalid data for \\"onInstall\\" hook:

expected structure:

  { types: NexusAcceptedTypeDef[] }

got:

  [object Object]"
`);

    expect(whenGiven(() => ({}))).toThrowErrorMatchingInlineSnapshot(`
"Plugin \\"x\\" returned invalid data for \\"onInstall\\" hook:

expected structure:

  { types: NexusAcceptedTypeDef[] }

got:

  [object Object]"
`);
  });

  it("gracefully handles thrown errors", () => {
    expect(
      whenGiven(() => {
        throw new Error("plugin failed somehow oops");
      })
    ).toThrow(
      /Plugin x failed on "onInstall" hook:\n\nError: plugin failed somehow oops\n    at.*/
    );
  });

  it("does not validate types array members yet", () => {
    expect(
      whenGiven(() => ({ types: [null, 1, "bad"] }))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot read property 'name' of null"`
    );
  });
});

describe("a plugin may", () => {
  const whenGiven = (pluginConfig: PluginConfig) => () =>
    makeSchema({
      types: [],
      plugins: [createPlugin(pluginConfig)],
    });

  it("do nothing", () => {
    expect(whenGiven({ name: "x" }));
  });
});

describe("onInstall plugins", () => {
  const whenGiven = ({
    onInstall,
    plugin,
    appTypes,
  }: {
    onInstall?: PluginOnInstallHandler;
    plugin?: Omit<PluginConfig, "name">;
    appTypes?: NexusAcceptedTypeDef[];
  }) => {
    const xPluginConfig = plugin || { onInstall };

    return printSchema(
      makeSchema({
        types: appTypes || [],
        plugins: [createPlugin({ name: "x", ...xPluginConfig })],
      })
    );
  };

  it("is an optional hook", () => {
    expect(whenGiven({ plugin: {} }));
  });

  it("may return an empty array of types", () => {
    expect(whenGiven({ onInstall: () => ({ types: [] }) }));
  });

  it("may contribute types", () => {
    expect(
      whenGiven({
        onInstall: () => ({
          types: [queryField],
        }),
      })
    ).toMatchInlineSnapshot(`
            "type Query {
              something: String!
            }
            "
        `);
  });

  it("has access to top-level types", () => {
    expect(
      whenGiven({
        onInstall: (builder) => ({
          types: builder.hasType("foo") ? [] : [queryField],
        }),
        appTypes: [fooObject],
      })
    ).toMatchInlineSnapshot(`
      "type foo {
        bar: String!
      }

      type Query {
        ok: Boolean!
      }
      "
    `);
  });

  it("does not see fallback ok-query", () => {
    expect(
      whenGiven({
        onInstall(builder) {
          return {
            types: builder.hasType("Query") ? [queryField] : [],
          };
        },
      })
    ).toMatchInlineSnapshot(`
                        "type Query {
                          ok: Boolean!
                        }
                        "
                `);
  });

  it("does not have access to inline types", () => {
    expect(
      whenGiven({
        onInstall: (builder) => ({
          types: builder.hasType("Inline") ? [queryField] : [],
        }),
        appTypes: [
          queryType({
            definition(t) {
              t.string("bar", {
                args: {
                  inline: inputObjectType({
                    name: "Inline",
                    definition(t2) {
                      t2.string("hidden");
                    },
                  }),
                },
              });
            },
          }),
        ],
      })
    ).toMatchInlineSnapshot(`
                              "input Inline {
                                hidden: String
                              }

                              type Query {
                                bar(inline: Inline): String!
                              }
                              "
                    `);
  });
});

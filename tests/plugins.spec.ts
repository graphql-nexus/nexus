import { createPlugin, makeSchema } from "../src";

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
    ).toThrowErrorMatchingInlineSnapshot(`
"Plugin x failed on \\"onInstall\\" hook:

Error: plugin failed somehow oops
    at Object.onInstall (/Users/jasonkuhrt/projects/prisma/nexus/tests/plugins.spec.ts:88:15)
    at Object.triggerOnInstall (/Users/jasonkuhrt/projects/prisma/nexus/src/plugins.ts:113:36)
    at /Users/jasonkuhrt/projects/prisma/nexus/src/builder.ts:1481:22
    at Array.forEach (<anonymous>)
    at buildTypesInternal (/Users/jasonkuhrt/projects/prisma/nexus/src/builder.ts:1480:21)
    at makeSchemaInternal (/Users/jasonkuhrt/projects/prisma/nexus/src/builder.ts:1528:9)
    at Object.makeSchema (/Users/jasonkuhrt/projects/prisma/nexus/src/builder.ts:1579:9)
    at /Users/jasonkuhrt/projects/prisma/nexus/tests/plugins.spec.ts:41:5
    at _toThrowErrorMatchingSnapshot (/Users/jasonkuhrt/projects/prisma/nexus/node_modules/jest-snapshot/build/index.js:471:7)
    at Object.toThrowErrorMatchingInlineSnapshot (/Users/jasonkuhrt/projects/prisma/nexus/node_modules/jest-snapshot/build/index.js:424:10)"
`);
  });

  it("does not validate types array members yet", () => {
    expect(
      whenGiven(() => ({ types: [null, 1, "bad"] }))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot read property 'name' of null"`
    );
  });
});

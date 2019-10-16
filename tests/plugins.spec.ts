import { createPlugin } from "../src";

describe("runtime validation", () => {
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

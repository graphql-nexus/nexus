import { plugin } from "../plugin";

export const mockExamplePlugin = plugin({
  name: "MockExample",
  description:
    "Generates an example resolver that can be used when mocking out a schema",
  fieldDefTypes: ``,
  schemaTypes: ``,
  definition() {},
});

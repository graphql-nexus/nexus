import { plugin } from "../plugin";

export const enforceDocs = plugin({
  name: "EnforceDocs",
  description: `
    Ensures that any used-defined type must have docs, 
    otherwise it's a type-error.
  `,
  typeDefTypes: `description: string;`,
  fieldDefTypes: `description: string;`,
  pluginDefinition() {},
});

import { GenTypesShape } from "./src/types";

export interface GeneratedSchemaTypes extends GenTypesShape {
  interfaces: "a" | "b";
  enums: "One" | "Two" | "Three";
  enumTypes: {
    OneThroughThree: "NEWHOPE" | "EMPIRE" | "JEDI";
  };
  objectTypes: {
    a: {
      root: {
        a: {};
      };
      args: {};
    };
  };
  inputObjectTypes: {};
}

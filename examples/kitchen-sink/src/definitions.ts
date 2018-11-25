import {
  objectType,
  inputObjectType,
  enumType,
  scalarType,
  interfaceType,
} from "gqliteral";

export const Bar = interfaceType("Bar", (t) => {});

export const Baz = interfaceType("Baz", (t) => {});

export const Foo = objectType("Foo", (t) => {});

export const InputType = inputObjectType("InputType", (t) => {
  t.string("key", { required: true });
  t.int("answer", { default: "a" });
});

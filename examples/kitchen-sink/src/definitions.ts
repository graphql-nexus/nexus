import { objectType, inputObjectType, interfaceType } from "nexus";

export const Bar = interfaceType("Bar", (t) => {
  t.boolean("ok");
});

export const Baz = interfaceType("Baz", (t) => {
  t.boolean("ok");
});

export const Foo = objectType("Foo", (t) => {
  t.implements("Bar", "Baz");
});

export const InputType = inputObjectType("InputType", (t) => {
  t.string("key", { required: true });
  t.int("answer", { default: "a" });
});

export const Query = objectType("Query", (t) => {
  t.field("bar", "Bar", {
    resolve: () => ({ ok: true }),
  });
});

import { objectType, inputObjectType, interfaceType } from "nexus";

export const Bar = interfaceType({
  name: "Bar",
  definition(t) {
    t.boolean("ok");
    t.resolveType((root) => "Foo");
  },
});

export const Baz = interfaceType({
  name: "Baz",
  definition(t) {
    t.boolean("ok");
    t.field("a", {
      type: Bar,
    });
    t.resolveType(() => "Foo");
  },
});

export const Foo = objectType({
  name: "Foo",
  definition(t) {
    t.implements(Bar);
    t.string("name");
  },
});

export const InputType = inputObjectType({
  name: "InputType",
  definition(t) {
    t.string("key", { required: true });
    t.int("answer");
  },
});

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("bar", {
      type: "Bar",
      resolve: () => ({ ok: true }),
    });
  },
});

import {
  objectType,
  inputObjectType,
  interfaceType,
  unionType,
  arg,
  core,
} from "nexus";

type T = core.PossibleArgNames;

export const Bar = interfaceType({
  name: "Bar",
  description: "Bar description",
  definition(t) {
    t.boolean("ok", { deprecation: "Not ok?" });
    t.boolean("argsTest", {
      args: {
        a: arg({
          type: InputType,
          default: 1,
        }),
      },
    });
    t.resolveType((root) => "Foo");
  },
});

export const Baz = interfaceType({
  name: "Baz",
  definition(t) {
    t.boolean("ok");
    t.field("a", {
      type: Bar,
      description: "'A' description",
    });
    t.resolveType(() => "TestObj");
  },
});

export const TestUnion = unionType({
  name: "TestUnion",
  definition(t) {
    t.members("Foo");
    t.resolveType(() => "Foo");
  },
});

export const TestObj = objectType({
  name: "TestObj",
  definition(t) {
    t.implements("Bar", Baz);
    t.string("item");
  },
});

export const Foo = objectType({
  name: "Foo",
  definition(t) {
    t.implements("Bar");
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

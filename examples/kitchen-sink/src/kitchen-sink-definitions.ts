import {
  objectType,
  inputObjectType,
  interfaceType,
  unionType,
  arg,
  extendType,
  scalarType,
  extendInputType,
  intArg,
  idArg,
  mutationField,
  mutationType,
} from "nexus";

export const testArgs1 = {
  foo: idArg(),
};

export const testArgs2 = {
  bar: idArg(),
};

export const Mutation = mutationType({
  definition(t) {
    t.boolean("ok", () => true);
  },
});

export const SomeMutationField = mutationField("someMutationField", () => ({
  type: Foo,
  args: {
    id: idArg({ required: true }),
  },
  resolve(root, args) {
    return { name: `Test${args.id}`, ok: true };
  },
}));

export const Bar = interfaceType({
  name: "Bar",
  description: "Bar description",
  definition(t) {
    t.boolean("ok", { deprecation: "Not ok?" });
    t.boolean("argsTest", {
      args: {
        a: arg({
          type: "InputType",
          default: {
            key: "one",
            answer: 2,
          },
        }),
      },
      resolve(root, args) {
        return true;
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
    t.field("nestedInput", { type: InputType2 });
  },
});

export const InputType2 = inputObjectType({
  name: "InputType2",
  definition(t) {
    t.string("key", { required: true });
    t.int("answer");
  },
});

export const ext = extendInputType({
  type: "InputType",
  definition(t) {},
});

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("bar", {
      type: "Bar",
      resolve: () => ({ ok: true }),
    });
    t.int("getNumberOrNull", {
      nullable: true,
      args: { a: intArg({ required: true }) },
      async resolve(_, { a }) {
        if (a > 0) {
          return a;
        }
        return null;
      },
    });
  },
});

export const MoreQueryFields = extendType({
  type: "Query",
  definition(t) {
    t.field("extended", {
      type: "Bar",
      resolve() {
        return { ok: true };
      },
    });
    t.list.date("dateAsList");
  },
});

export const DateScalar = scalarType({
  name: "Date",
  serialize: (value) => value.getTime(),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === "IntValue" ? new Date(ast.value) : null),
  asNexusMethod: "date",
});

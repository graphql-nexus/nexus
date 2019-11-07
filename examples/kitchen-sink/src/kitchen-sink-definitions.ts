import {
  objectType,
  inputObjectType,
  interfaceType,
  unionType,
  arg,
  extendType,
  scalarType,
  intArg,
  idArg,
  mutationField,
  mutationType,
  ext,
} from "nexus";

export { ext };

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

export interface UnusedInterfaceTypeDef {
  ok: boolean;
}

export const UnusedInterface = interfaceType({
  name: "UnusedInterface",
  definition(t) {
    t.boolean("ok");
    t.resolveType(() => null);
  },
  rootTyping: { name: "UnusedInterfaceTypeDef", path: __filename },
});

export const Baz = interfaceType({
  name: "Baz",
  definition(t) {
    t.boolean("ok");
    t.field("a", {
      type: Bar,
      description: "'A' description",
      nullable: true,
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
    t.date("someDate", { required: true });
  },
});

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("bar", {
      type: "TestObj",
      resolve: () => ({ ok: true, item: "test" }),
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
    t.string("asArgExample", {
      args: {
        testAsArg: InputType.asArg({ required: true }),
      },
      skipNullGuard: true, // just checking that this isn't a type error
      resolve: () => "ok",
    });
    t.string("inputAsArgExample", {
      args: {
        testScalar: "String",
        testInput: InputType,
      },
      resolve: () => "ok",
    });
    t.string("inlineArgs", {
      args: {
        someArg: arg({
          type: inputObjectType({
            name: "SomeArg",
            definition(i) {
              i.string("someField");
              i.field("arg", {
                type: inputObjectType({
                  name: "NestedType",
                  definition(j) {
                    j.string("veryNested");
                  },
                }),
              });
            },
          }),
        }),
      },
      resolve: () => "ok",
    });
    t.list.date("dateAsList", () => []);
    t.collectionField("collectionField", {
      type: Bar,
      args: {
        a: intArg(),
      },
      nodes() {
        return [];
      },
      totalCount(root, args, ctx, info) {
        return args.a || 0;
      },
    });
  },
});

const someItem = objectType({
  name: "SomeItem",
  definition(t) {
    t.id("id");
  },
});

export const MoreQueryFields = extendType({
  type: "Query",
  definition(t) {
    t.field("extended", {
      type: someItem,
      resolve(root) {
        return { id: "SomeID" };
      },
    });
    t.int("protectedField", {
      authorize: () => false,
      resolve: () => 1,
    });
  },
});

export const DateScalar = scalarType({
  name: "Date",
  serialize: (value) => value.getTime(),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === "IntValue" ? new Date(ast.value) : null),
  asNexusMethod: "date",
  rootTyping: "Date",
});

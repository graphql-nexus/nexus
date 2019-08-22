import { convertSDL, core } from "../src";
import { EXAMPLE_SDL } from "./_sdl";

const { SDLConverter } = core;

describe("SDLConverter", () => {
  test("printObjectTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printObjectTypes())
      .toMatchInlineSnapshot(`
"export const Mutation = objectType({
  name: \\"Mutation\\",
  definition(t) {
    t.string(\\"someList\\", {
      list: [false],
      args: {
        items: stringArg({
          list: [false],
          required: true
        }),
      },
    })
    t.field(\\"createPost\\", {
      type: Post,
      args: {
        input: arg({
          type: CreatePostInput,
          required: true
        }),
      },
    })
    t.field(\\"registerClick\\", {
      type: Query,
      args: {
        uuid: uuidArg(),
      },
    })
  }
})
export const Post = objectType({
  name: \\"Post\\",
  description: \\"This is a description of a Post\\",
  definition(t) {
    t.implements(Node)
    t.uuid(\\"uuid\\")
    t.field(\\"author\\", { type: User })
    t.float(\\"geo\\", { list: [true, true] })
    t.float(\\"messyGeo\\", {
      list: [true, false],
      nullable: true,
    })
  }
})
export const Query = objectType({
  name: \\"Query\\",
  definition(t) {
    t.field(\\"user\\", { type: User })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({
          type: PostFilters,
          required: true
        }),
      },
    })
    t.field(\\"unionField\\", { type: ExampleUnion })
  }
})
export const User = objectType({
  name: \\"User\\",
  definition(t) {
    t.implements(Node)
    t.string(\\"name\\", {
      description: \\"This is a description of a name\\",
      args: {
        prefix: stringArg({ description: \\"And a description of an arg\\" }),
      },
    })
    t.string(\\"email\\")
    t.string(\\"phone\\", { nullable: true })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({ type: PostFilters }),
      },
    })
    t.field(\\"outEnum\\", {
      type: SomeEnum,
      nullable: true,
    })
  }
})"
`);
  });

  test("printEnumTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printEnumTypes())
      .toMatchInlineSnapshot(`
"export const OrderEnum = enumType({
  name: \\"OrderEnum\\",
  members: [\\"ASC\\",\\"DESC\\"],
});
export const SomeEnum = enumType({
  name: \\"SomeEnum\\",
  members: [\\"A\\",{\\"name\\":\\"B\\",\\"deprecation\\":\\"This is a deprecation reason for B\\",\\"value\\":\\"B\\"}],
});"
`);
  });

  test("printScalarTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printScalarTypes())
      .toMatchInlineSnapshot(`
"export const UUID = scalarType({
  name: \\"UUID\\",
  asNexusMethod: \\"uuid\\",
  serialize() { /* Todo */ },
  parseValue() { /* Todo */ },
  parseLiteral() { /* Todo */ }
});"
`);
  });

  test("printInterfaceTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printInterfaceTypes())
      .toMatchInlineSnapshot(`
"export const Node = interfaceType({
  name: \\"Node\\",
  description: \\"This is a description of a Node\\",
  definition(t) {
    t.id(\\"id\\")
    t.resolveType(() => null)
  }
});"
`);
  });
});

test("convertSDL", () => {
  expect(convertSDL(EXAMPLE_SDL)).toMatchInlineSnapshot(`
"import { objectType, stringArg, arg, uuidArg, interfaceType, inputObjectType, unionType, enumType, scalarType } from 'nexus';

export const Mutation = objectType({
  name: \\"Mutation\\",
  definition(t) {
    t.string(\\"someList\\", {
      list: [false],
      args: {
        items: stringArg({
          list: [false],
          required: true
        }),
      },
    })
    t.field(\\"createPost\\", {
      type: Post,
      args: {
        input: arg({
          type: CreatePostInput,
          required: true
        }),
      },
    })
    t.field(\\"registerClick\\", {
      type: Query,
      args: {
        uuid: uuidArg(),
      },
    })
  }
})
export const Post = objectType({
  name: \\"Post\\",
  description: \\"This is a description of a Post\\",
  definition(t) {
    t.implements(Node)
    t.uuid(\\"uuid\\")
    t.field(\\"author\\", { type: User })
    t.float(\\"geo\\", { list: [true, true] })
    t.float(\\"messyGeo\\", {
      list: [true, false],
      nullable: true,
    })
  }
})
export const Query = objectType({
  name: \\"Query\\",
  definition(t) {
    t.field(\\"user\\", { type: User })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({
          type: PostFilters,
          required: true
        }),
      },
    })
    t.field(\\"unionField\\", { type: ExampleUnion })
  }
})
export const User = objectType({
  name: \\"User\\",
  definition(t) {
    t.implements(Node)
    t.string(\\"name\\", {
      description: \\"This is a description of a name\\",
      args: {
        prefix: stringArg({ description: \\"And a description of an arg\\" }),
      },
    })
    t.string(\\"email\\")
    t.string(\\"phone\\", { nullable: true })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({ type: PostFilters }),
      },
    })
    t.field(\\"outEnum\\", {
      type: SomeEnum,
      nullable: true,
    })
  }
})

export const Node = interfaceType({
  name: \\"Node\\",
  description: \\"This is a description of a Node\\",
  definition(t) {
    t.id(\\"id\\")
    t.resolveType(() => null)
  }
});

export const CreatePostInput = inputObjectType({
  name: \\"CreatePostInput\\",
  definition(t) {
    t.string(\\"name\\", { required: true })
    t.id(\\"author\\", { required: true })
    t.float(\\"geo\\", {
      list: [false, true],
      required: true,
    })
  }
});
export const PostFilters = inputObjectType({
  name: \\"PostFilters\\",
  definition(t) {
    t.field(\\"order\\", {
      type: OrderEnum,
      required: true,
    })
    t.string(\\"search\\")
  }
});

export const ExampleUnion = unionType({
  name: \\"ExampleUnion\\",
  definition(t) {
    t.members(Post, User)
  }
});

export const OrderEnum = enumType({
  name: \\"OrderEnum\\",
  members: [\\"ASC\\",\\"DESC\\"],
});
export const SomeEnum = enumType({
  name: \\"SomeEnum\\",
  members: [\\"A\\",{\\"name\\":\\"B\\",\\"deprecation\\":\\"This is a deprecation reason for B\\",\\"value\\":\\"B\\"}],
});

export const UUID = scalarType({
  name: \\"UUID\\",
  asNexusMethod: \\"uuid\\",
  serialize() { /* Todo */ },
  parseValue() { /* Todo */ },
  parseLiteral() { /* Todo */ }
});"
`);
});

test("convertSDL as commonjs", () => {
  expect(convertSDL(EXAMPLE_SDL, true)).toMatchInlineSnapshot(`
"const { objectType, stringArg, arg, uuidArg, interfaceType, inputObjectType, unionType, enumType, scalarType } = require('nexus');

const Mutation = objectType({
  name: \\"Mutation\\",
  definition(t) {
    t.string(\\"someList\\", {
      list: [false],
      args: {
        items: stringArg({
          list: [false],
          required: true
        }),
      },
    })
    t.field(\\"createPost\\", {
      type: Post,
      args: {
        input: arg({
          type: CreatePostInput,
          required: true
        }),
      },
    })
    t.field(\\"registerClick\\", {
      type: Query,
      args: {
        uuid: uuidArg(),
      },
    })
  }
})
const Post = objectType({
  name: \\"Post\\",
  description: \\"This is a description of a Post\\",
  definition(t) {
    t.implements(Node)
    t.uuid(\\"uuid\\")
    t.field(\\"author\\", { type: User })
    t.float(\\"geo\\", { list: [true, true] })
    t.float(\\"messyGeo\\", {
      list: [true, false],
      nullable: true,
    })
  }
})
const Query = objectType({
  name: \\"Query\\",
  definition(t) {
    t.field(\\"user\\", { type: User })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({
          type: PostFilters,
          required: true
        }),
      },
    })
    t.field(\\"unionField\\", { type: ExampleUnion })
  }
})
const User = objectType({
  name: \\"User\\",
  definition(t) {
    t.implements(Node)
    t.string(\\"name\\", {
      description: \\"This is a description of a name\\",
      args: {
        prefix: stringArg({ description: \\"And a description of an arg\\" }),
      },
    })
    t.string(\\"email\\")
    t.string(\\"phone\\", { nullable: true })
    t.list.field(\\"posts\\", {
      type: Post,
      args: {
        filters: arg({ type: PostFilters }),
      },
    })
    t.field(\\"outEnum\\", {
      type: SomeEnum,
      nullable: true,
    })
  }
})

const Node = interfaceType({
  name: \\"Node\\",
  description: \\"This is a description of a Node\\",
  definition(t) {
    t.id(\\"id\\")
    t.resolveType(() => null)
  }
});

const CreatePostInput = inputObjectType({
  name: \\"CreatePostInput\\",
  definition(t) {
    t.string(\\"name\\", { required: true })
    t.id(\\"author\\", { required: true })
    t.float(\\"geo\\", {
      list: [false, true],
      required: true,
    })
  }
});
const PostFilters = inputObjectType({
  name: \\"PostFilters\\",
  definition(t) {
    t.field(\\"order\\", {
      type: OrderEnum,
      required: true,
    })
    t.string(\\"search\\")
  }
});

const ExampleUnion = unionType({
  name: \\"ExampleUnion\\",
  definition(t) {
    t.members(Post, User)
  }
});

const OrderEnum = enumType({
  name: \\"OrderEnum\\",
  members: [\\"ASC\\",\\"DESC\\"],
});
const SomeEnum = enumType({
  name: \\"SomeEnum\\",
  members: [\\"A\\",{\\"name\\":\\"B\\",\\"deprecation\\":\\"This is a deprecation reason for B\\",\\"value\\":\\"B\\"}],
});

const UUID = scalarType({
  name: \\"UUID\\",
  asNexusMethod: \\"uuid\\",
  serialize() { /* Todo */ },
  parseValue() { /* Todo */ },
  parseLiteral() { /* Todo */ }
});

exports.Mutation = Mutation;
exports.Post = Post;
exports.Query = Query;
exports.User = User;
exports.Node = Node;
exports.CreatePostInput = CreatePostInput;
exports.PostFilters = PostFilters;
exports.ExampleUnion = ExampleUnion;
exports.OrderEnum = OrderEnum;
exports.SomeEnum = SomeEnum;
exports.UUID = UUID;"
`);
});

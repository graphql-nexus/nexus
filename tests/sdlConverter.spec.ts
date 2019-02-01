import { convertSDL, core } from "..";
import { EXAMPLE_SDL } from "./_sdl";

const { SDLConverter } = core;

describe("SDLConverter", () => {
  test("printObjectTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printObjectTypes())
      .toMatchInlineSnapshot(`
"export const Mutation = objectType({
  name: \\"Mutation\\",
  definition(t) {
    t.field(\\"createPost\\", {\\"type\\":\\"Post\\"})
    t.field(\\"registerClick\\", {\\"type\\":\\"Query\\"})
  }
})
export const Post = objectType({
  name: \\"Post\\",
  definition(t) {
    t.implements(\\"Node\\")
    t.uuid(\\"uuid\\")
    t.field(\\"author\\", {\\"type\\":\\"User\\"})
    t.float(\\"geo\\", {\\"list\\":[true,true]})
    t.float(\\"messyGeo\\", {\\"list\\":[true,false],\\"nullable\\":true})
  }
})
export const Query = objectType({
  name: \\"Query\\",
  definition(t) {
    t.field(\\"user\\", {\\"type\\":\\"User\\"})
    t.list.field(\\"posts\\", {\\"type\\":\\"Post\\"})
  }
})
export const User = objectType({
  name: \\"User\\",
  definition(t) {
    t.implements(\\"Node\\")
    t.string(\\"name\\")
    t.string(\\"email\\")
    t.string(\\"phone\\", {\\"nullable\\":true})
    t.list.field(\\"posts\\", {\\"type\\":\\"Post\\"})
    t.field(\\"outEnum\\", {\\"nullable\\":true,\\"type\\":\\"SomeEnum\\"})
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
  members: [\\"A\\",\\"B\\"],
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
  definition(t) {
    t.id(\\"id\\")
  }
});"
`);
  });
});

test("convertSDL", () => {
  expect(convertSDL(EXAMPLE_SDL)).toMatchInlineSnapshot(`
"export const Mutation = objectType({
  name: \\"Mutation\\",
  definition(t) {
    t.field(\\"createPost\\", {\\"type\\":\\"Post\\"})
    t.field(\\"registerClick\\", {\\"type\\":\\"Query\\"})
  }
})
export const Post = objectType({
  name: \\"Post\\",
  definition(t) {
    t.implements(\\"Node\\")
    t.uuid(\\"uuid\\")
    t.field(\\"author\\", {\\"type\\":\\"User\\"})
    t.float(\\"geo\\", {\\"list\\":[true,true]})
    t.float(\\"messyGeo\\", {\\"list\\":[true,false],\\"nullable\\":true})
  }
})
export const Query = objectType({
  name: \\"Query\\",
  definition(t) {
    t.field(\\"user\\", {\\"type\\":\\"User\\"})
    t.list.field(\\"posts\\", {\\"type\\":\\"Post\\"})
  }
})
export const User = objectType({
  name: \\"User\\",
  definition(t) {
    t.implements(\\"Node\\")
    t.string(\\"name\\")
    t.string(\\"email\\")
    t.string(\\"phone\\", {\\"nullable\\":true})
    t.list.field(\\"posts\\", {\\"type\\":\\"Post\\"})
    t.field(\\"outEnum\\", {\\"nullable\\":true,\\"type\\":\\"SomeEnum\\"})
  }
})

export const Node = interfaceType({
  name: \\"Node\\",
  definition(t) {
    t.id(\\"id\\")
  }
});

export const CreatePostInput = inputObjectType({
  name: \\"CreatePostInput\\",
  definition(t) {
  }
});
export const PostFilters = inputObjectType({
  name: \\"PostFilters\\",
  definition(t) {
  }
});

export const OrderEnum = enumType({
  name: \\"OrderEnum\\",
  members: [\\"ASC\\",\\"DESC\\"],
});
export const SomeEnum = enumType({
  name: \\"SomeEnum\\",
  members: [\\"A\\",\\"B\\"],
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

import { objectType, makeSchemaInternal, makeSchema } from "../src/core";

describe("unknownType", () => {
  const Query = objectType({
    name: "Query",
    definition(t) {
      t.field("user", {
        type: User,
        resolve(root, args, ctx) {
          return { id: "test", name: "test" };
        },
      });

      // Won't work
      t.field("user2", {
        type: "User",
        resolve(root, args, ctx) {
          return { id: "test", name: "test" };
        },
      });
    },
  });

  const User = objectType({
    name: "CustomUserName",
    definition(t) {
      t.id("id");
      t.string("name");
    },
  });

  test("schema should build without throwing", () => {
    expect(() => {
      makeSchemaInternal({
        types: [Query, User],
        outputs: false,
      });
    }).not.toThrowError();
  });

  test("there should be some missing types", () => {
    const { missingTypes } = makeSchemaInternal({
      types: [Query, User],
      outputs: false,
    });

    expect(Object.keys(missingTypes).length).toEqual(1);
    expect(Object.keys(missingTypes)).toContain("User");
  });

  test("should render the typegen but throw", () => {
    try {
      makeSchema({
        types: [Query, User],
        outputs: {
          schema: false,
          typegen: false,
        },
        shouldGenerateArtifacts: true,
      });
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
[Error: 
- Missing type User, did you forget to import a type to the root query?]
`);
    }
  });
});

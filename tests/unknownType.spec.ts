import * as path from "path";
import {
  objectType,
  makeSchemaInternal,
  makeSchema,
  UNKNOWN_TYPE_SCALAR,
} from "../src/core";
import { FileSystem } from "../src/fileSystem";
import { Kind } from "graphql";

describe("unknownType", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  test("UNKNOWN_TYPE_SCALAR is a scalar, with identity for the implementation", () => {
    const obj = {};
    expect(() => {
      UNKNOWN_TYPE_SCALAR.parseLiteral(
        { value: "123.45", kind: Kind.FLOAT },
        {}
      );
    }).toThrowError("Error: NEXUS__UNKNOWN__TYPE is not a valid scalar.");
    expect(() => UNKNOWN_TYPE_SCALAR.parseValue(obj)).toThrowError(
      "Error: NEXUS__UNKNOWN__TYPE is not a valid scalar."
    );
    expect(() => UNKNOWN_TYPE_SCALAR.serialize(obj)).toThrowError(
      "Error: NEXUS__UNKNOWN__TYPE is not a valid scalar."
    );
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

  test("should throw immediately if not generating artifacts", () => {
    try {
      makeSchema({
        types: [Query, User],
        outputs: {
          schema: false,
          typegen: false,
        },
        shouldGenerateArtifacts: false,
      });
    } catch (e) {
      expect(e.message).toMatchInlineSnapshot(`
"
- Missing type User, did you forget to import a type to the root query?"
`);
    }
  });

  test("should render the typegen but throw in the next-tick", (done) => {
    const spy = jest
      .spyOn(FileSystem.prototype, "replaceFile")
      .mockImplementation(async () => null);
    process.setUncaughtExceptionCaptureCallback((e) => {
      expect(spy).toBeCalledTimes(2);
      expect(spy.mock.calls[0]).toMatchSnapshot();
      expect(spy.mock.calls[1]).toMatchSnapshot();
      expect(e.message).toMatchInlineSnapshot(`
"
- Missing type User, did you forget to import a type to the root query?"
`);
      done();
    });

    makeSchema({
      types: [Query, User],
      outputs: {
        schema: path.join(__dirname, "test.graphql"),
        typegen: path.join(__dirname, "test.ts"),
      },
      shouldGenerateArtifacts: true,
    });
  });
});

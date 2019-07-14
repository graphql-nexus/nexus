import { FileSystem } from "../src/fileSystem";
import {
  SchemaBuilder,
  makeSchema,
  unionType,
  interfaceType,
  objectType,
} from "../src/core";

describe("SchemaBuilder", () => {
  let errSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("missingResolveType is called when a union type is missing a resolveType", async () => {
    const spy = jest.spyOn(SchemaBuilder.prototype, "missingResolveType");
    makeSchema({
      types: [
        unionType({
          name: "TestUnion",
          definition(t) {
            t.members(
              objectType({
                name: "Test",
                definition(t) {
                  t.string("foo");
                },
              })
            );
          },
        }),
      ],
      outputs: false,
    });
    expect(spy).toBeCalledTimes(1);
    expect(errSpy).toBeCalledTimes(1);
    const resolvedVal = spy.mock.results[0].value;
    expect(typeof resolvedVal).toEqual("function");
    expect(resolvedVal()).toEqual(null);
  });

  test("missingResolveType is called when an interface type is missing a resolveType", async () => {
    const spy = jest.spyOn(SchemaBuilder.prototype, "missingResolveType");
    makeSchema({
      types: [
        interfaceType({
          name: "Node",
          definition(t) {
            t.id("id");
          },
        }),
      ],
      outputs: false,
    });
    expect(spy).toBeCalledTimes(1);
    expect(errSpy).toBeCalledTimes(1);
    const resolvedVal = spy.mock.results[0].value;
    expect(typeof resolvedVal).toEqual("function");
    expect(resolvedVal()).toEqual(null);
  });
});

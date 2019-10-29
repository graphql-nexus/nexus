import { testSchema } from "./_helpers";
import { graphql } from "graphql";

testSchema("nullabilityGuard", (getSchema, getImported) => {
  const { onGuardedMock } = getImported() as { onGuardedMock: jest.Mock<any> };
  it("should trigger the nullability guard", async () => {
    const { errors = [], data } = await graphql(
      getSchema(),
      `
        {
          getUserWithGuard {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.getUserWithGuard).toEqual({ id: "User:N/A" });
    expect(onGuardedMock).toBeCalledTimes(1);
  });

  it("should fill ints with a default", async () => {
    const { errors = [], data } = await graphql(
      getSchema(),
      `
        {
          intList
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.intList).toEqual([1, 2, -1]);
    expect(onGuardedMock).toBeCalledTimes(1);
  });

  it("should fill with defaults", async () => {
    const { errors = [], data } = await graphql(
      getSchema(),
      `
        {
          userList {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.userList).toEqual([
      { id: "User:N/A" },
      { id: "User:N/A" },
      { id: "User:N/A" },
    ]);
    // Once for each null, once for each "id" field
    expect(onGuardedMock).toBeCalledTimes(6);
  });

  it("should guard on GraphQLObjectType fields", async () => {
    const { errors = [], data } = await graphql(
      getSchema(),
      `
        {
          objType {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.objType).toEqual({ id: "SomeObjectType:N/A" });
    expect(onGuardedMock).toBeCalledTimes(1);
  });
});

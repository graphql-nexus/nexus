import { testSchema } from "./_helpers";
import { graphql } from "graphql";

testSchema("nullabilityGuard", (getSchema) => {
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
    expect(data.getUserWithGuard).toEqual({ id: "N/A" });
  });
});

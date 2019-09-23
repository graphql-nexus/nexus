import { testSchema } from "./_helpers";
import { graphql } from "graphql";

testSchema("nullabilityGuard", (getSchema) => {
  it("should trigger the nullability guard", async () => {
    const data = await graphql(
      getSchema(),
      `
        {
          getUserWithGuard {
            id
          }
        }
      `
    );
    expect(data.errors).toEqual([]);
    expect(data.data).toEqual({ id: "N/A" });
  });
});

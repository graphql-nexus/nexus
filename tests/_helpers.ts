import faker from "faker";
import { objectType, inputObjectType } from "../src";

faker.seed(0);

/**
 * Used in testing, creates a generic "User" object
 */
export const UserObject = objectType({
  name: "User",
  definition(t) {
    t.id("id", () => `User:1`);
    t.string("email", () => faker.internet.email());
    t.string(
      "name",
      () => `${faker.name.firstName()} ${faker.name.lastName()}`
    );
  },
});

export const PostObject = objectType({
  name: "Post",
  definition(t) {
    t.field("user", { type: UserObject });
  },
});

export const InputObject = inputObjectType({
  name: "Something",
  definition(t) {
    t.int("id");
  },
});

import { objectType, inputObjectType } from "../src";

/**
 * Used in testing, creates a generic "User" object
 */
export const UserObject = objectType({
  name: "User",
  definition(t) {
    t.id("id", () => `User:1` as any);
    t.string("email", () => "test@example.com" as any);
    t.string("name", () => `Test User` as any);
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

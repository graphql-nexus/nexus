import faker from "faker";
import { objectType, inputObjectType } from "../src";

faker.seed(0);

/**
 * Used in testing, creates a generic "User" object
 */
export const UserObject = objectType("User", (t) => {
  t.id("id", () => `User:1`);
  t.string("email", () => faker.internet.email());
  t.string("name", () => `${faker.name.firstName()} ${faker.name.lastName()}`);
});

export const PostObject = objectType("Post", (t) => {
  t.field("user", UserObject);
});

export const InputObject = inputObjectType("Something", (t) => {
  t.int("id");
});

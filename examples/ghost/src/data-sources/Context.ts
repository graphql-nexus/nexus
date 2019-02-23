import { PostSource } from "./PostSource";
import { UserSource } from "./UserSource";
import { AuthSource } from "./AuthSource";
import { knex } from "../utils/knexInstance";

export class Context {
  auth = new AuthSource(this);
  post = new PostSource(this);
  user = new UserSource(this);

  get knex() {
    return knex;
  }
}

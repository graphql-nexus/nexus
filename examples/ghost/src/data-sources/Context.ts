import { PostSource } from "./PostSource";
import { UserSource } from "./UserSource";
import { knex } from "../utils/knexInstance";

export class Context {
  post = new PostSource(this);
  user = new UserSource(this);

  get knex() {
    return knex;
  }
}

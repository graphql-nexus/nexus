import { queryType, idArg, core } from "nexus";
import { Post } from "./Post";
import { User } from "./User";

export const Query = queryType({
  definition(t) {
    t.field("me", {
      type: Post,
      nullable: true,
      resolve() {
        return null;
      },
    });
    t.field("postById", {
      type: Post,
      args: { id: idArg() },
      resolve(root, args, ctx) {
        return ctx.post.byId(args.id);
      },
    });
    t.field("userById", {
      type: User,
      args: { id: idArg() },
      resolve(root, args, ctx) {
        return ctx.user.byId(args.id);
      },
    });
  },
  nonNullDefaults: { input: true },
});

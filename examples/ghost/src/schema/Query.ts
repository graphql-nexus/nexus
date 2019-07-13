import { queryType, idArg } from "nexus";
import { Post } from "./Post";
import { User } from "./User";

export const Query = queryType({
  definition(t) {
    t.field("me", {
      type: User,
      nullable: true,
      resolve() {
        return null;
      },
    });
    t.field("postById", {
      type: Post,
      args: { id: idArg() },
      authorize: (root, args, ctx) => ctx.auth.canViewPost(args.id),
      resolve(root, args, ctx) {
        return ctx.post.byId(args.id);
      },
    });
    t.field("userById", {
      type: User,
      args: { id: idArg() },
      authorize: (root, args, ctx) => ctx.auth.canViewUser(args.id),
      resolve(root, args, ctx) {
        return ctx.user.byId(args.id);
      },
    });
  },
  nonNullDefaults: { input: true },
});

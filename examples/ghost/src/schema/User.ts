import { objectType } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("slug");
    t.string("ghostAuthAccessToken", { nullable: true });
    t.string("ghostAuthId", { nullable: true });
    t.string("email");
    t.string("profileImage", { nullable: true });
    t.string("coverImage", { nullable: true });
    t.string("bio", { nullable: true });
    t.string("website", { nullable: true });
    t.string("location", { nullable: true });
    t.string("facebook", { nullable: true });
    t.string("twitter", { nullable: true });
    t.string("accessibility", { nullable: true });
    t.string("status");
    t.string("locale", { nullable: true });
    t.string("visibility");
    t.string("metaTitle", { nullable: true });
    t.string("metaDescription", { nullable: true });
    t.string("tour", { nullable: true });
    t.date("lastSeen", { nullable: true });
    t.date("createdAt");
    t.field("createdBy", {
      type: User,
      resolve: (root, args, ctx) => ctx.user.byId(root.createdBy),
    });
    t.date("updatedAt", { nullable: true });
    t.string("updatedBy", { nullable: true });
  },
});

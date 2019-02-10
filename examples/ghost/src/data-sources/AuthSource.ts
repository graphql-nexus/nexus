import { Context } from "./Context";

export class AuthSource {
  constructor(protected ctx: Context) {}

  async canViewPost(id: string): Promise<boolean> {
    const post = await this.ctx.post.byId(id);
    if (post.status === "published") {
      return true;
    }
    return false;
  }

  async canViewUser(id: string): Promise<boolean> {
    return true;
  }
}

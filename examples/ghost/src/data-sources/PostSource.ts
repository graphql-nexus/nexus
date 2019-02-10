import DataLoader from "dataloader";
import { Context } from "./Context";
import { dbt } from "../generated";
import { byColumnLoader, manyByColumnLoader } from "../utils/loaderUtils";

export class PostSource {
  constructor(protected ctx: Context) {}

  authorIdsLoader = new DataLoader<string, dbt.PostsAuthors[]>((ids) => {
    return manyByColumnLoader(this.ctx, "postsAuthors", "postId", ids);
  });

  byIdLoader = new DataLoader<string, dbt.Posts>((ids) => {
    return byColumnLoader(this.ctx, "posts", "id", ids);
  });

  byId(id: string) {
    return this.byIdLoader.load(id);
  }

  async authorIds(postId: string) {
    const result = await this.authorIdsLoader.load(postId);
    return result.map(({ authorId }) => authorId);
  }

  async authors(postId: string) {
    const authorIds = await this.authorIds(postId);
    return this.ctx.user.byIdLoader.loadMany(authorIds);
  }
}

import DataLoader from "dataloader";
import { Context } from "./Context";
import { dbt } from "../generated";
import { byColumnLoader } from "../utils/loaderUtils";

export class PostSource {
  constructor(protected ctx: Context) {}

  byIdLoader = new DataLoader<string, dbt.Posts>((ids) => {
    return byColumnLoader(this.ctx, "posts", "id", ids);
  });

  byId(id: string) {
    return this.byIdLoader.load(id);
  }
}

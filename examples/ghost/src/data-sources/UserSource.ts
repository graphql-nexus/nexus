import DataLoader from "dataloader";
import { byColumnLoader } from "../utils/loaderUtils";
import { Context } from "./Context";
import { dbt } from "../generated";

export class UserSource {
  constructor(protected ctx: Context) {}

  byIdLoader = new DataLoader<string, dbt.Users>((ids) => {
    return byColumnLoader(this.ctx, "users", "id", ids);
  });

  byId(id: string) {
    return this.byIdLoader.load(id);
  }
}

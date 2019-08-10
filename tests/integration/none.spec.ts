import { compileTypescript } from "./_helpers";
import { join } from "path";

it("can be compiled with no generated types present", () => {
  compileTypescript([join(__dirname, "./_s.ts")]);
});

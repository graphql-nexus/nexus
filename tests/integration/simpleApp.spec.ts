import { compileTypescript } from "./_helpers";
import { join } from "path";

it("can be compiled with no generated types present", () => {
  compileTypescript([
    join(__dirname, "./_simpleApp.ts"),
  ]);
});

it("can be compiled with basic generated types present", () => {
  // TODO use ts-node programatically to generate _simpleApp.d.ts
  // on the fly
  compileTypescript([
    join(__dirname, "./_simpleApp.ts"),
    join(__dirname, "./_simpleApp.d.ts"),
  ]);
});

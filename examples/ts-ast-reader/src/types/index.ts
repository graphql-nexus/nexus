import { objectType, stringArg } from "nexus";
import ts from "typescript";
import fs from "fs-extra";

export * from "./typeNodes";
export * from "./declarations";
export * from "./enums";
export * from "./interfaces";
export * from "./mixins";
export * from "./objects";
export * from "./unions";
export * from "./jsdoc";

export interface ContextType {
  source: ts.SourceFile;
}

export const Query = objectType("Query", (t) => {
  t.field("parseFile", "SourceFile", {
    args: {
      file: stringArg({ required: true }),
    },
    async resolve(root, args, ctx) {
      const fileContents = await fs.readFile(args.file, "utf-8");
      const sourceFile = ts.createSourceFile(
        args.file,
        fileContents,
        ts.ScriptTarget.ES2017
      );
      ctx.source = sourceFile;

      return sourceFile;
    },
  });
});

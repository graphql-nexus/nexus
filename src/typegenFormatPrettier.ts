import path from "path";

export type TypegenFormatFn = (
  content: string,
  type: "types" | "schema"
) => string | Promise<string>;

export function typegenFormatPrettier(
  prettierConfig: string | object
): TypegenFormatFn {
  return async function formatTypegen(
    content: string,
    type: "types" | "schema"
  ) {
    let prettier: typeof import("prettier");
    /* istanbul ignore next */
    try {
      prettier = require("prettier") as typeof import("prettier");
    } catch {
      console.warn(
        "It looks like you provided a `prettierConfig` option to GraphQL Nexus, but you do not have prettier " +
          "installed as a dependency in your project. Please add it as a peerDependency of nexus to use this feature. " +
          "Skipping formatting."
      );
      return content;
    }
    if (typeof prettierConfig === "string") {
      /* istanbul ignore if */
      if (!path.isAbsolute(prettierConfig)) {
        console.error(
          new Error(
            `Expected prettierrc path to be absolute, saw ${prettierConfig}. Skipping formatting.`
          )
        );
        return content;
      }
      const fs = require("fs") as typeof import("fs");
      const util = require("util") as typeof import("util");
      const readFile = util.promisify(fs.readFile);
      prettierConfig = JSON.parse(await readFile(prettierConfig, "utf8"));
    }
    return prettier.format(content, {
      ...(prettierConfig as object),
      parser: type === "types" ? "typescript" : "graphql",
    });
  };
}

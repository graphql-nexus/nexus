import {
  GraphQLSchema,
  isOutputType,
  GraphQLNamedType,
  isEnumType,
} from "graphql";
import path from "path";
import * as Types from "./types";
import { TYPEGEN_HEADER } from "./lang";
import { log, objValues } from "./utils";
import { SCALAR_TYPES } from "./common";

/**
 * This is an approach for handling type definition auto-resolution.
 * It is designed to handle the most common cases, as can be seen
 * in the examples / the simplicity of the implementation.
 *
 * If you wish to do something more complex, involving full
 * AST parsing, etc, you can provide a different function to
 * the `typegenInfo` property of the `makeSchema` config.
 *
 * @param options
 */
export function typegenAutoConfig(options: Types.TypegenAutoConfigOptions) {
  return async (
    schema: GraphQLSchema,
    outputPath: string
  ): Promise<Types.TypegenInfo> => {
    const {
      headers,
      contextType,
      skipTypes = ["Query", "Mutation", "Subscription"],
      backingTypeMap: _backingTypeMap,
      debug,
    } = options;

    const typeMap = schema.getTypeMap();
    const typesToIgnore = new Set<string>();
    const typesToIgnoreRegex: RegExp[] = [];
    const allImportsMap: Record<string, string> = {};
    const importsMap: Record<string, [string, boolean]> = {};

    const backingTypeMap: Record<string, string> = {
      ...SCALAR_TYPES,
      ..._backingTypeMap,
    };

    const forceImports = new Set(
      objValues(backingTypeMap)
        .concat(contextType || "")
        .map((t) => {
          const match = t.match(/^(\w+)\./);
          return match ? match[1] : null;
        })
        .filter((f) => f)
    );

    skipTypes.forEach((skip) => {
      if (typeof skip === "string") {
        typesToIgnore.add(skip);
      } else if (skip instanceof RegExp) {
        typesToIgnoreRegex.push(skip);
      } else {
        throw new Error(
          "Invalid type for options.skipTypes, expected string or RegExp"
        );
      }
    });

    const typeSources = await Promise.all(
      options.sources.map(async (source) => {
        // Keeping all of this in here so if we don't have any sources
        // e.g. in the Playground, it doesn't break things.

        // Yeah, this doesn't exist in Node 6, but since this is a new
        // lib and that's super close to EOL so if you really need it.
        // open a PR :)
        const fs = require("fs") as typeof import("fs");
        const util = require("util") as typeof import("util");
        const readFile = util.promisify(fs.readFile);
        const {
          module: pathOrModule,
          glob = true,
          onlyTypes,
          alias,
          typeMatch,
        } = source;
        if (
          path.isAbsolute(pathOrModule) &&
          path.extname(pathOrModule) !== ".ts"
        ) {
          return console.warn(
            `GraphQL Nexus Typegen: Expected module ${pathOrModule} to be an absolute path to a TypeScript module, skipping.`
          );
        }
        let resolvedPath: string;
        let fileContents: string;
        try {
          resolvedPath = require.resolve(pathOrModule, {
            paths: [process.cwd()],
          });
          if (path.extname(resolvedPath) !== ".ts") {
            resolvedPath = findTypingForFile(resolvedPath, pathOrModule);
          }
          fileContents = await readFile(resolvedPath, "utf-8");
        } catch (e) {
          if (
            e instanceof Error &&
            e.message.indexOf("Cannot find module") !== -1
          ) {
            console.error(
              `GraphQL Nexus: Unable to find file or module ${pathOrModule}, skipping`
            );
          } else {
            console.error(e.message);
          }
          return null;
        }

        const importPath = (path.isAbsolute(pathOrModule)
          ? relativePathTo(resolvedPath, outputPath)
          : pathOrModule
        ).replace(/\.d?\.ts/, "");

        if (allImportsMap[alias] && allImportsMap[alias] !== importPath) {
          return console.warn(
            `GraphQL Nexus Typegen: Cannot have multiple type sources ${
              importsMap[alias]
            } and ${pathOrModule} with the same alias ${alias}, skipping`
          );
        }
        allImportsMap[alias] = importPath;

        if (forceImports.has(alias)) {
          importsMap[alias] = [importPath, glob];
          forceImports.delete(alias);
        }

        return {
          alias,
          glob,
          importPath,
          fileContents,
          onlyTypes,
          typeMatch: typeMatch || defaultTypeMatcher,
        };
      })
    );

    const builtinScalars = new Set(Object.keys(SCALAR_TYPES));

    Object.keys(typeMap).forEach((typeName) => {
      if (typeName.indexOf("__") === 0) {
        return;
      }
      if (typesToIgnore.has(typeName)) {
        return;
      }
      if (typesToIgnoreRegex.some((r) => r.test(typeName))) {
        return;
      }
      if (backingTypeMap[typeName]) {
        return;
      }
      if (builtinScalars.has(typeName)) {
        return;
      }

      const type = schema.getType(typeName);

      // For now we'll say that if it's non-enum output type it can be backed
      if (isOutputType(type) && !isEnumType(type)) {
        for (let i = 0; i < typeSources.length; i++) {
          const typeSource = typeSources[i];
          if (!typeSource) {
            continue;
          }
          // If we've specified an array of "onlyTypes" to match ensure the
          // `typeName` falls within that list.
          if (typeSource.onlyTypes) {
            if (
              !typeSource.onlyTypes.some((t) => {
                return t instanceof RegExp ? t.test(typeName) : t === typeName;
              })
            ) {
              continue;
            }
          }
          const {
            fileContents,
            importPath,
            glob,
            alias,
            typeMatch,
          } = typeSource;
          const typeRegex = typeMatch(type, defaultTypeMatcher(type)[0]);
          const matched = firstMatch(
            fileContents,
            Array.isArray(typeRegex) ? typeRegex : [typeRegex]
          );
          if (matched) {
            if (debug) {
              log(
                `Matched type - ${typeName} in "${importPath}" - ${alias}.${
                  matched[1]
                }`
              );
            }
            importsMap[alias] = [importPath, glob];
            backingTypeMap[typeName] = `${alias}.${matched[1]}`;
          } else {
            if (debug) {
              log(
                `No match for ${typeName} in "${importPath}" using ${typeRegex}`
              );
            }
          }
        }
      }
    });

    if (forceImports.size > 0) {
      console.error(
        `Missing required typegen import: ${Array.from(forceImports)}`
      );
    }

    const imports: string[] = [];

    Object.keys(importsMap).forEach((alias) => {
      const [importPath, glob] = importsMap[alias];
      imports.push(
        `import ${glob ? "* as " : ""}${alias} from "${importPath}"`
      );
    });

    const typegenInfo = {
      headers: headers || [TYPEGEN_HEADER],
      backingTypeMap,
      imports,
      contextType,
    };

    return typegenInfo;
  };
}

function relativePathTo(absolutePath: string, outputPath: string): string {
  const filename = path.basename(absolutePath).replace(/(\.d)?\.ts/, "");
  const relative = path.relative(
    path.dirname(outputPath),
    path.dirname(absolutePath)
  );
  if (relative.indexOf(".") !== 0) {
    return `.${path.sep}${path.join(relative, filename)}`;
  }
  return path.join(relative, filename);
}

function findTypingForFile(absolutePath: string, pathOrModule: string) {
  // First try to find the "d.ts" adjacent to the file
  try {
    const typeDefPath = absolutePath.replace(
      path.extname(absolutePath),
      ".d.ts"
    );
    require.resolve(typeDefPath);
    return typeDefPath;
  } catch (e) {
    console.error(e);
  }

  // TODO: need to figure out cases where it's a node module
  // and "typings" is set in the package.json

  throw new Error(
    `Unable to find typings associated with ${pathOrModule}, skipping`
  );
}

const firstMatch = (
  fileContents: string,
  typeRegex: RegExp[]
): RegExpExecArray | null => {
  for (let i = 0; i < typeRegex.length; i++) {
    const regex = typeRegex[i];
    const match = regex.exec(fileContents);
    if (match) {
      return match;
    }
  }
  return null;
};

const defaultTypeMatcher = (type: GraphQLNamedType) => {
  return [new RegExp(`(?:interface|type|class)\\s+(${type.name})\\W`, "g")];
};

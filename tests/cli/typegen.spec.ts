import { spawnSync, SpawnSyncReturns } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

describe("$ nexus typgen", () => {
  const entrypointFilePath = join(__dirname, "../../entrypoint.tmp.ts");

  const run = (
    ...args: string[]
  ): { stderr: string; stdout: string; status: null | number } => {
    let { stderr, stdout, status } = spawnSync("bin/run", args, {
      encoding: "utf8",
    });
    stderr = stderr.replace(
      /(Cannot find module )'\/.*\/(.*)/,
      "$1__DYNAMIC_ONTENT__/$2"
    );
    return { stderr, stdout, status };
  };

  it("has helpful documentation", () => {
    expect(run("typegen", "--help")).toMatchInlineSnapshot(`
                  Object {
                    "status": 0,
                    "stderr": "",
                    "stdout": "[1mUSAGE[22m
                    $ nexus typegen [ENTRYPOINT]

                  [1mARGUMENTS[22m
                    ENTRYPOINT
                        [2m[22m
                        [2mRelative path (from cwd) to your app's TypeScript module that will run [22m
                        [2mdirectly or indirectly Nexus.makeSchema. By default the following paths will [22m
                        [2mbe searched, picking the first match, or erroring out[22m
                        [2m[22m
                        [2m    * src/schema/index.ts[22m
                        [2m    * src/schema.ts[22m
                        [2m    * src/server.ts[22m
                        [2m    * src/main.ts[22m
                        [2m    * src/index.ts[22m
                        [2m[22m
                        [2m    * schema/index.ts[22m
                        [2m    * schema.ts[22m
                        [2m    * server.ts[22m
                        [2m    * main.ts[22m
                        [2m    * index.ts[22m
                        [2m[22m
                        [2m      ERROR[22m

                  [1mDESCRIPTION[22m
                    Generate TypeScript types derived from your schema for complete type safety 
                    across all your definition blocks and resolvers.

                  [1mALIASES[22m
                    $ nexus tg

                  ",
                  }
            `);
  });

  it("reports failure if the given entrypoint could not be found", () => {
    expect(run("typegen", "entrypoint.tmp.ts")).toMatchInlineSnapshot(`
      Object {
        "status": 1,
        "stderr": "
      Something went wrong while running Nexus typegen:

          Cannot find module __DYNAMIC_ONTENT__/entrypoint.tmp.ts'
          
      ",
        "stdout": "",
      }
    `);
  });

  it("runs the given entrypoint with ts-node --transpile-only if found", () => {
    writeFileSync(
      entrypointFilePath,
      'let a: string = 1; console.log("RAN DESPITE TYPE ERROR")'
    );
    expect(run("typegen", "entrypoint.tmp.ts")).toMatchInlineSnapshot(`
                              Object {
                                "status": 0,
                                "stderr": "",
                                "stdout": "RAN DESPITE TYPE ERROR

                              Success! Tailored TypeScript declaration for your GraphQL types and resolvers generated.
                              ",
                              }
                    `);
  });

  it("runs with NEXUS_SHOULD_GENERATE_ARTIFACTS and NEXUS_EXIT_AFTER_TYPEGEN enabled", () => {
    writeFileSync(
      entrypointFilePath,
      `console.log(process.env.NEXUS_SHOULD_GENERATE_ARTIFACTS)
      console.log(process.env.NEXUS_EXIT_AFTER_TYPEGEN)`
    );
    expect(run("typegen", "entrypoint.tmp.ts")).toMatchInlineSnapshot(`
                              Object {
                                "status": 0,
                                "stderr": "",
                                "stdout": "true
                              true

                              Success! Tailored TypeScript declaration for your GraphQL types and resolvers generated.
                              ",
                              }
                    `);
  });

  afterEach(() => {
    try {
      unlinkSync(entrypointFilePath);
    } catch {}
  });
});

import { spawnSync, SpawnSyncReturns } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import stripANSI from "strip-ansi";

describe("$ nexus typgen", () => {
  const entrypointFilePath = join(__dirname, "../../entrypoint.tmp.ts");

  const run = (
    ...args: string[]
  ): { stderr: string; stdout: string; status: null | number } => {
    let { stderr, stdout, status } = spawnSync("bin/run", args, {
      encoding: "utf8",
    });
    stderr = stderr.replace(
      /(Cannot find module '\/).*(\/.*)/,
      "$1__DYNAMIC_ONTENT__$2"
    );
    stderr = stripANSI(stderr);
    stdout = stripANSI(stdout);
    return { stderr, stdout, status };
  };

  // Does not render exactly the same on CI, thus failing there.
  // https://github.com/oclif/command/issues/77
  //
  it.skip("has helpful documentation", () => {
    expect(run("typegen", "--help")).toMatchInlineSnapshot(`
                              Object {
                                "status": 0,
                                "stderr": "",
                                "stdout": "USAGE
                                $ nexus typegen [ENTRYPOINT]

                              ARGUMENTS
                                ENTRYPOINT

                                    Relative path (from cwd) to your app's TypeScript module that will run
                                    directly or indirectly Nexus.makeSchema. By default the following paths will
                                    be searched, picking the first match, or erroring out

                                        * src/schema/index.ts
                                        * src/schema.ts
                                        * src/server.ts
                                        * src/main.ts
                                        * src/index.ts

                                        * schema/index.ts
                                        * schema.ts
                                        * server.ts
                                        * main.ts
                                        * index.ts

                                          ERROR

                              DESCRIPTION
                                Generate TypeScript types derived from your schema for complete type safety
                                across all your definition blocks and resolvers.

                              ALIASES
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

          Cannot find module '/__DYNAMIC_ONTENT__/entrypoint.tmp.ts'
          
      ",
        "stdout": "",
      }
    `);
  });

  it("runs the given entrypoint with ts-node --transpile-only if found", () => {
    writeFileSync(
      entrypointFilePath,
      'let a: string = 1; process.stdout.write("RAN DESPITE TYPE ERROR")'
    );
    expect(run("typegen", "entrypoint.tmp.ts")).toMatchInlineSnapshot(`
            Object {
              "status": 0,
              "stderr": "",
              "stdout": "RAN DESPITE TYPE ERROR",
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

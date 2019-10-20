import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import * as Path from "path";
import stripANSI from "strip-ansi";

describe("$ nexus generate", () => {
  const entrypointFilePath = Path.join(__dirname, "../../entrypoint.tmp.ts");

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
    expect(run("generate", "--help")).toMatchInlineSnapshot();
  });

  it("reports failure if the given entrypoint could not be found", () => {
    expect(run("generate", "-e entrypoint.tmp.ts")).toMatchInlineSnapshot(`
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
    expect(run("generate", "-e entrypoint.tmp.ts")).toMatchInlineSnapshot(`
                              Object {
                                "status": 0,
                                "stderr": "",
                                "stdout": "RAN DESPITE TYPE ERROR",
                              }
                    `);
  });

  it("puts JSON into NEXUS_CONFIG to control makeSchema config", () => {
    writeFileSync(
      entrypointFilePath,
      "process.stdout.write(JSON.stringify(JSON.parse(process.env.NEXUS_CONFIG)))"
    );
    expect(run("generate", "-e entrypoint.tmp.ts")).toMatchInlineSnapshot(`
      Object {
        "status": 0,
        "stderr": "",
        "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true}",
      }
    `);
  });

  afterEach(() => {
    try {
      unlinkSync(entrypointFilePath);
    } catch {}
  });
});

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
      "$1__DYNAMIC__$2"
    );
    stderr = stripANSI(stderr);
    stdout = stripANSI(stdout);
    return { stderr, stdout, status };
  };

  function writeNexusConfigSniffer() {
    writeFileSync(
      entrypointFilePath,
      "process.stdout.write(JSON.stringify(JSON.parse(process.env.NEXUS_CONFIG)))"
    );
  }

  // Does not render exactly the same on CI, thus failing there.
  // https://github.com/oclif/command/issues/77
  //
  it.skip("has helpful documentation", () => {
    expect(run("generate", "--help")).toMatchInlineSnapshot();
  });

  //
  // --entrypoint
  //

  describe("--entrypoint controls the target passed to ts-node", () => {
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

    it("reports failure if the given entrypoint could not be found", () => {
      expect(run("generate", "-e entrypoint.tmp.ts")).toMatchInlineSnapshot(`
        Object {
          "status": 1,
          "stderr": "
        Something went wrong while generating artifacts:

            Cannot find module '/__DYNAMIC__/entrypoint.tmp.ts'
            
        ",
          "stdout": "",
        }
      `);
    });
  });

  //
  // --output-graphql-schema
  //

  describe("--output-graphql-schema controls outputs.schema", () => {
    beforeEach(writeNexusConfigSniffer);

    it("accepts an absolute path", () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-g /foo/bar"))
        .toMatchInlineSnapshot(`
                                        Object {
                                          "status": 0,
                                          "stderr": "",
                                          "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"typegen\\":\\"/foo/bar\\"}}",
                                        }
                              `);
    });

    it("accepts a path relative to cwd", () => {
      const result = run("generate", "-e entrypoint.tmp.ts", "-g ./bar");
      result.stdout = result.stdout.replace(
        /("typegen":"\/).+(\/bar")/,
        "$1__DYNAMIC__$2"
      );
      expect(result).toMatchInlineSnapshot(`
                                Object {
                                  "status": 0,
                                  "stderr": "",
                                  "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"typegen\\":\\"/__DYNAMIC__/bar\\"}}",
                                }
                        `);
    });

    it('accepts "default" to enable output but use default Nexus path for it', () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-g default"))
        .toMatchInlineSnapshot(`
                                        Object {
                                          "status": 0,
                                          "stderr": "",
                                          "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"typegen\\":true}}",
                                        }
                              `);
    });

    it('accepts "true" to enable output but use default Nexus path for it', () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-g true"))
        .toMatchInlineSnapshot(`
                                        Object {
                                          "status": 0,
                                          "stderr": "",
                                          "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"typegen\\":true}}",
                                        }
                              `);
    });
  });

  //
  // --output-typescript-types
  //

  describe("--output-typescript-types controls outputs.typegen", () => {
    beforeEach(writeNexusConfigSniffer);

    it("accepts an absolute path", () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-t /foo/bar"))
        .toMatchInlineSnapshot(`
                Object {
                  "status": 0,
                  "stderr": "",
                  "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"schema\\":\\"/foo/bar\\"}}",
                }
            `);
    });

    it("accepts a path relative to cwd", () => {
      const result = run("generate", "-e entrypoint.tmp.ts", "-t ./bar");
      result.stdout = result.stdout.replace(
        /("schema":"\/).+(\/bar")/,
        "$1__DYNAMIC__$2"
      );
      expect(result).toMatchInlineSnapshot(`
        Object {
          "status": 0,
          "stderr": "",
          "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"schema\\":\\"/__DYNAMIC__/bar\\"}}",
        }
      `);
    });

    it('accepts "default" to enable output but use default Nexus path for it', () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-t default"))
        .toMatchInlineSnapshot(`
                Object {
                  "status": 0,
                  "stderr": "",
                  "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"schema\\":true}}",
                }
            `);
    });

    it('accepts "true" to enable output but use default Nexus path for it', () => {
      expect(run("generate", "-e entrypoint.tmp.ts", "-t true"))
        .toMatchInlineSnapshot(`
                Object {
                  "status": 0,
                  "stderr": "",
                  "stdout": "{\\"shouldGenerateArtifacts\\":true,\\"shouldExitAfterGenerateArtifacts\\":true,\\"outputs\\":{\\"schema\\":true}}",
                }
            `);
    });
  });

  afterEach(() => {
    try {
      unlinkSync(entrypointFilePath);
    } catch {}
  });
});

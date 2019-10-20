import * as Path from "path";
import * as cp from "child_process";
import Command, * as oclif from "@oclif/command";
import { indentBlock } from "../../utils";
import { BuilderConfig } from "../../builder";

export class Generate extends Command {
  static aliases = ["tg"];

  static description =
    "Generate Nexus artifacts. By default your config.outputs settings will be used but you can override per output type via the respective flag.";

  static flags = {
    entrypoint: oclif.flags.string({
      char: "e",
      helpValue: "path",
      description: `
Path to your app's TypeScript module that will run directly or indirectly Nexus.makeSchema. By default the following paths will be searched, picking the first match, or erroring out

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

      ERROR`,
    }),

    "output-typescript-types": oclif.flags.string({
      char: "t",
      helpValue: "path | 'true' (alias: 'default')",
      description:
        "If and where to generate the derived TypeScript types (aka. typegen). Useful for providing autocompletion and type safety across all your definition blocks and resolvers.",
    }),
    "output-graphql-schema": oclif.flags.string({
      char: "g",
      helpValue: "path | 'true' (alias: 'default')",
      description:
        "If and where to generate the GraphQL schema as a file in SDL form. Useful for debugging or teams desiring SDL in their peer review process.",
    }),
  };

  async run() {
    const { flags } = this.parse(Generate);

    const outputFlags = {
      typegen:
        typeof flags["output-graphql-schema"] === "string"
          ? flags["output-graphql-schema"].trim()
          : null,
      schema:
        typeof flags["output-typescript-types"] === "string"
          ? flags["output-typescript-types"].trim()
          : null,
    };

    const hasOutputFlags =
      Object.entries(outputFlags).filter(([_, present]) => present).length !==
      0;

    // build up config
    const config: BuilderConfig = {
      shouldGenerateArtifacts: true,
      shouldExitAfterGenerateArtifacts: true,
    };

    if (hasOutputFlags) {
      config.outputs = {};
    }

    if (outputFlags.schema) {
      // HACK `any` b/c TS does not narrow `config.outputs` in accordance with
      // it having been assigned an object above.
      (config.outputs as any).schema = ["true", "default"].includes(
        outputFlags.schema
      )
        ? true
        : Path.resolve(outputFlags.schema);
    }

    if (outputFlags.typegen) {
      // HACK `any` b/c TS does not narrow `config.outputs` in accordance with
      // it having been assigned an object above.
      (config.outputs as any).typegen = ["true", "default"].includes(
        outputFlags.typegen
      )
        ? true
        : Path.resolve(outputFlags.typegen);
    }

    let entrypoint: string;
    if (typeof flags.entrypoint === "string") {
      entrypoint = flags.entrypoint.trim();
    } else {
      entrypoint = "./todo/default/path/search";
    }

    let result: cp.SpawnSyncReturns<string>;
    try {
      result = cp.spawnSync(
        "npx",
        ["ts-node", "--transpile-only", entrypoint],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NEXUS_CONFIG: JSON.stringify(config),
          },
        }
      );
    } catch (error) {
      console.error(
        `\nSomething went wrong while running Nexus typegen:\n\n${indentBlock(
          4,
          error.stack
        )}`
      );
      process.exit(1);
    }

    if (result!.stderr !== "") {
      console.error(
        `\nSomething went wrong while running Nexus typegen:\n\n${indentBlock(
          4,
          result!.stderr
        )}`
      );
      process.exit(1);
    }

    process.stdout.write(result!.stdout);
  }
}

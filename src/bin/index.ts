#!/usr/bin/env node

import * as path from "path";
import * as cp from "child_process";
import * as Commander from "commander";
import { indentBlock, getPackageVersion } from "../utils";

const program = new Commander.Command();

//
// Define typegen command
//

program
  .command("typegen [entryPoint]")
  .alias("tg")
  .description(
    "Generate TypeScript types derived from your schema for complete type safety across all your definition blocks and resolvers."
  )
  .option("-h, --help", "", () => {
    console.log(`
Usage:

    nexus typegen|tg [options] [entryPoint]  

Description:

    Generate TypeScript types derived from your schema for complete type safety across all your definition blocks and resolvers.    

Parameters:

    entryPoint?: string
    -------------------
    Relative path (from cwd) to your app's TypeScript module
    that will run directly or indirectly Nexus.makeSchema. By
    default the following paths will be searched, picking the
    first match, or erroring out:

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

Options:

    -V, --version                      output the version number
    -h, --help                         output usage information    
`);
    process.exit(1);
  })
  .action((relativeEntryPoint?: string) => {
    const entryPoint = path.join(process.cwd(), relativeEntryPoint || "");

    let result: cp.SpawnSyncReturns<string>;
    try {
      result = cp.spawnSync(
        "npx",
        ["ts-node", "--transpile-only", entryPoint],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NEXUS_SHOULD_GENERATE_ARTIFACTS: "true",
            NEXUS_EXIT_AFTER_TYPEGEN: "true",
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

    console.log(result!.stdout);
    console.log(
      "Success! Tailored TypeScript declaration for your GraphQL types and resolvers generated."
    );
  });

//
// Expose command/option to inspect Nexus version in use
//

program.version(getPackageVersion());

program
  .command("version", { noHelp: true })
  .description("output the version number")
  .action(() => {
    console.log(getPackageVersion());
  });

//
// output help if unknown command given
//

program.on("command:*", () => {
  console.error(
    `\nSorry that is not a valid command:\n\n    ${program.args.join(" ")}\n`
  );
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);

//
// output help if no commands/options are given
//

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

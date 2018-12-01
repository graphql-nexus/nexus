/**
 * Links examples & website to local version of graphqliteral
 */
import { exec } from "child_process";
import util from "util";
import path from "path";
import { allExamples } from "./constants";

const execAsync = util.promisify(exec);

async function linkDir(dir: string, root: string) {
  await execAsync("yarn", {
    cwd: dir,
  });
  await execAsync("yarn link gqliteral", {
    cwd: dir,
  });
  await execAsync("rm -rf graphql", {
    cwd: path.join(dir, "node_modules"),
  });
  await execAsync(
    `ln -s ${path.join(root, "node_modules/graphql")} ./graphql`,
    {
      cwd: path.join(dir, "node_modules"),
    }
  );
}

export async function linkExamples() {
  const root = path.join(__dirname, "../..");
  const { stdout } = await execAsync("yarn link", {
    cwd: root,
  });
  console.log(stdout);
  await Promise.all(
    allExamples
      .map(async (exampleDir) => {
        const dir = path.join(root, `examples/${exampleDir}`);
        console.log(`Linking ${exampleDir}`);
        await linkDir(dir, root);
        console.log(`Finished linking ${exampleDir}`);
      })
      .concat(
        (async () => {
          console.log("Linking website");
          await linkDir(path.join(root, "website"), root);
          console.log("Finished linking website");
        })()
      )
  );
}

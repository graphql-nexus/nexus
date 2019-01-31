/**
 * Links examples & website to local version of Nexus GraphQL
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
  await execAsync("yarn link nexus", {
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

const rootPath = path.join(__dirname, "../..");
export async function linkNexus() {
  const { stdout } = await execAsync("yarn link", {
    cwd: rootPath,
  });
  console.log(stdout);
}

export async function linkWebsite() {
  console.log("Linking website");
  await linkDir(path.join(rootPath, "website"), rootPath);
  console.log("Finished linking website");
}

export async function linkExamples() {
  await Promise.all(
    allExamples
      .map(async (exampleDir) => {
        const dir = path.join(rootPath, `examples/${exampleDir}`);
        console.log(`Linking ${exampleDir}`);
        await linkDir(dir, rootPath);
        console.log(`Finished linking ${exampleDir}`);
      })
      .concat(linkWebsite())
  );
}

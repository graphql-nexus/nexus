import { exec } from "child_process";
import util from "util";
import path from "path";
import { allExamples } from "./constants";

const execAsync = util.promisify(exec);

async function unlinkDir(dir: string) {
  await execAsync("rm -rf graphql", {
    cwd: path.join(dir, "node_modules"),
  });
  await execAsync("yarn unlink nexus", {
    cwd: dir,
  });
  await execAsync("yarn --force", {
    cwd: dir,
  });
}

export async function unlinkExamples() {
  const root = path.join(__dirname, "../..");
  await Promise.all(
    allExamples
      .map(async (exampleDir) => {
        const dir = path.join(root, `examples/${exampleDir}`);
        console.log(`Unliking ${exampleDir}`);
        unlinkDir(dir);
        console.log(`Finished unlinking ${exampleDir}`);
      })
      .concat(
        (async () => {
          console.log("Unlinking website");
          await unlinkDir(path.join(root, "website"));
          console.log("Finished unlinking website");
        })()
      )
  );
}

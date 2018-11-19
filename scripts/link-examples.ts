import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);
const allExamples = ["star-wars", "githunt-api", "apollo-fullstack"];

async function linkExamples() {
  const root = path.join(__dirname, "..");
  const { stdout } = await execAsync("yarn link", {
    cwd: root,
  });
  console.log(stdout);
  await Promise.all(
    allExamples.map(async (exampleDir) => {
      const dir = path.join(__dirname, `../examples/${exampleDir}`);
      console.log(`Linking ${exampleDir}`);
      await execAsync("yarn", {
        cwd: dir,
      });
      await execAsync("yarn link gqliteral", {
        cwd: dir,
      });
      await execAsync("rm -rf graphql", {
        cwd: path.join(dir, "node_modules"),
      });
      await execAsync("ln -s ../../node_modules/graphql ./graphql", {
        cwd: path.join(dir, "node_modules"),
      });
      console.log(`Finished linking ${exampleDir}`);
    })
  );
}

linkExamples()
  .then(() => {
    console.log("All examples using local gqliteral");
  })
  .catch((e) => {
    console.error(e);
  })
  .then(() => {
    process.exit();
  });

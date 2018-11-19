import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);
const allExamples = ["star-wars", "githunt-api", "apollo-fullstack"];

async function unlinkExamples() {
  await Promise.all(
    allExamples.map(async (exampleDir) => {
      const dir = path.join(__dirname, `../examples/${exampleDir}`);
      console.log(`Unliking ${exampleDir}`);
      await execAsync("rm -rf graphql", {
        cwd: path.join(dir, "node_modules"),
      });
      await execAsync("yarn unlink gqliteral", {
        cwd: dir,
      });
      await execAsync("yarn --force", {
        cwd: dir,
      });
      console.log(`Finished unlinking ${exampleDir}`);
    })
  );
}

unlinkExamples()
  .then(() => {
    console.log("All examples using published gqliteral");
  })
  .catch((e) => {
    console.error(e);
  })
  .then(() => {
    process.exit();
  });

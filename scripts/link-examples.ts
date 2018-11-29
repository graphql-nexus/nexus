/**
 * Links examples & website to local version of graphqliteral
 */
import { exec } from "child_process";
import util from "util";
import path from "path";

const execAsync = util.promisify(exec);
const allExamples = [
  "ts-ast-reader",
  "star-wars",
  "kitchen-sink",
  "githunt-api",
  "apollo-fullstack",
];

async function linkDir(dir: string, baseNodeModules: string) {
  await execAsync("yarn", {
    cwd: dir,
  });
  await execAsync("yarn link gqliteral", {
    cwd: dir,
  });
  await execAsync("rm -rf graphql", {
    cwd: path.join(dir, "node_modules"),
  });
  await execAsync(`ln -s ${baseNodeModules}  ./graphql`, {
    cwd: path.join(dir, "node_modules"),
  });
}

async function linkAll() {
  const root = path.join(__dirname, "..");
  const { stdout } = await execAsync("yarn link", {
    cwd: root,
  });
  console.log(stdout);
  await Promise.all(
    allExamples
      .map(async (exampleDir) => {
        const dir = path.join(__dirname, `../examples/${exampleDir}`);
        console.log(`Linking ${exampleDir}`);
        await linkDir(dir, "../../../node_modules/graphql");
        console.log(`Finished linking ${exampleDir}`);
      })
      .concat(
        (async () => {
          console.log("Linking website");
          await linkDir(
            path.join(__dirname, "../website"),
            "../../node_modules/graphql"
          );
          console.log("Finished linking website");
        })()
      )
  );
}

linkAll()
  .then(() => {
    console.log("All examples using local graphqliteral");
  })
  .catch((e) => {
    console.error(e);
  })
  .then(() => {
    process.exit();
  });

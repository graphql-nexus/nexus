import { exec } from "child_process";
import path from "path";
import util from "util";
import { allExamples } from "./constants";
import { name, version } from "../../package.json";

const execAsync = util.promisify(exec);

export async function upgradeDeps() {
  const root = path.join(__dirname, "../..");
  await Promise.all(
    allExamples
      .map(async (exampleDir) => {
        console.log(`Upgrading ${exampleDir}`);
        await execAsync(`yarn upgrade ${name}@${version}`, {
          cwd: path.join(root, `examples/${exampleDir}`),
        });
        await execAsync("yarn", {
          cwd: path.join(root, `examples/${exampleDir}`),
        });
        console.log(`Finished upgrading ${exampleDir}`);
      })
      .concat(
        (async () => {
          console.log("Upgrading website");
          await execAsync(`yarn upgrade ${name}@${version}`, {
            cwd: path.join(root, "website"),
          });
          await execAsync("yarn", {
            cwd: path.join(root, "website"),
          });
          console.log("Finished upgrading website");
        })()
      )
  );
}

import { execFile } from "child_process";
import * as fs from "fs";
import { dirname, join } from "path";
import util from "util";

const execAsync = util.promisify(execFile);

export async function publishAtNexusSchema() {
  const packageJsonPath = join(__dirname, "../../package.json");
  const { restore } = updatePackageJson(packageJsonPath);

  await execAsync("yarn", "publish --no-git-tag-version -f".split(" "), {
    cwd: dirname(packageJsonPath),
  });

  restore();
}

function updatePackageJson(path: string) {
  const originalPackageJson = fs.readFileSync(path).toString();
  const serialized = JSON.parse(originalPackageJson);

  serialized.name = "@nexus/schema";

  fs.writeFileSync(path, JSON.stringify(serialized, null, 2));

  return {
    restore() {
      fs.writeFileSync(path, originalPackageJson);
    },
  };
}

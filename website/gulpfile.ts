import gulp from "gulp";
import path from "path";
import fs from "fs-extra";
import { ChildProcess, spawn, SpawnOptions } from "child_process";

function requireFresh(pkg: string) {
  delete require.cache[require.resolve(pkg)];
  return require(pkg);
}

const serviceRegistry = new Map<string, ChildProcess>();

const runService = (
  command: string,
  args: string,
  opts: SpawnOptions = { stdio: "inherit" },
  shouldRestart = false
) => {
  const name = `${command} ${args}`;
  const proc = serviceRegistry.get(name);
  if (proc && shouldRestart) {
    console.log(`killing ${name}`);
    proc.kill();
  }
  if (shouldRestart || !proc) {
    serviceRegistry.set(name, spawn(command, args.split(" "), opts));
  }
};

gulp.task("api-types", [], async () => {
  const { run } = requireFresh("./api/types/types-to-json.ts");
  await run();
});

gulp.task("watch:api-types", ["core-tsc", "api-types"], () => {
  gulp.watch(
    [
      path.join(__dirname, "../dist/*.d.ts"),
      path.join(__dirname, "./api/types/*.ts"),
    ],
    ["api-types"]
  );
});

gulp.task("docusaurus", () => {
  runService("yarn", "docusaurus-start", { stdio: "ignore" }, true);
});
gulp.task("webpack", () => {
  runService("yarn", "webpack", { stdio: "ignore" });
});
gulp.task("api-tsc", () => {
  runService("yarn", "tsc -w -p api/tsconfig.json", { stdio: "ignore" });
});
gulp.task("core-tsc", () => {
  runService("yarn", "tsc -w -p tsconfig.json", {
    stdio: "ignore",
    cwd: path.join(__dirname, ".."),
  });
});

gulp.task(
  "start",
  ["docusaurus", "webpack", "watch:api-types", "api-tsc", "core-tsc"],
  () => {
    console.log("Server starting, please wait...");
    gulp.watch(path.join(__dirname, "siteConfig.js"), ["docusaurus"]);
  }
);

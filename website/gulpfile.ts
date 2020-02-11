import gulp from "gulp";
import path from "path";
import { ChildProcess, spawn, SpawnOptions } from "child_process";
import getPort from "get-port";
import http from "http";
import { linkExamples, linkWebsite, linkNexus } from "./scripts/link-examples";
import { unlinkExamples } from "./scripts/unlink-examples";
import { allExamples } from "./scripts/constants";
import { upgradeDeps } from "./scripts/upgrade-deps";
import { publishAtNexusSchema } from "./scripts/publish-nexus-schema";

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

gulp.task("webpack", () => {
  runService("yarn", "webpack", { stdio: "ignore" });
});

gulp.task("link-examples", async () => {
  await linkNexus();
  await linkExamples();
  console.log("All examples linked");
});

gulp.task("docusaurus", () => {
  runService("yarn", "docusaurus-start", { stdio: "inherit" }, true);
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
  gulp.series("docusaurus", "link-examples", "webpack", "core-tsc", () => {
    console.log("Server starting, please wait...");
    gulp.watch("./siteConfig.js", gulp.task("docusaurus"));
  })
);

gulp.task("run-examples", async () => {
  for (let i = 0; i < allExamples.length; i++) {
    const example = allExamples[i];
    let port: number;
    if (example === "ghost") {
      port = 3000;
    } else {
      port = await getPort({
        port: [4000, 4001, 4002, 4003, 4004, 4005, 4006],
      });
    }
    console.log(`Starting ${example} on port ${port}`);
    spawn("yarn", ["run", "start"], {
      env: {
        ...process.env,
        NODE_ENV: "development",
        PORT: `${port}`,
      },
      stdio: "inherit",
      cwd: path.join(__dirname, `../examples/${example}`),
    });
    let ready = false;
    while (!ready) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      ready = await new Promise<boolean>((resolve) => {
        http
          .get(`http://localhost:${port}/`, () => resolve(true))
          .on("error", () => resolve(false));
      });
    }
  }
});

gulp.task(
  "check-examples",
  gulp.series("link-examples", async () => {})
);

gulp.task("link-website", async () => {
  await linkNexus();
  await linkWebsite();
  console.log("Website linked");
});

gulp.task("unlink-examples", async () => {
  await unlinkExamples();
  console.log("All examples unlinked");
});

gulp.task("upgrade-deps", async () => {
  await upgradeDeps();
  console.log("All dependencies upgraded");
});

gulp.task("publish-nexus-schema", async () => {
  await publishAtNexusSchema();
  console.log("Published to @nexus/schema");
});

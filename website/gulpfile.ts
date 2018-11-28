import gulp from "gulp";
import path from "path";
import fs from "fs-extra";

function requireFresh(pkg: string) {
  delete require.cache[require.resolve(pkg)];
  return require(pkg);
}

gulp.task("api-types", async () => {
  const { run } = requireFresh("./api/types/types-to-json.ts");
  await run();
});

gulp.task("watch:api-types", ["api-types"], () => {
  gulp.watch(
    [
      path.join(__dirname, "../dist/*.d.ts"),
      path.join(__dirname, "./api/types/*.ts"),
    ],
    ["api-types"]
  );
});

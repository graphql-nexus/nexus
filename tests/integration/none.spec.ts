import ts from "typescript";
import { join } from "path";

it("can be compiled with no generated types present", () => {
  expect([join(__dirname, "./_app.ts")]).toTypeCheck({
    sourceMap: false,
    noEmitOnError: true,
    esModuleInterop: true,
    strict: true,
    target: ts.ScriptTarget.ES5,
    outDir: `/tmp/nexus-integration-test-${Date.now()}`,
    noErrorTruncation: false,
  });
});

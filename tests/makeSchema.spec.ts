import path from "path";
import os from "os";
import { queryField } from "../src/definitions/queryField";
import { makeSchema, makeSchemaInternal, generateSchema } from "../src/builder";
import { printSchema } from "graphql";

describe("makeSchema", () => {
  describe("shouldExitAfterGenerateArtifacts", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("exits with 0 code after successful write", (done) => {
      const logSpy = jest
        .spyOn(console, "log")
        .mockImplementationOnce(() => {});
      jest.spyOn(process, "exit").mockImplementationOnce((code) => {
        expect(code).toEqual(0);
        expect(logSpy.mock.calls[0][0]).toContain("Generated Artifacts:");
        return done() as never;
      });
      makeSchema({
        types: [
          queryField("someField", {
            type: "String",
            resolve: () => "Test",
          }),
        ],
        outputs: {
          typegen: path.join(os.tmpdir(), "/file.ts"),
          schema: path.join(os.tmpdir(), "/schema.graphql"),
        },
        shouldGenerateArtifacts: true,
        shouldExitAfterGenerateArtifacts: true,
      });
    });

    it("exits with 1 code and logs error after failure", (done) => {
      const errSpy = jest
        .spyOn(console, "error")
        .mockImplementationOnce(() => {});
      jest.spyOn(process, "exit").mockImplementationOnce((code) => {
        expect(code).toEqual(1);
        expect(errSpy.mock.calls[0][0].message).toEqual(
          `ENOTDIR: not a directory, open '/dev/null/schema.graphql'`
        );
        return done() as never;
      });
      makeSchema({
        types: [
          queryField("someField", {
            type: "String",
            resolve: () => "Test",
          }),
        ],
        outputs: {
          typegen: `/dev/null/file.ts`,
          schema: `/dev/null/schema.graphql`,
        },
        shouldGenerateArtifacts: true,
        shouldExitAfterGenerateArtifacts: true,
      });
    });

    it("accepts a customPrintSchemaFn", async () => {
      const { schemaTypes } = await generateSchema.withArtifacts(
        {
          types: [
            queryField("ok", {
              description: "Example boolean field",
              type: "Boolean",
            }),
          ],
          outputs: {},
          customPrintSchemaFn: (schema) => {
            return printSchema(schema, { commentDescriptions: true });
          },
        },
        false
      );
      expect(schemaTypes).toMatchSnapshot();
    });
  });
});

import ts from "typescript";
import { enumType } from "nexus";
import { convertTsEnum } from "./utils";

export const SyntaxKind = enumType({
  name: "SyntaxKind",
  members: convertTsEnum(ts.SyntaxKind),
});

export const NodeFlags = enumType({
  name: "NodeFlags",
  members: {
    ...convertTsEnum(ts.NodeFlags),
    UNKNOWN: 4194816,
  },
});

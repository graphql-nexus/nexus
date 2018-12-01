import ts from "typescript";
import { enumType } from "gqliteral";
import { convertTsEnum } from "./utils";

export const SyntaxKind = enumType("SyntaxKind", convertTsEnum(ts.SyntaxKind));

export const NodeFlags = enumType("NodeFlags", {
  ...convertTsEnum(ts.NodeFlags),
  UNKNOWN: 4194816,
});

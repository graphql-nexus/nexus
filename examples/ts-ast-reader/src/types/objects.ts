import { objectType } from "gqliteral";
import typescript from "typescript";
import { nodeType } from "./mixins";

export const UNKNOWN_NODE = objectType("UNKNOWN_NODE", (t) => {
  nodeType(t);
});

export const Token = objectType("Token", (t) => {
  t.field("kind", "SyntaxKind");
});

export const Identifier = objectType("Identifier", nodeType);

export const StringLiteral = objectType("StringLiteral", nodeType);

export const NumericLiteral = objectType("NumericLiteral", nodeType);

export const ComputedPropertyName = objectType(
  "ComputedPropertyName",
  nodeType
);

export const TypeReference = objectType("TypeReference", (t) => {
  nodeType(t);
  t.string("text", {
    nullable: true,
    resolve: (root) => root.typeName && root.typeName.text,
  });
  t.string("nameText", {
    nullable: true,
    resolve: (root) => root.typeName && root.typeName.escapedText,
  });
});

export const JSDoc = objectType("JSDoc", nodeType);

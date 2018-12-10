import { objectType } from "nexus";
import { nodeType } from "./mixins";

export const UNKNOWN_NODE = objectType("UNKNOWN_NODE", (t) => {
  nodeType(t);
});

export const Token = objectType("Token", (t) => {
  t.field("kind", "SyntaxKind");
});

export const UnnamedNode = objectType("UnnamedNode", (t) => {
  t.string("text", { nullable: true });
});

export const Identifier = objectType("Identifier", (t) => {
  nodeType(t);
  t.string("text");
});

export const StringLiteralLike = objectType("StringLiteralLike", nodeType);

export const BindingPattern = objectType("BindingPattern", nodeType);

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
    resolve: (root) => {
      return root.typeName && root.typeName.text;
    },
  });
  t.string("nameText", {
    nullable: true,
    resolve: (root) => {
      return root.typeName && root.typeName.escapedText;
    },
  });
  t.field("typeArguments", "Node", { list: true, nullable: true });
});

export const QualifiedName = objectType("QualifiedName", (t) => {
  nodeType(t);
});

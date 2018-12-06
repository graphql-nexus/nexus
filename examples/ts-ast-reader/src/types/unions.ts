import { unionType } from "graphql-nexus";
import ts from "typescript";

export const DeclarationName = unionType("DeclarationName", (t) => {
  t.members(
    "Identifier",
    "StringLiteralLike",
    "NumericLiteral",
    "ComputedPropertyName",
    "BindingPattern",
    "UnnamedNode",
    "QualifiedName"
  );
  t.resolveType((obj) => {
    if (obj.kind) {
      if (obj.kind === ts.SyntaxKind.FirstNode) {
        return "QualifiedName";
      }
      return ts.SyntaxKind[obj.kind];
    }
    return "UnnamedNode";
  });
});

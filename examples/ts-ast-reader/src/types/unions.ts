import { unionType } from "gqliteral";
import ts from "typescript";

export const PropertyName = unionType("PropertyName", (t) => {
  t.members(
    "Identifier",
    "StringLiteral",
    "NumericLiteral",
    "ComputedPropertyName"
  );
  t.resolveType((obj: any) => ts.SyntaxKind[obj.kind]);
});

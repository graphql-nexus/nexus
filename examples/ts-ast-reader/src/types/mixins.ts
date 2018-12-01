import { core } from "gqliteral";
import typescript from "typescript";
import { Gen } from "../ts-ast-reader-typegen";

export function withTypeArguments(t: core.ObjectTypeDef<Gen, any>) {
  t.field("typeArguments", "Node", { list: true, nullable: true });
}

export function namedType(t: core.ObjectTypeDef<Gen, any>) {
  t.string("nameText", {
    nullable: true,
    resolve: (root) => (root.name ? root.name.escapedText : null),
  });
}

export function signatureDeclarationBase(t: core.ObjectTypeDef<Gen, any>) {
  t.string("nameText", {
    nullable: true,
    resolve: (root) => (root.name ? String(root.name.escapedText) : null),
  });
  t.field("typeParameters", "TypeParameterDeclaration", {
    list: true,
    nullable: true,
  });
  t.field("parameters", "ParameterDeclaration", { list: true });
  t.field("type", "Node", { nullable: true });
}

export function hasJsDoc(t: core.ObjectTypeDef<Gen, any>) {}

export function functionLikeDeclaration(t: core.ObjectTypeDef<Gen, any>) {
  signatureDeclarationBase(t);
  t.field("asteriskToken", "Token", { nullable: true });
  t.field("questionToken", "Token", { nullable: true });
  t.field("exclamationToken", "Token", { nullable: true });
}

export function nodeType(t: core.ObjectTypeDef<Gen, any>) {
  t.implements("Node");
}

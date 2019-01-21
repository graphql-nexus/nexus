import { core } from "nexus";
import { Gen } from "../ts-ast-reader-typegen";

export function withTypeArguments(t: core.ObjectTypeDef<Gen, any>) {
  t.field("typeArguments", "Node", { list: true, nullable: true });
}

export function hasTypeParameters(t: core.ObjectTypeDef<Gen, any>) {
  t.field("typeParameters", "TypeParameterDeclaration", {
    list: true,
    nullable: true,
  });
}

export function signatureDeclarationBase(t: core.ObjectTypeDef<Gen, any>) {
  hasTypeParameters(t);
  t.string("nameText", {
    nullable: true,
    resolve: (root) => (root.name ? String(root.name.escapedText) : null),
  });
  t.field("parameters", "ParameterDeclaration", { list: true });
  t.field("type", "Node", { nullable: true });
}

export function functionLikeDeclaration(t: core.ObjectTypeDef<Gen, any>) {
  signatureDeclarationBase(t);
  t.implements("MaybeOptional");
  t.field("asteriskToken", "Token", { nullable: true });
  t.field("exclamationToken", "Token", { nullable: true });
}

export function nodeType(t: core.ObjectTypeDef<Gen, any>) {
  t.implements("Node");
}

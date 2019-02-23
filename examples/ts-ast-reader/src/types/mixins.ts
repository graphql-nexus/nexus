import { core } from "nexus";

export function withTypeArguments(t: core.OutputDefinitionBlock<any>) {
  t.list.field("typeArguments", { type: "Node", nullable: true });
}

export function hasTypeParameters(t: core.OutputDefinitionBlock<any>) {
  t.field("typeParameters", {
    type: "TypeParameterDeclaration",
    list: true,
    nullable: true,
  });
}

export function signatureDeclarationBase(t: core.OutputDefinitionBlock<any>) {
  hasTypeParameters(t);
  t.string("nameText", {
    nullable: true,
    resolve: (root) => (root.name ? String(root.name.escapedText) : null),
  });
  t.field("parameters", { type: "ParameterDeclaration", list: true });
  t.field("type", { type: "Node", nullable: true });
}

export function functionLikeDeclaration(t: core.ObjectDefinitionBlock<any>) {
  signatureDeclarationBase(t);
  t.implements("MaybeOptional");
  t.field("asteriskToken", { type: "Token", nullable: true });
  t.field("exclamationToken", { type: "Token", nullable: true });
}

export function nodeType(t: core.ObjectDefinitionBlock<any>) {
  t.implements("Node");
}

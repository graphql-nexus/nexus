import { Types } from "nexus";

export function withTypeArguments(t: Types.OutputDefinitionBlock<any>) {
  t.list.field("typeArguments", { type: "Node", nullable: true });
}

export function hasTypeParameters(t: Types.OutputDefinitionBlock<any>) {
  t.field("typeParameters", {
    type: "TypeParameterDeclaration",
    list: true,
    nullable: true,
  });
}

export function signatureDeclarationBase(t: Types.OutputDefinitionBlock<any>) {
  hasTypeParameters(t);
  t.string("nameText", {
    nullable: true,
    resolve: (root) => (root.name ? String(root.name.escapedText) : null),
  });
  t.field("parameters", { type: "ParameterDeclaration", list: true });
  t.field("type", { type: "Node", nullable: true });
}

export function functionLikeDeclaration(t: Types.ObjectDefinitionBlock<any>) {
  signatureDeclarationBase(t);
  t.implements("MaybeOptional");
  t.field("asteriskToken", { type: "Token", nullable: true });
  t.field("exclamationToken", { type: "Token", nullable: true });
}

export function nodeType(t: Types.ObjectDefinitionBlock<any>) {
  t.implements("Node");
}

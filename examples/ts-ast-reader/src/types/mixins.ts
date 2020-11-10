import { core, list, nullable } from '@nexus/schema'

export function withTypeArguments(t: core.OutputDefinitionBlock<any>) {
  t.list.field('typeArguments', { type: nullable('Node') })
}

export function hasTypeParameters(t: core.OutputDefinitionBlock<any>) {
  t.field('typeParameters', {
    type: nullable(list('TypeParameterDeclaration')),
  })
}

export function signatureDeclarationBase(t: core.OutputDefinitionBlock<any>) {
  hasTypeParameters(t)
  t.field('nameText', {
    type: nullable('String'),
    resolve: (root) => (root.name ? String(root.name.escapedText) : null),
  })
  t.field('parameters', { type: list('ParameterDeclaration') })
  t.field('type', { type: nullable('Node') })
}

export function functionLikeDeclaration(t: core.ObjectDefinitionBlock<any>) {
  signatureDeclarationBase(t)
  t.implements('MaybeOptional')
  t.field('asteriskToken', { type: nullable('Token') })
  t.field('exclamationToken', { type: nullable('Token') })
}

export function nodeType(t: core.ObjectDefinitionBlock<any>) {
  t.implements('Node')
}

import { objectType, arg, list, nullable } from 'nexus'
import { nodeType, functionLikeDeclaration, hasTypeParameters } from './mixins'
import { filteredNodesList } from './utils'

const nodeSkipSyntax = {
  skip: arg({ type: list('SyntaxKind') }),
  only: arg({ type: list('SyntaxKind') }),
}

export const ExportAssignment = objectType({
  name: 'ExportAssignment',
  definition(t) {
    nodeType(t)
  },
})

export const SourceFile = objectType({
  name: 'SourceFile',
  definition(t) {
    nodeType(t)
    t.list.field('statements', {
      type: 'Node',
      args: nodeSkipSyntax,
      resolve: (root, args) => filteredNodesList(args, Array.from(root.statements)),
    })
  },
})

export const TypeParameterDeclaration = objectType({
  name: 'TypeParameterDeclaration',
  definition(t) {
    nodeType(t)
    t.field('constraint', { type: 'Node' })
    t.field('default', { type: 'Node' })
    t.field('expression', { type: 'Node' })
  },
})

export const CallSignatureDeclaration = objectType({
  name: 'CallSignatureDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ConstructSignatureDeclaration = objectType({
  name: 'ConstructSignatureDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const VariableDeclaration = objectType({
  name: 'VariableDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ParameterDeclaration = objectType({
  name: 'ParameterDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    t.field('type', { type: 'Node' })
  },
})

export const PropertySignature = objectType({
  name: 'PropertySignature',
  definition(t) {
    t.implements('Node', 'HasJSDoc', 'MaybeOptional')
    t.field('type', { type: nullable('Node') })
  },
})

export const PropertyDeclaration = objectType({
  name: 'PropertyDeclaration',
  definition(t) {
    t.implements('Node', 'HasJSDoc', 'MaybeOptional')
  },
})

export const PropertyLikeDeclaration = objectType({
  name: 'PropertyLikeDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const FunctionDeclaration = objectType({
  name: 'FunctionDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    functionLikeDeclaration(t)
  },
})

export const MethodDeclaration = objectType({
  name: 'MethodDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    functionLikeDeclaration(t)
  },
})

export const ConstructorDeclaration = objectType({
  name: 'ConstructorDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    functionLikeDeclaration(t)
  },
})

export const GetAccessorDeclaration = objectType({
  name: 'GetAccessorDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    functionLikeDeclaration(t)
  },
})

export const SetAccessorDeclaration = objectType({
  name: 'SetAccessorDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    functionLikeDeclaration(t)
  },
})

export const IndexSignatureDeclaration = objectType({
  name: 'IndexSignatureDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
  },
})

export const MissingDeclaration = objectType({
  name: 'MissingDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ClassDeclaration = objectType({
  name: 'ClassDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    t.list.field('members', {
      type: 'Node',
      args: nodeSkipSyntax,
      resolve: (root, args) => filteredNodesList(args, Array.from(root.members)),
    })
  },
})

export const InterfaceDeclaration = objectType({
  name: 'InterfaceDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
  },
})

export const TypeAliasDeclaration = objectType({
  name: 'TypeAliasDeclaration',
  definition(t) {
    nodeType(t)
    hasTypeParameters(t)
    t.implements('HasJSDoc')
    t.field('type', { type: nullable('Node') })
  },
})

export const EnumDeclaration = objectType({
  name: 'EnumDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
    t.field('members', { type: list('Node') })
  },
})

export const ModuleDeclaration = objectType({
  name: 'ModuleDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
  },
})

export const NamespaceDeclaration = objectType({
  name: 'NamespaceDeclaration',
  definition(t) {
    nodeType(t)
    t.implements('HasJSDoc')
  },
})

export const JSDocNamespaceDeclaration = objectType({
  name: 'JSDocNamespaceDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ImportEqualsDeclaration = objectType({
  name: 'ImportEqualsDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ImportDeclaration = objectType({
  name: 'ImportDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const NamespaceExportDeclaration = objectType({
  name: 'NamespaceExportDeclaration',
  definition(t) {
    nodeType(t)
  },
})

export const ExportDeclaration = objectType({
  name: 'ExportDeclaration',
  definition(t) {
    nodeType(t)
  },
})

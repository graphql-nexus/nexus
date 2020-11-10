import { arg, interfaceType, list, nullable } from '@nexus/schema'
import { JSDoc, SyntaxKind } from 'typescript'
import { allKnownNodes, syntaxKindFilter } from './utils'

const syntaxKindArgs = {
  skip: arg({ type: list('SyntaxKind') }),
  only: arg({ type: list('SyntaxKind') }),
}

export const MaybeOptional = interfaceType({
  name: 'MaybeOptional',
  definition(t) {
    t.field('questionToken', { type: nullable('Token') })
    t.resolveType((o) => o.kind as any)
  },
})

export const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.int('pos')
    t.int('end')
    t.field('nameText', {
      type: nullable('String'),
      resolve: (root) =>
        // @ts-ignore
        root.name ? root.name.escapedText : null,
    })
    t.field('name', { type: nullable('DeclarationName') })
    t.field('typeName', { type: nullable('DeclarationName') })
    t.field('kind', { type: 'SyntaxKind' })
    t.int('kindCode', { resolve: (o) => o.kind })
    t.field('flags', { type: 'NodeFlags' })
    // t.field('decorators', 'Decorator', {list: true, nullable: true})
    t.field('modifiers', {
      type: nullable(list('Token')),
      args: syntaxKindArgs,
      async resolve(root, args) {
        if (!root.modifiers) {
          return null
        }
        return syntaxKindFilter(args, Array.from(root.modifiers))
      },
    })
    t.field('parent', { type: 'Node' })
    t.string('rawText', {
      args: syntaxKindArgs,
      resolve(root, args, ctx) {
        const filtered = syntaxKindFilter(args, [root])
        return filtered.length ? filtered[0].getText(ctx.source) : ''
      },
    })
    t.resolveType((node, ctx, info) => {
      if (KeywordKinds.has(node.kind)) {
        return 'KeywordTypeNode'
      }
      if (allKnownNodes(info.schema).has(SyntaxKind[node.kind])) {
        return SyntaxKind[node.kind] as any
      }
      return 'UNKNOWN_NODE'
    })
  },
})

export const JSDocInterface = interfaceType({
  name: 'HasJSDoc',
  definition(t) {
    t.field('jsDoc', {
      type: nullable(list('JSDoc')),
      resolve(root) {
        if ('jsDoc' in root) {
          // https://github.com/Microsoft/TypeScript/issues/19856
          return ((root as unknown) as { jsDoc: JSDoc[] }).jsDoc
        }
        return null
      },
    })
    t.resolveType((node, ctx, info) => {
      if (allKnownNodes(info.schema).has(SyntaxKind[node.kind])) {
        return SyntaxKind[node.kind] as any
      }
      return 'UNKNOWN_NODE'
    })
  },
})

const KeywordKinds = new Set([
  SyntaxKind.AnyKeyword,
  SyntaxKind.UnknownKeyword,
  SyntaxKind.NumberKeyword,
  SyntaxKind.BigIntKeyword,
  SyntaxKind.ObjectKeyword,
  SyntaxKind.BooleanKeyword,
  SyntaxKind.StringKeyword,
  SyntaxKind.SymbolKeyword,
  SyntaxKind.ThisKeyword,
  SyntaxKind.VoidKeyword,
  SyntaxKind.UndefinedKeyword,
  SyntaxKind.NullKeyword,
  SyntaxKind.NeverKeyword,
])

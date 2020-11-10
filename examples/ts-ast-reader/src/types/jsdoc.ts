import { interfaceType, objectType, blocks, nullable } from '@nexus/schema'
import ts from 'typescript'

export const JSDoc = objectType({
  name: 'JSDoc',
  definition: (t) => {
    t.field('comment', { type: nullable('String') })
    t.list.field('tags', { type: nullable('JSDocTag') })
  },
})

export const JSDocTag = interfaceType({
  name: 'JSDocTag',
  definition(t) {
    t.field('tagName', {
      type: nullable('String'),
      resolve: (root) => `${root.tagName.escapedText}`,
    })
    t.field('comment', { type: nullable('String') })
    t.resolveType((tag, ctx, info) => {
      if (info.schema.getType(ts.SyntaxKind[tag.kind])) {
        return ts.SyntaxKind[tag.kind] as any
      }
      return 'JSDocUnknownTag'
    })
  },
})

const jsDocTag = (t: blocks.ObjectDefinitionBlock<any>) => t.implements('JSDocTag')

export const JSDocUnknownTag = objectType({
  name: 'JSDocUnknownTag',
  definition: jsDocTag,
})
export const JSDocAugmentsTag = objectType({
  name: 'JSDocAugmentsTag',
  definition: jsDocTag,
})
export const JSDocClassTag = objectType({
  name: 'JSDocClassTag',
  definition: jsDocTag,
})
export const JSDocEnumTag = objectType({
  name: 'JSDocEnumTag',
  definition: jsDocTag,
})
export const JSDocThisTag = objectType({
  name: 'JSDocThisTag',
  definition: jsDocTag,
})
export const JSDocTemplateTag = objectType({
  name: 'JSDocTemplateTag',
  definition: jsDocTag,
})
export const JSDocReturnTag = objectType({
  name: 'JSDocReturnTag',
  definition: jsDocTag,
})
export const JSDocTypeTag = objectType({
  name: 'JSDocTypeTag',
  definition: jsDocTag,
})

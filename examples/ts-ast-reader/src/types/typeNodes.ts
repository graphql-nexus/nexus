import { objectType } from 'nexus'
import { nodeType } from './mixins'

export const KeywordTypeNode = objectType({
  name: 'KeywordTypeNode',
  definition(t) {
    nodeType(t)
  },
})

export const ImportTypeNode = objectType({
  name: 'ImportTypeNode',
  definition(t) {
    nodeType(t)
  },
})

export const ThisTypeNode = objectType({
  name: 'ThisTypeNode',
  definition(t) {
    nodeType(t)
  },
})

export const FunctionTypeNode = objectType({
  name: 'FunctionTypeNode',
  definition(t) {
    nodeType(t)
    t.field('type', { type: 'Node' })
  },
})

export const ConstructorTypeNode = objectType({
  name: 'ConstructorTypeNode',
  definition(t) {
    nodeType(t)
    t.field('type', { type: 'Node' })
  },
})

export const ArrayTypeNode = objectType({
  name: 'ArrayTypeNode',
  definition(t) {
    nodeType(t)
    t.field('elementType', { type: 'Node' })
  },
})

export const TupleTypeNode = objectType({
  name: 'TupleTypeNode',
  definition(t) {
    nodeType(t)
    t.list.field('elements', { type: 'Node' })
  },
})

export const OptionalTypeNode = objectType({
  name: 'OptionalTypeNode',
  definition(t) {
    nodeType(t)
    t.field('type', { type: 'Node' })
  },
})

export const RestTypeNode = objectType({
  name: 'RestTypeNode',
  definition(t) {
    nodeType(t)
    t.field('type', { type: 'Node' })
  },
})

export const UnionType = objectType({
  name: 'UnionType',
  definition(t) {
    nodeType(t)
    t.list.field('types', { type: 'Node' })
  },
})

export const IntersectionTypeNode = objectType({
  name: 'IntersectionTypeNode',
  definition(t) {
    nodeType(t)
    t.list.field('types', { type: 'Node' })
  },
})

export const ConditionalTypeNode = objectType({
  name: 'ConditionalTypeNode',
  definition(t) {
    nodeType(t)
    t.field('checkType', { type: 'Node' })
    t.field('extendsType', { type: 'Node' })
    t.field('trueType', { type: 'Node' })
    t.field('falseType', { type: 'Node' })
  },
})

export const InferTypeNode = objectType({
  name: 'InferTypeNode',
  definition(t) {
    nodeType(t)
    t.field('typeParameter', { type: 'Node' })
  },
})

export const ParenthesizedType = objectType({
  name: 'ParenthesizedType',
  definition(t) {
    nodeType(t)
    t.field('type', { type: 'Node' })
  },
})

export const IndexedAccessTypeNode = objectType({
  name: 'IndexedAccessTypeNode',

  definition(t) {
    nodeType(t)
  },
})

export const MappedTypeNode = objectType({
  name: 'MappedTypeNode',
  definition(t) {
    nodeType(t)
  },
})

export const LiteralType = objectType({
  name: 'LiteralType',
  definition(t) {
    nodeType(t)
  },
})

export const TypeLiteral = objectType({
  name: 'TypeLiteral',
  definition(t) {
    nodeType(t)
  },
})

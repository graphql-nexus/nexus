import { GraphQLSchema, isObjectType, GraphQLResolveInfo } from 'graphql'
import ts from 'typescript'
import { NexusGenArgTypes } from '../ts-ast-reader-typegen'

export function convertTsEnum(toConvert: any) {
  const converted: { [key: string]: number } = {}
  Object.keys(toConvert).forEach((key) => {
    if (/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key)) {
      converted[key] = toConvert[key]
    }
  })
  return converted
}

const knownNodesMap = new WeakMap<GraphQLSchema, Set<string>>()

export function allKnownNodes(schema: GraphQLSchema) {
  let knownNodes = knownNodesMap.get(schema)
  if (!knownNodes) {
    const fields = schema.getTypeMap()
    knownNodes = new Set()
    Object.keys(fields).forEach((key) => {
      const field = fields[key]
      if (isObjectType(field) && Boolean(field.getInterfaces().find((i) => i.name === 'Node'))) {
        knownNodes!.add(field.name)
      }
    })
    knownNodesMap.set(schema, knownNodes)
  }
  return knownNodes!
}

export const filteredNodesList = <T extends ts.Node>(
  args: NexusGenArgTypes['SourceFile']['statements'],
  nodes: T[]
): T[] => {
  const { skip, only } = args
  if ((skip && skip.length) || (only && only.length)) {
    return nodes.filter((node: ts.Node) => {
      if (skip && skip.length > 0 && skip.indexOf(node.kind) !== -1) {
        return
      }
      if (only && only.length > 0 && only.indexOf(node.kind) === -1) {
        return
      }
      return node
    })
  }
  return nodes
}

export const syntaxKindFilter = <T extends { kind: ts.SyntaxKind }>(
  args: NexusGenArgTypes['Node']['modifiers'],
  items: T[]
) => {
  const { skip, only } = args
  if ((only && only.length) || (skip && skip.length)) {
    return items.filter((item) => {
      if (only && only.length && only.indexOf(item.kind) === -1) {
        return null
      }
      if (skip && skip.length && skip.indexOf(item.kind) !== -1) {
        return null
      }
      return item
    })
  }
  return items
}

import ts from 'typescript'
import { unionType } from 'nexus'
import { NexusGenAbstractTypeMembers } from '../ts-ast-reader-typegen'

export const DeclarationName = unionType({
  name: 'DeclarationName',
  resolveType(obj) {
    if ('kind' in obj) {
      if ((obj.kind as unknown) === ts.SyntaxKind.FirstNode) {
        return 'QualifiedName'
      }
      return ts.SyntaxKind[obj.kind] as NexusGenAbstractTypeMembers['DeclarationName']
    }
    return 'UnnamedNode'
  },
  definition(t) {
    t.members(
      'Identifier',
      'StringLiteralLike',
      'NumericLiteral',
      'ComputedPropertyName',
      'BindingPattern',
      'UnnamedNode',
      'QualifiedName'
      // ComputedPropertyName
    )
  },
})

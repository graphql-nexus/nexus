import ts from 'typescript'
import { unionType } from '@nexus/schema'
import { NexusGenAbstractTypesMapResolveTypeMethodReturnType } from '../ts-ast-reader-typegen'

export const DeclarationName = unionType({
  name: 'DeclarationName',
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
    t.resolveType((obj) => {
      if ('kind' in obj) {
        if ((obj.kind as unknown) === ts.SyntaxKind.FirstNode) {
          return 'QualifiedName'
        }
        return ts.SyntaxKind[
          obj.kind
        ] as NexusGenAbstractTypesMapResolveTypeMethodReturnType['DeclarationName']
      }
      return 'UnnamedNode'
    })
  },
})

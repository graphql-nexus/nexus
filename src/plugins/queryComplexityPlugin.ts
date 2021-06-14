import type { GraphQLField } from 'graphql'
import type { ArgsValue, GetGen, SourceValue } from '../core'
import { plugin } from '../plugin'
import { printedGenTyping, printedGenTypingImport } from '../utils'

const QueryComplexityImport = printedGenTypingImport({
  module: 'nexus/dist/plugins/queryComplexityPlugin',
  bindings: ['QueryComplexity'],
})

const fieldDefTypes = printedGenTyping({
  optional: true,
  name: 'complexity',
  description: `
    The complexity for an individual field. Return a number
    or a function that returns a number to specify the
    complexity for this field.
  `,
  type: 'QueryComplexity<TypeName, FieldName>',
  imports: [QueryComplexityImport],
})

export type QueryComplexityEstimatorArgs<TypeName extends string, FieldName extends string> = {
  type: SourceValue<TypeName>
  field: GraphQLField<SourceValue<TypeName>, GetGen<'context'>, ArgsValue<TypeName, FieldName>>
  args: ArgsValue<TypeName, FieldName>
  childComplexity: number
}

export type QueryComplexityEstimator<TypeName extends string, FieldName extends string> = (
  options: QueryComplexityEstimatorArgs<TypeName, FieldName>
) => number | void

export type QueryComplexity<TypeName extends string, FieldName extends string> =
  | number
  | QueryComplexityEstimator<TypeName, FieldName>

export const queryComplexityPlugin = () => {
  return plugin({
    name: 'query-complexity',
    description: `
      The query complexity plugin allows defining field-level complexity values that
      works with the graphql-query-complexity library.
    `,
    fieldDefTypes,
    onCreateFieldResolver(config) {
      // Look for complexity property defined in the nexus config
      const complexity = config.fieldConfig.extensions?.nexus?.config.complexity
      // Skip if field doesn't have complexity property
      if (complexity == null) {
        return
      }
      // If the complexity is not a number or a function that returns a number, provide a warning
      if (typeof complexity !== 'number' && typeof complexity !== 'function') {
        const parentName = config.parentTypeConfig.name
        const fieldName = config.fieldConfig.extensions?.nexus?.config.name
        console.error(
          new Error(
            `The complexity property provided to ${parentName}.${fieldName} should be a number or a function that returns a number, saw ${typeof complexity}`
          )
        )
        return
      }
      // Mutate the field config's extensions property with new complexity field.
      // graphql-query-complexity will look for this property to estimate complexity
      config.fieldConfig.extensions = {
        ...config.fieldConfig.extensions,
        complexity,
      } as any

      return undefined
    },
  })
}

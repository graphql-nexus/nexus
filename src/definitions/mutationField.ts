import type { FieldOutConfig, OutputDefinitionBlock } from '../core'
import { extendType, NexusExtendTypeDef } from './extendType'

export type MutationFieldConfig<FieldName extends string> =
  | FieldOutConfig<'Mutation', FieldName>
  | (() => FieldOutConfig<'Mutation', FieldName>)

/**
 * [API Docs](https://nexusjs.org/docs/api/mutation-field) | [2018 GraphQL
 * Spec](https://spec.graphql.org/June2018/#sec-Mutation)
 *
 * Define one or more fields on the Mutation type.
 *
 * Use this if you are going to modularize your schema and thus be wanting to contribute fields to Mutation
 * type from multiple modules. You do not have to have previously defined a Mutation type before using this.
 * If you haven't Nexus will create one automatically for you.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Mutation' })`
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // User.ts
 *   // Overload 1: Type Builder
 *
 *   mutationField((t) => {
 *     t.field('signup', {
 *       type: 'User',
 *       args: {
 *         email: stringArg(),
 *       },
 *       // ...
 *     })
 *     t.field('deactivate', {
 *       type: 'User',
 *       args: {
 *         userId: idArg(),
 *       },
 *       // ...
 *     })
 *   })
 *
 * @example
 *   // User.ts
 *   // Overload 2: Field Name/Config
 *
 *   mutationField('signup', {
 *     type: 'User',
 *     args: {
 *       email: stringArg(),
 *     },
 *     // ...
 *   })
 *
 * @param typeBuilder The same as the "definition" method you define on object type configurations.
 */
export function mutationField(
  typeBuilder: (t: OutputDefinitionBlock<'Mutation'>) => void
): NexusExtendTypeDef<'Mutation'>

/**
 * [API Docs](https://nexusjs.org/docs/api/mutation-field) | [2018 GraphQL
 * Spec](https://spec.graphql.org/June2018/#sec-Mutation)
 *
 * Define one or more fields on the mutation type.
 *
 * The Mutation type is one of three [root types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types)
 * in GraphQL and its fields represent API operations your clients can run that may have side-effects.
 *
 * Use this instead of mutationType if you are going to modularize your schema and thus be wanting to
 * contribute fields to Mutation type from multiple modules. You do not have to have previously defined a
 * Mutation type before using this. If you haven't Nexus will create one automatically for you.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Mutation' })`
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // User.ts
 *   // Overload 1: Type Builder
 *
 *   mutationField((t) => {
 *     t.field('signup', {
 *       type: 'User',
 *       args: {
 *         email: stringArg(),
 *       },
 *       // ...
 *     })
 *     t.field('deactivate', {
 *       type: 'User',
 *       args: {
 *         userId: idArg(),
 *       },
 *       // ...
 *     })
 *   })
 *
 * @example
 *   // User.ts
 *   // Overload 2: Field Name/Config
 *
 *   mutationField('signup', {
 *     type: 'User',
 *     args: {
 *       email: stringArg(),
 *     },
 *     // ...
 *   })
 *
 * @param name The name of the field on the Mutation type. Names are case‐sensitive and must conform to
 *   pattern: `[_A-Za-z][_0-9A-Za-z]*`
 * @param config The same type of configuration you would pass to t.field("...", config)
 */
export function mutationField<FieldName extends string>(
  name: FieldName,
  config: MutationFieldConfig<FieldName>
): NexusExtendTypeDef<'Mutation'>

export function mutationField(...args: any[]) {
  return extendType({
    type: 'Mutation',
    definition(t) {
      if (typeof args[0] === 'function') {
        return args[0](t)
      }
      const [fieldName, config] = args as [string, MutationFieldConfig<any>]
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig)
    },
  })
}

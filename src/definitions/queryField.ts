import type { FieldOutConfig, OutputDefinitionBlock } from './definitionBlocks'
import { extendType, NexusExtendTypeDef } from './extendType'

export type QueryFieldConfig<FieldName extends string> =
  | FieldOutConfig<'Query', FieldName>
  | (() => FieldOutConfig<'Query', FieldName>)

/**
 * [API Docs](https://nexusjs.org/docs/api/query-field) | [2018 GraphQL
 * Spec](https://spec.graphql.org/June2018/#sec-Query)
 *
 * Define one or more fields on the Query type.
 *
 * The Query type is one of three [root types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types) in
 * GraphQL and its fields represent API operations your clients can run that must not have side-effects.
 *
 * Use this instead of queryType if you are going to modularize your schema and thus be wanting to contribute
 * fields to Query type from multiple modules. You do not have to have previously defined a Query type before
 * using this. If you haven't Nexus will create one automatically for you.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Query' })`
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // User.ts
 *   // Overload 1: Type Builder
 *
 *   queryField((t) => {
 *     t.field('user', {
 *       type: 'User',
 *       args: {
 *         id: idArg(),
 *       },
 *       // ...
 *     })
 *   })
 *
 * @example
 *   // User.ts
 *   // Overload 2: Field Name/Config
 *
 *   queryField('user', {
 *     type: 'User',
 *     args: {
 *       id: idArg(),
 *     },
 *     // ...
 *   })
 *
 * @param typeBuilder The same as the "definition" method you define on object type configurations.
 */
export function queryField(
  typeBuilder: (t: OutputDefinitionBlock<'Query'>) => void
): NexusExtendTypeDef<'Query'>

/**
 * [API Docs](https://nexusjs.org/docs/api/query-field) | [2018 GraphQL
 * Spec](https://spec.graphql.org/June2018/#sec-Query)
 *
 * Define one or more fields on the Query type.
 *
 * Use this if you are going to modularize your schema and thus be wanting to contribute fields to Query type
 * from multiple modules. You do not have to have previously defined a Query type before using this. If you
 * haven't Nexus will create one automatically for you.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Query' })`
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // User.ts
 *   // Overload 1: Type Builder
 *
 *   queryField((t) => {
 *     t.field('user', {
 *       type: 'User',
 *       args: {
 *         id: idArg(),
 *       },
 *       // ...
 *     })
 *   })
 *
 * @example
 *   // User.ts
 *   // Overload 2: Field Name/Config
 *
 *   queryField('user', {
 *     type: 'User',
 *     args: {
 *       id: idArg(),
 *     },
 *     // ...
 *   })
 *
 * @param name The name of the field on the Query type. Names are case‐sensitive and must conform to pattern:
 *     `[_A-Za-z][_0-9A-Za-z]*`
 * @param config The same type of configuration you would pass to t.field("...", config)
 */
export function queryField<FieldName extends string>(
  name: FieldName,
  config: QueryFieldConfig<FieldName>
): NexusExtendTypeDef<'Query'>

export function queryField(...args: any[]) {
  return extendType({
    type: 'Query',
    definition(t) {
      if (typeof args[0] === 'function') {
        return args[0](t)
      }

      const [fieldName, config] = args as [string, QueryFieldConfig<any>]
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig)
    },
  })
}

import { NexusObjectTypeConfig, objectType } from './objectType'

/**
 * [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Mutation)
 *
 * Define a Mutation type.
 *
 * The Mutation type is one of three [root types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types)
 * in GraphQL and its fields represent API operations your clients can run that may have side-effects.
 *
 * You can only have one of these in your schema. If you are going to modularize your schema and thus be
 * wanting to contribute fields to Mutation type from multiple modules then use
 * [mutationField](https://nxs.li/docs/api/mutation-field) intead.
 *
 * This is a shorthand for:
 *
 * `objectType({ name: 'Mutation' })`
 *
 * @example
 *   mutationType({
 *     definition(t) {
 *       t.field('signup', {
 *         type: 'User',
 *         args: {
 *           email: stringArg(),
 *         },
 *         // ...
 *       })
 *       t.field('buy', {
 *         type: 'Recipet',
 *         args: {
 *           productId: idArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Specify your Mutation type's fields, description, and more. See each config property's jsDoc
 *   for more detail.
 */
export function mutationType(config: Omit<NexusObjectTypeConfig<'Mutation'>, 'name'>) {
  return objectType({ ...config, name: 'Mutation' })
}

import { assertValidName } from 'graphql'
import type { AllOutputTypesPossible } from '../typegenTypeHelpers'
import type { ObjectDefinitionBlock } from './objectType'
import type { IsSubscriptionType, SubscriptionBuilder } from './subscriptionType'
import { NexusTypes, withNexusSymbol } from './_types'

export interface NexusExtendTypeConfig<TypeName extends string> {
  /**
   * The name of the type you want to extend.
   *
   * Nexus types this as all the object types in your schema but you can add new types here as well and Nexus
   * will create them for you. Note that this will appear to be a static type error until the next Nexus
   * reflection run.
   *
   * @example
   *   'Query'
   */
  type: TypeName
  /**
   * Define the fields you want to extend the type with. This method works almost exactly like the objectType
   * "definition" method.
   *
   * @param t The type builder. Usually the same as that passed to objectType "definition" method except if
   *   extending the Subscription type in which case you get a subscription type builder (which differs
   *   slightly in that it requires implementation of a "subscribe" method on field configurations).
   */
  definition(
    t: IsSubscriptionType<TypeName> extends true ? SubscriptionBuilder : ObjectDefinitionBlock<TypeName>
  ): void
}

export class NexusExtendTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusExtendTypeConfig<TypeName> & { name: TypeName }
  ) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusExtendTypeDef, NexusTypes.ExtendObject)

/**
 * [API Docs](https://nxs.li/docs/api/extend-type)
 *
 * Add new fields to an existing objectType.
 *
 * This is useful when splitting your schema's type definitions across modules wherein each module is
 * concerned with its own domain (User, Post, Comment, etc.). You may discover that some types are shared
 * across domains and you want to co-locate the definition of the field contributions to where the domains
 * they relate to are.
 *
 * A classic example is contributing fields to root types Query, Mutation, or Subscription. Note that this
 * use-case is so common Nexus ships dedicated functions for it: queryField, mutationField, subscriptionField.
 *
 * You can extend types before defining them strictly with objectType or the root field functions (queryType
 * etc.). The typing for "type" property will appear to suggest that you cannot, however once Nexus reflection
 * has run you'll see that the type you "extended" exists in the schema and that your static typing error has
 * been resolved. This behaviour is a convenience especially when extending root types which you might never
 * define in your schema directly.
 *
 * @example
 *   // types/User.ts
 *
 *   export const User = objectType({
 *     name: 'User',
 *     // ...
 *   })
 *
 *   // Remember: It does not matter if you have
 *   // used queryType(...) elsewhere or not.
 *
 *   export const UserQuery = extendType({
 *     type: 'Query',
 *     definition(t) {
 *       t.list.nonNull.field('users', {
 *         type: 'User',
 *         resolve() {
 *           return // ...
 *         },
 *       })
 *     },
 *   })
 *
 * @param config The specification of which type to extend and how. This is basically a subset of the
 *   configuration object passed to the objectType function.
 */
export function extendType<TypeName extends AllOutputTypesPossible>(config: NexusExtendTypeConfig<TypeName>) {
  return new NexusExtendTypeDef(config.type, { ...config, name: config.type }) as NexusExtendTypeDef<any>
}

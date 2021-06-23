import type { GraphQLResolveInfo } from 'graphql'
import type { ArgsValue, GetGen, MaybePromise, MaybePromiseDeep, ResultValue } from '../typegenTypeHelpers'
import type { IsEqual } from '../typeHelpersInternal'
import type { CommonOutputFieldConfig } from './definitionBlocks'
import { objectType } from './objectType'
import type { AllNexusOutputTypeDefs } from './wrapping'

export type IsSubscriptionType<T> = IsEqual<T, 'Subscription'>

export interface SubscriptionTypeConfigBase<FieldName extends string, Event = any> {
  resolve(
    root: Event,
    args: ArgsValue<'Subscription', FieldName>,
    context: GetGen<'context'>,
    info: GraphQLResolveInfo
  ):
    | MaybePromise<ResultValue<'Subscription', FieldName>>
    | MaybePromiseDeep<ResultValue<'Subscription', FieldName>>
  subscribe(
    root: object,
    args: ArgsValue<'Subscription', FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<Event>> | MaybePromiseDeep<AsyncIterator<Event>>
}

// prettier-ignore
export type SubscriptionScalarConfig<FieldName extends string, Event> =
    CommonOutputFieldConfig<'Subscription', FieldName>
  & SubscriptionTypeConfigBase<FieldName, Event>

// prettier-ignore
export interface SubscriptionTypeConfig<FieldName extends string, Event> extends SubscriptionScalarConfig<FieldName, Event> {
  type: GetGen<'allOutputTypes'> | AllNexusOutputTypeDefs
}

// prettier-ignore
export interface SubscriptionTypeConfigWithName<FieldName extends string, Event> extends SubscriptionTypeConfig<FieldName, Event> {
  /**
   * The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   */  
  name: FieldName
}

// prettier-ignore
export interface SubscriptionBuilder {
  list: SubscriptionBuilder
  nonNull: Omit<SubscriptionBuilder, 'nonNull' | 'nullable'>
  nullable: Omit<SubscriptionBuilder, 'nonNull' | 'nullable'>
  string<FieldName extends string, Event>(fieldName: FieldName, config: SubscriptionScalarConfig<FieldName, Event>): void
  int<FieldName extends string, Event>(fieldName: FieldName, config: SubscriptionScalarConfig<FieldName, Event>): void
  boolean<FieldName extends string, Event>(fieldName: FieldName, opts: SubscriptionScalarConfig<FieldName, Event>): void
  id<FieldName extends string, Event>(fieldName: FieldName, config: SubscriptionScalarConfig<FieldName, Event>): void
  float<FieldName extends string, Event>(fieldName: FieldName, config: SubscriptionScalarConfig<FieldName, Event>): void
  field<FieldName extends string, Event>(config: SubscriptionTypeConfigWithName<FieldName, Event>): void
  field<FieldName extends string, Event>(name: FieldName, config: SubscriptionTypeConfig<FieldName, Event>): void
}

export type SubscriptionTypeParams = {
  definition(t: SubscriptionBuilder): void
}

/**
 * [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Subscription)
 *
 * Define a Subscription type.
 *
 * This is a shorthand for:
 *
 * `objectType({ name: 'Subscription' })`
 *
 * The Subscription type is one of three [root
 * types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types) in GraphQL and its fields represent API
 * operations your clients can run to be pushed data changes over time.
 *
 * You can only have one of these in your schema. If you are going to modularize your schema and thus be
 * wanting to contribute fields to the Subscription type from multiple modules then use
 * [queryField](https://nxs.li/docs/api/subscription-field) intead.
 *
 * Note that the main difference about Subscription type from other object types is that its field
 * configurations require a special "subscribe" method where you can return an asynchronous iterator. Promises
 * yielded by that iterator become available to the resolver in its first param, the source data.
 *
 * @example
 *   // Contrived but simple self-contained example
 *
 *   subscriptionType({
 *     definition(t) {
 *       t.boolean('truths', {
 *         subscribe() {
 *           async function* createTruthsStream() {
 *             while (true) {
 *               await new Promise((res) => setTimeout(res, 1000))
 *               yield Math.random() > 0.5
 *             }
 *           }
 *           return createTruthsStream()
 *         },
 *         resolve(truthPromise) {
 *           return truthPromise
 *         },
 *       })
 *     },
 *   })
 *
 * @example
 *   // A slightly less contrived example
 *   // See the full working example at
 *   // https://nxs.li/examples/subscriptions
 *
 *   import { PubSub } from 'apollo-server-express'
 *   import { makeSchema, mutationType, objectType, stringArg, subscriptionType } from '_AT_nexus/schema'
 *   import * as path from 'path'
 *
 *   export const pubsub = new PubSub()
 *
 *   type User = {
 *     email: string
 *   }
 *
 *   type Event<T> = {
 *     data: T
 *   }
 *
 *   export const schema = makeSchema({
 *     types: [
 *       subscriptionType({
 *         definition(t) {
 *           t.field('signup', {
 *             type: 'User',
 *             subscribe() {
 *               return pubsub.asyncIterator('signup')
 *             },
 *             async resolve(eventPromise: Promise<Event<User>>) {
 *               const event = await eventPromise
 *               return event.data
 *             },
 *           })
 *         },
 *       }),
 *
 *       mutationType({
 *         definition(t) {
 *           t.field('signup', {
 *             type: 'User',
 *             args: {
 *               email: stringArg(),
 *             },
 *             async resolve(_, args) {
 *               const newUser = {
 *                 email: args.email,
 *               }
 *               // ...
 *               await pubsub.publish('signup', {
 *                 data: newUser,
 *               })
 *               return newUser
 *             },
 *           })
 *         },
 *       }),
 *
 *       objectType({
 *         name: 'User',
 *         definition(t) {
 *           t.string('email')
 *         },
 *       }),
 *     ],
 *     typegenAutoConfig: {
 *       sources: [{ source: __filename, alias: 'SourceTypes' }],
 *     },
 *   })
 *
 * @param config Specify your Subscription type's fields, description, and more. See each config property's
 *   jsDoc for more detail.
 */
export function subscriptionType(config: SubscriptionTypeParams) {
  return objectType({ ...config, name: 'Subscription' } as any)
}

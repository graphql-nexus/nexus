import { extendType, NexusExtendTypeDef } from './extendType'
import type { SubscriptionBuilder, SubscriptionTypeConfig } from './subscriptionType'

export type SubscriptionFieldConfig<FieldName extends string, Event> =
  | SubscriptionTypeConfig<FieldName, Event>
  | (() => SubscriptionTypeConfig<FieldName, Event>)

/**
 * [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Subscription)
 *
 * Define one or more fields on the Subscription type.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Subscription' })`
 *
 * The Subscription type is one of three [root
 * types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types) in GraphQL and its fields represent API
 * operations your clients can run to be pushed data changes over time.
 *
 * Use this instead of subscriptionType if you are going to modularize your schema and thus be wanting to
 * contribute fields to the Subscription type from multiple modules. You do not have to have previously
 * defined a Query type before using this. If you haven't Nexus will create one automatically for you.
 *
 * Note that the main difference about Subscription type from other object types is that its field
 * configurations require a special "subscribe" method where you can return an asynchronous iterator. Promises
 * yielded by that iterator become available to the resolver in its first param, the source data.
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // Contrived but simple self-contained example
 *
 *   subscriptionField((t) => {
 *     t.boolean('truths', {
 *       subscribe() {
 *         async function* createTruthsStream() {
 *           while (true) {
 *             await new Promise((res) => setTimeout(res, 1000))
 *             yield Math.random() > 0.5
 *           }
 *         }
 *         return createTruthsStream()
 *       },
 *       resolve(truthPromise) {
 *         return truthPromise
 *       },
 *     })
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
 *   makeSchema({
 *     types: [
 *       subscriptionField('signup', {
 *         type: 'User',
 *         subscribe() {
 *           return pubsub.asyncIterator('signup')
 *         },
 *         async resolve(eventPromise: Promise<Event<User>>) {
 *           const event = await eventPromise
 *           return event.data
 *         },
 *       }),
 *
 *       mutationField('signup', {
 *         type: 'User',
 *         args: {
 *           email: stringArg(),
 *         },
 *         async resolve(_, args) {
 *           const newUser = {
 *             email: args.email,
 *           }
 *           // ...
 *           await pubsub.publish('signup', {
 *             data: newUser,
 *           })
 *           return newUser
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
 * @param typeBuilder The same as the "definition" method you define on object type configurations.
 */
export function subscriptionField(
  typeBuilder: (t: SubscriptionBuilder) => void
): NexusExtendTypeDef<'Subscription'>

/**
 * [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Subscription)
 *
 * Define one or more fields on the Subscription type.
 *
 * This is shorthand for:
 *
 * `extendType({ type: 'Subscription' })`
 *
 * The Subscription type is one of three [root
 * types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types) in GraphQL and its fields represent API
 * operations your clients can run to be pushed data changes over time.
 *
 * Use this instead of subscriptionType if you are going to modularize your schema and thus be wanting to
 * contribute fields to the Subscription type from multiple modules. You do not have to have previously
 * defined a Query type before using this. If you haven't Nexus will create one automatically for you.
 *
 * Note that the main difference about Subscription type from other object types is that its field
 * configurations require a special "subscribe" method where you can return an asynchronous iterator. Promises
 * yielded by that iterator become available to the resolver in its first param, the source data.
 *
 * If you need to leverage plugins or define multiple fields then use the typeBuilder overload variant of this
 * function. Otherwise you may prefer to the field name/config variant.
 *
 * @example
 *   // Contrived but simple self-contained example
 *
 *   subscriptionField((t) => {
 *     t.boolean('truths', {
 *       subscribe() {
 *         async function* createTruthsStream() {
 *           while (true) {
 *             await new Promise((res) => setTimeout(res, 1000))
 *             yield Math.random() > 0.5
 *           }
 *         }
 *         return createTruthsStream()
 *       },
 *       resolve(truthPromise) {
 *         return truthPromise
 *       },
 *     })
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
 *   makeSchema({
 *     types: [
 *       subscriptionField('signup', {
 *         type: 'User',
 *         subscribe() {
 *           return pubsub.asyncIterator('signup')
 *         },
 *         async resolve(eventPromise: Promise<Event<User>>) {
 *           const event = await eventPromise
 *           return event.data
 *         },
 *       }),
 *
 *       mutationField('signup', {
 *         type: 'User',
 *         args: {
 *           email: stringArg(),
 *         },
 *         async resolve(_, args) {
 *           const newUser = {
 *             email: args.email,
 *           }
 *           // ...
 *           await pubsub.publish('signup', {
 *             data: newUser,
 *           })
 *           return newUser
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
 * @param name The name of the field on the Query type. Names are case‐sensitive and must conform to pattern:
 *   `[_A-Za-z][_0-9A-Za-z]*`
 * @param config The same type of configuration you would pass to t.field("...", config)
 */
export function subscriptionField<FieldName extends string, Event>(
  name: FieldName,
  config: SubscriptionFieldConfig<FieldName, Event>
): NexusExtendTypeDef<'Subscription'>

export function subscriptionField(...args: any[]) {
  return extendType({
    type: 'Subscription',
    definition(t) {
      if (typeof args[0] === 'function') {
        return args[0](t)
      }

      const [fieldName, config] = args as [string, SubscriptionFieldConfig<any, any>]
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig as any)
    },
  })
}

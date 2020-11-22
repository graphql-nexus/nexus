import { extendType } from './extendType'
import { CommonOutputFieldConfig } from './definitionBlocks'
import { GetGen, ArgsValue, MaybePromise, MaybePromiseDeep, ResultValue } from '../typegenTypeHelpers'
import { AllNexusOutputTypeDefs } from './wrapping'
import { GraphQLResolveInfo } from 'graphql'

export interface SubscribeFieldConfig<FieldName extends string, Event = any>
  extends CommonOutputFieldConfig<'Subscription', FieldName> {
  type: GetGen<'allOutputTypes'> | AllNexusOutputTypeDefs

  subscribe(
    root: object,
    args: ArgsValue<'Subscription', FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<Event>> | MaybePromiseDeep<AsyncIterator<Event>>

  /**
   * Resolve method for the field
   */
  resolve(
    root: Event,
    args: ArgsValue<'Subscription', FieldName>,
    context: GetGen<'context'>,
    info: GraphQLResolveInfo
  ):
    | MaybePromise<ResultValue<'Subscription', FieldName>>
    | MaybePromiseDeep<ResultValue<'Subscription', FieldName>>
}

// TODO(tim): Implement the subscriptionField(() => {}) overload to match queryField / mutationField

/**
 * Adds a single field to the Subscription type
 */
export function subscriptionField<FieldName extends string, Event>(
  fieldName: FieldName,
  config: SubscribeFieldConfig<FieldName, Event> | (() => SubscribeFieldConfig<FieldName, Event>)
) {
  return extendType({
    type: 'Subscription',
    definition(t) {
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig as any)
    },
  })
}

import { extendType, NexusExtendTypeDef } from './extendType'
import { SubscriptionBuilder, SubscriptionTypeConfig } from './subscriptionType'

export type SubscriptionFieldConfig<FieldName extends string, Event> =
  | SubscriptionTypeConfig<FieldName, Event>
  | (() => SubscriptionTypeConfig<FieldName, Event>)

export function subscriptionField(
  fieldFn: (t: SubscriptionBuilder) => void
): NexusExtendTypeDef<'Subscription'>

export function subscriptionField<FieldName extends string, Event>(
  fieldName: FieldName,
  config: SubscriptionFieldConfig<FieldName, Event>
): NexusExtendTypeDef<'Subscription'>

/**
 * Add one field to the Subscription type
 */
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

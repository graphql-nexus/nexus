import { extendType } from './extendType'
import { SubscriptionTypeConfig } from './subscriptionType'

/**
 * Add one field to the Subscription type
 */
export function subscriptionField<FieldName extends string, Event>(
  fieldName: FieldName,
  config: SubscriptionTypeConfig<FieldName, Event> | (() => SubscriptionTypeConfig<FieldName, Event>)
) {
  return extendType({
    type: 'Subscription',
    definition(t) {
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig as any)
    },
  })
}

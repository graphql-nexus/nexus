import { extendType } from './extendType'
import { SubscribeFieldConfig } from './subscriptionType'

/**
 * Add one field to the Subscription type
 */
export function subscriptionField<FieldName extends string>(
  fieldName: FieldName,
  config:
    | SubscribeFieldConfig<'Subscription', FieldName>
    | (() => SubscribeFieldConfig<'Subscription', FieldName>)
) {
  return extendType({
    type: 'Subscription',
    definition(t) {
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig)
    },
  })
}

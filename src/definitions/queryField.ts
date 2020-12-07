import { FieldOutConfig, OutputDefinitionBlock } from '../core'
import { extendType, NexusExtendTypeDef } from './extendType'

export type QueryFieldConfig<FieldName extends string> =
  | FieldOutConfig<'Query', FieldName>
  | (() => FieldOutConfig<'Query', FieldName>)

export function queryField(fieldFn: (t: OutputDefinitionBlock<'Query'>) => void): NexusExtendTypeDef<'Query'>

export function queryField<FieldName extends string>(
  fieldName: FieldName,
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

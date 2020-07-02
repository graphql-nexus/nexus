import { FieldOutConfig, OutputDefinitionBlock } from '../core'
import { extendType, NexusExtendTypeDef } from './extendType'

export type MutationFieldConfig<FieldName extends string> =
  | FieldOutConfig<'Mutation', FieldName>
  | (() => FieldOutConfig<'Mutation', FieldName>)

export function mutationField(
  fieldFn: (t: OutputDefinitionBlock<'Mutation'>) => void
): NexusExtendTypeDef<'Mutation'>

export function mutationField<FieldName extends string>(
  fieldName: FieldName,
  config: MutationFieldConfig<FieldName>
): NexusExtendTypeDef<'Mutation'>

export function mutationField(...args: any[]) {
  return extendType({
    type: 'Mutation',
    definition(t) {
      if (typeof args[0] === 'function') {
        return args[0](t)
      }
      const [fieldName, config] = args as [string, MutationFieldConfig<any>]
      const finalConfig = typeof config === 'function' ? config() : config
      t.field(fieldName, finalConfig)
    },
  })
}

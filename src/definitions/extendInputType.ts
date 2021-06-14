import { assertValidName } from 'graphql'
import type { GetGen } from '../typegenTypeHelpers'
import type { InputDefinitionBlock } from './definitionBlocks'
import { NexusTypes, withNexusSymbol } from './_types'

export interface NexusExtendInputTypeConfig<TypeName extends string> {
  type: TypeName
  definition(t: InputDefinitionBlock<TypeName>): void
}

export class NexusExtendInputTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusExtendInputTypeConfig<any> & { name: string }) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusExtendInputTypeDef, NexusTypes.ExtendInputObject)

/**
 * Adds new fields to an existing inputObjectType in the schema. Useful when splitting your schema across
 * several domains.
 *
 * @see https://nexusjs.org/docs/api/extend-type
 */
export function extendInputType<TypeName extends GetGen<'inputNames', string>>(
  config: NexusExtendInputTypeConfig<TypeName>
) {
  return new NexusExtendInputTypeDef(config.type, {
    ...config,
    name: config.type,
  })
}

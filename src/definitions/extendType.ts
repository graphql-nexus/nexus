import { assertValidName } from 'graphql'
import { AllOutputTypesPossible } from '../typegenTypeHelpers'
import { OutputDefinitionBlock } from './definitionBlocks'
import { NexusTypes, withNexusSymbol } from './_types'
import { IsSubscriptionType, SubscriptionBuilder } from './subscriptionType'

export interface NexusExtendTypeConfig<TypeName extends string> {
  type: TypeName
  definition(
    t: IsSubscriptionType<TypeName> extends true ? SubscriptionBuilder : OutputDefinitionBlock<TypeName>
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
 * Adds new fields to an existing objectType in the schema. Useful when
 * splitting your schema across several domains.
 *
 * @see https://nexusjs.org/docs/api/extend-type
 */
export function extendType<TypeName extends AllOutputTypesPossible>(config: NexusExtendTypeConfig<TypeName>) {
  return new NexusExtendTypeDef(config.type, { ...config, name: config.type }) as NexusExtendTypeDef<any>
}

import { GraphQLResolveInfo } from 'graphql'
import { ArgsValue, GetGen, MaybePromise, MaybePromiseDeep, ResultValue } from '../typegenTypeHelpers'
import { CommonOutputFieldConfig, OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'
import { AllNexusOutputTypeDefs } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

type SubscriptionTypeName = 'Subscription'

export interface SubscribeFieldConfig<TypeName extends string, FieldName extends string, T = any>
  extends CommonOutputFieldConfig<TypeName, FieldName> {
  type: GetGen<'allOutputTypes'> | AllNexusOutputTypeDefs

  subscribe(
    root: object,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<T>> | MaybePromiseDeep<AsyncIterator<T>>

  /**
   * Resolve method for the field
   */
  resolve(
    root: T,
    args: ArgsValue<TypeName, FieldName>,
    context: GetGen<'context'>,
    info: GraphQLResolveInfo
  ):
    | MaybePromise<ResultValue<'Subscription', FieldName>>
    | MaybePromiseDeep<ResultValue<'Subscription', FieldName>>
}

export interface SubscriptionDefinitionBuilder extends OutputDefinitionBuilder {}

export class SubscriptionDefinitionBlock extends OutputDefinitionBlock<'Subscription'> {
  constructor(protected typeBuilder: SubscriptionDefinitionBuilder) {
    super(typeBuilder)
  }

  field<FieldName extends string>(
    name: FieldName,
    fieldConfig: SubscribeFieldConfig<SubscriptionTypeName, FieldName>
  ) {
    // field<FieldName extends string>(name: FieldName, fieldConfig: FieldOutConfig<TypeName, FieldName>) {
    // FIXME
    // 1. FieldOutConfig<TypeName is constrained to any string subtype
    // 2. NexusOutputFieldDef is contrained to be be a string
    // 3. so `name` is not compatible
    // 4. and changing FieldOutConfig to FieldOutConfig<string breaks types in other places
    const field: any = {
      name,
      ...fieldConfig,
    }
    this.typeBuilder.addField(this.decorateField(field))
  }
}

export type NexusSubscriptionTypeConfig = {
  name: SubscriptionTypeName
  definition(t: SubscriptionDefinitionBlock): void
}

export class NexusSubscriptionTypeDef {
  constructor(protected config: NexusSubscriptionTypeConfig) {}

  name = 'Subscription'

  get value() {
    return this.config
  }
}

withNexusSymbol(NexusSubscriptionTypeDef, NexusTypes.Subscription)

export function subscriptionType(config: Omit<NexusSubscriptionTypeConfig, 'name'>) {
  return new NexusSubscriptionTypeDef({ ...config, name: 'Subscription' }) as any
}

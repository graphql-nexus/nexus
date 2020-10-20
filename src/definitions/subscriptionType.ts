import { GraphQLResolveInfo } from 'graphql'
import { ArgsValue, GetGen, MaybePromise, MaybePromiseDeep, ResultValue } from '../typegenTypeHelpers'
import { IsEqual } from '../utils'
import { CommonOutputFieldConfig, NexusOutputFieldDef } from './definitionBlocks'
import { ObjectDefinitionBuilder, objectType } from './objectType'
import { AllNexusOutputTypeDefs } from './wrapping'
import { BaseScalars } from './_types'

export interface SubscribeFieldConfigBase<FieldName extends string, Event = any> {
  resolve(
    root: Event,
    args: ArgsValue<'Subscription', FieldName>,
    context: GetGen<'context'>,
    info: GraphQLResolveInfo
  ):
    | MaybePromise<ResultValue<'Subscription', FieldName>>
    | MaybePromiseDeep<ResultValue<'Subscription', FieldName>>

  subscribe(
    root: object,
    args: ArgsValue<'Subscription', FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<Event>> | MaybePromiseDeep<AsyncIterator<Event>>
}

// prettier-ignore
export type FieldShorthandConfig<FieldName extends string> =
    CommonOutputFieldConfig<'Subscription', FieldName>
  & SubscribeFieldConfigBase<FieldName>

// prettier-ignore
export interface SubscribeFieldConfig<TypeName extends string, FieldName extends string>
  extends SubscribeFieldConfigBase<FieldName>,
          CommonOutputFieldConfig<'Subscription', FieldName>
  {
    type: GetGen<'allOutputTypes'> | AllNexusOutputTypeDefs
  }

export interface SubscriptionBuilderInternal extends ObjectDefinitionBuilder<'Subscription'> {}

export class SubscriptionBuilder {
  constructor(protected typeBuilder: SubscriptionBuilderInternal, protected isList = false) {}

  get list() {
    if (this.isList) {
      throw new Error('Cannot chain list.list, in the definition block. Use `list: []` config value')
    }
    return new SubscriptionBuilder(this.typeBuilder, true)
  }

  string<FieldName extends string>(fieldName: FieldName, config: FieldShorthandConfig<FieldName>) {
    this.fieldShorthand(fieldName, 'String', config)
  }

  int<FieldName extends string>(fieldName: FieldName, config: FieldShorthandConfig<FieldName>) {
    this.fieldShorthand(fieldName, 'Int', config)
  }

  // prettier-ignore
  boolean<FieldName extends string>(fieldName: FieldName, opts: FieldShorthandConfig<FieldName>) {
    this.fieldShorthand(fieldName, 'Boolean', opts)
  }

  id<FieldName extends string>(fieldName: FieldName, config: FieldShorthandConfig<FieldName>) {
    this.fieldShorthand(fieldName, 'ID', config)
  }

  float<FieldName extends string>(fieldName: FieldName, config: FieldShorthandConfig<FieldName>) {
    this.fieldShorthand(fieldName, 'Float', config)
  }

  // prettier-ignore
  field<FieldName extends string>(name: FieldName, fieldConfig: SubscribeFieldConfig<'Subscription', FieldName>) {
    this.typeBuilder.addField(this.decorateField({ name, ...fieldConfig } as any))
  }

  protected fieldShorthand(fieldName: string, typeName: BaseScalars, config: FieldShorthandConfig<any>) {
    this.typeBuilder.addField(
      this.decorateField({
        name: fieldName,
        type: typeName,
        ...config,
      } as any)
    )
  }

  protected decorateField(config: NexusOutputFieldDef): NexusOutputFieldDef {
    if (this.isList) {
      if (config.list) {
        this.typeBuilder.warn(
          `It looks like you chained .list and set list for ${config.name}. ` +
            'You should only do one or the other'
        )
      } else {
        config.list = true
      }
    }
    return config
  }
}

export type SubscriptionTypeParams = {
  definition(t: SubscriptionBuilder): void
}

export function subscriptionType(config: SubscriptionTypeParams) {
  return objectType({ name: 'Subscription', ...config } as any)
}

export type IsSubscriptionType<T> = IsEqual<T, 'Subscription'>

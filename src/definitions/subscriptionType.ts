import { GraphQLResolveInfo } from 'graphql'
import {
  ArgsValue,
  FieldResolver,
  GetGen,
  HasGen3,
  MaybePromise,
  MaybePromiseDeep,
  NeedsResolver,
  ResultValue,
} from '../typegenTypeHelpers'
import { CommonOutputFieldConfig } from './definitionBlocks'
import { ObjectDefinitionBlock, ObjectDefinitionBuilder, objectType } from './objectType'
import { AllNexusOutputTypeDefs } from './wrapping'

export interface SubscriptionScalarConfig<TypeName extends string, FieldName extends string, T = any>
  extends CommonOutputFieldConfig<TypeName, FieldName> {
  /**
   * Resolve method for the field
   */
  resolve?: FieldResolver<TypeName, FieldName>

  subscribe(
    root: object,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<T>> | MaybePromiseDeep<AsyncIterator<T>>
}

export type ScalarSubSpread<TypeName extends string, FieldName extends string> = NeedsResolver<
  TypeName,
  FieldName
> extends true
  ? HasGen3<'argTypes', TypeName, FieldName> extends true
    ? [ScalarSubConfig<TypeName, FieldName>]
    : [ScalarSubConfig<TypeName, FieldName>] | [FieldResolver<TypeName, FieldName>]
  : HasGen3<'argTypes', TypeName, FieldName> extends true
  ? [ScalarSubConfig<TypeName, FieldName>]
  : [] | [FieldResolver<TypeName, FieldName>] | [ScalarSubConfig<TypeName, FieldName>]

export type ScalarSubConfig<TypeName extends string, FieldName extends string> = NeedsResolver<
  TypeName,
  FieldName
> extends true
  ? SubscriptionScalarConfig<TypeName, FieldName> & {
      resolve: FieldResolver<TypeName, FieldName>
    }
  : SubscriptionScalarConfig<TypeName, FieldName>

export interface SubscribeFieldConfig<TypeName extends string, FieldName extends string, T = any>
  extends CommonOutputFieldConfig<TypeName, FieldName> {
  type: GetGen<'allOutputTypes'> | AllNexusOutputTypeDefs

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

  subscribe(
    root: object,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<T>> | MaybePromiseDeep<AsyncIterator<T>>
}

export interface SubscriptionDefinitionBuilder extends ObjectDefinitionBuilder<'Subscription'> {}

export class SubscriptionDefinitionBlock extends ObjectDefinitionBlock<'Subscription'> {
  constructor(protected typeBuilder: SubscriptionDefinitionBuilder, protected isList = false) {
    super(typeBuilder)
  }

  get list() {
    if (this.isList) {
      throw new Error('Cannot chain list.list, in the definition block. Use `list: []` config value')
    }
    return new SubscriptionDefinitionBlock(this.typeBuilder, true)
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarSubSpread<'Subscription', FieldName>
  ) {
    this.addScalarField(fieldName, 'String', opts)
  }

  int<FieldName extends string>(fieldName: FieldName, ...opts: ScalarSubSpread<'Subscription', FieldName>) {
    this.addScalarField(fieldName, 'Int', opts)
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarSubSpread<'Subscription', FieldName>
  ) {
    this.addScalarField(fieldName, 'Boolean', opts)
  }

  id<FieldName extends string>(fieldName: FieldName, ...opts: ScalarSubSpread<'Subscription', FieldName>) {
    this.addScalarField(fieldName, 'ID', opts)
  }

  float<FieldName extends string>(fieldName: FieldName, ...opts: ScalarSubSpread<'Subscription', FieldName>) {
    this.addScalarField(fieldName, 'Float', opts)
  }

  field<FieldName extends string>(
    name: FieldName,
    fieldConfig: SubscribeFieldConfig<'Subscription', FieldName>
  ) {
    const field: any = { name, ...fieldConfig }
    this.typeBuilder.addField(this.decorateField(field))
  }
}

export type NexusSubscriptionTypeConfig = {
  name: 'Subscription'
  definition(t: SubscriptionDefinitionBlock): void
}

export function subscriptionType(config: Omit<NexusSubscriptionTypeConfig, 'name'>) {
  return objectType({ name: 'Subscription', ...config })
}

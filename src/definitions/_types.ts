import {
  GraphQLCompositeType,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLInputObjectType,
  GraphQLInputObjectTypeConfig,
  GraphQLInterfaceType,
  GraphQLInterfaceTypeConfig,
  GraphQLLeafType,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
} from 'graphql'
import {
  NexusFieldExtension,
  NexusInputObjectTypeExtension,
  NexusInterfaceTypeExtension,
  NexusObjectTypeExtension,
  NexusSchemaExtension,
} from '../extensions'
import * as AbstractTypes from '../typegenAbstractTypes'
import { RequiredDeeply } from '../typeHelpersInternal'

export { AbstractTypes }

export type Maybe<T> = T | null

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type BaseScalars = 'String' | 'Int' | 'Float' | 'ID' | 'Boolean'

export enum NexusTypes {
  Arg = 'Arg',
  DynamicInput = 'DynamicInput',
  DynamicOutputMethod = 'DynamicOutputMethod',
  DynamicOutputProperty = 'DynamicOutputProperty',
  Enum = 'Enum',
  ExtendInputObject = 'ExtendInputObject',
  ExtendObject = 'ExtendObject',
  InputField = 'InputField',
  InputObject = 'InputObject',
  Interface = 'Interface',
  List = 'List',
  NonNull = 'NonNull',
  Null = 'Null',
  Object = 'Object',
  OutputField = 'OutputField',
  Plugin = 'Plugin',
  PrintedGenTyping = 'PrintedGenTyping',
  PrintedGenTypingImport = 'PrintedGenTypingImport',
  Scalar = 'Scalar',
  Union = 'Union',
}

export interface DeprecationInfo {
  /**
   * Reason for the deprecation.
   */
  reason: string
  /**
   * Date | YYYY-MM-DD formatted date of when this field
   * became deprecated.
   */
  startDate?: string | Date
  /**
   * Field or usage that replaces the deprecated field.
   */
  supersededBy?: string
}

export interface NonNullConfig {
  /**
   * Whether output fields are non-null by default.
   *
   * type Example {
   *   field: String!
   *   otherField: [String!]!
   * }
   *
   * @default false
   */
  output?: boolean
  /**
   * Whether input fields (field arguments, input type members)
   * are non-null by default.
   *
   * input Example {
   *   field: String
   *   something: [String]
   * }
   *
   * @default false
   */
  input?: boolean
}

export type GraphQLPossibleOutputs = GraphQLCompositeType | GraphQLLeafType

export type GraphQLPossibleInputs = GraphQLInputObjectType | GraphQLLeafType

export const NexusWrappedSymbol = Symbol.for('@nexus/wrapped')

export function withNexusSymbol(obj: Function, nexusType: NexusTypes) {
  obj.prototype[NexusWrappedSymbol] = nexusType
}

export interface AsyncIterator<T> {
  next(value?: any): Promise<IteratorResult<T>>
  return?(value?: any): Promise<IteratorResult<T>>
  throw?(e?: any): Promise<IteratorResult<T>>
}

export type RootTypingDef = string | TypingImport

export type RootTypings = Record<string, string | TypingImport>

export interface TypingImport {
  /**
   * Node module, or absolute path to import the type from.
   */
  path: string
  /**
   * Name of the type we want to reference in the `path`
   */
  name: string
  /**
   * Name we want the imported type to be referenced as
   */
  alias?: string
}

export interface MissingType {
  fromObject: boolean
}

export type GraphQLNamedOutputType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType

export type GraphQLNamedInputType = GraphQLScalarType | GraphQLInputObjectType | GraphQLEnumType

type WithExt<T extends { extensions?: any }, Ext> = Omit<T, 'extensions'> & {
  extensions?: Maybe<{ nexus?: Ext }>
}

export type NexusGraphQLFieldConfig = WithExt<GraphQLFieldConfig<any, any>, NexusFieldExtension> & {
  name: string
}

export type NexusGraphQLObjectTypeConfig = WithExt<
  GraphQLObjectTypeConfig<any, any>,
  NexusObjectTypeExtension
>

export type NexusGraphQLInputObjectTypeConfig = WithExt<
  GraphQLInputObjectTypeConfig,
  NexusInputObjectTypeExtension
>

export type NexusGraphQLInterfaceTypeConfig = WithExt<
  GraphQLInterfaceTypeConfig<any, any>,
  NexusInterfaceTypeExtension
> & { interfaces: () => GraphQLInterfaceType[] }

export type NexusGraphQLSchema = Omit<GraphQLSchema, 'extensions'> & {
  extensions: { nexus: NexusSchemaExtension }
}

export type NexusFeaturesInput = {
  /**
   * Toggle runtime checks for correct implementation of abstract types. This is
   * a redundant check Nexus makes over the existing static typings it provides.
   *
   * @remarks
   *
   * This is useful for beginners because Nexus can give clear concise error
   * messages unlike the static type errors.
   *
   * Note that if you enable the "abstractTypeStrategies.__typename" feature
   * then this feature will be automatically disabled. For why this is, see that
   * features' remarks.
   */
  abstractTypeRuntimeChecks?: boolean
  /**
   * Toggle abstract-type strategies. For more detail about this feature please refer to to the [abstract types guide](https://nxs.li/guides/abstract-types).
   *
   * If you plan on enabling multiple strategies and you've never done so then please [read the guide about using multiple strategies](https://nxs.li/guides/abstract-types/using-multiple-strategies) as there are a few quirks to be aware of.
   *
   * @default
   *
   * {
   *    resolveType: true,
   *    __typename: false
   *    isTypeOf: false,
   * }
   */
  abstractTypeStrategies?: {
    /**
     * The Modular abstract type strategy. Every member object of an abstract
     * type (union members or interface implementors) will generally be required
     * to implement isTypeOf method. Nexus will not require it in cases where it
     * detects you have implemented another strategy. For more detail see the
     * guide for the [Modular Abstract Type Strategy](https://nxs.li/guides/abstract-types/modular-strategy).
     */
    isTypeOf?: boolean
    /**
     * The Centralized abstract type strategy. Every abstract type (union or
     * interface) will generally be required to implement its resolveType
     * method. Nexus will not require it in cases where it detects you have
     * implemented another strategy. For more detail see the guide for the [Central Abstract Type Strategy](https://nxs.li/guides/abstract-types/centralized-strategy).
     */
    resolveType?: boolean
    /**
     * The Discriminant Model Field strategy. In this mode the resolvers of fields typed as
     * abstract types will be required to include "__typename" field in the
     * returned data. For more detail see the guide for the [Discriminant Model Field Strategy](https://nxs.li/guides/abstract-types/discriminant-model-field-strategy).
     *
     * @warning
     *
     * When this strategy is enabled in conjunction with other strategies the "abstractTypeRuntimeChecks" feature will
     * automatically be disabled. This is because it is not practical at runtime
     * to find out if resolvers will return objects that include the
     * "__typename" field. This trade-off can be acceptable since the runtime checks are a redundant safety
     * measure over the static typing. So as long as you are not ignoring static errors related to Nexus' abstract type type checks then you then you should still have a safe implementation.
     *
     * Furthermore another effect is that statically the other strategies will not appear to be _required_, but instead _optional_, while only this one will appear required. However, upon implementing any of the other strategies, this one will not longer be required. This quirk is explained in the guide section about [using multiple strategies](https://nxs.li/guides/abstract-types/using-multiple-strategies).
     *
     */
    __typename?: boolean
  }
}

export type NexusFeatures = RequiredDeeply<NexusFeaturesInput>

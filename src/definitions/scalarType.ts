import { assertValidName, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
import { decorateType } from './decorateType'
import { NexusTypes, SourceTypingDef, withNexusSymbol } from './_types'

export interface ScalarBase
  extends Pick<
    GraphQLScalarTypeConfig<any, any>,
    'description' | 'serialize' | 'parseValue' | 'parseLiteral'
  > {}

export interface ScalarConfig {
  /** Any deprecation info for this scalar type */
  deprecation?: string // | DeprecationInfo;
  /** Adds this type as a method on the Object/Interface definition blocks */
  asNexusMethod?: string
  /** Source type information for this type */
  sourceType?: SourceTypingDef
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLScalarTypeConfig<any, any>['extensions']
}

export interface NexusScalarTypeConfig<T extends string> extends ScalarBase, ScalarConfig {
  /** The name of the scalar type */
  name: T
}

export class NexusScalarTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusScalarTypeConfig<string>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusScalarTypeDef, NexusTypes.Scalar)

export function scalarType<TypeName extends string>(options: NexusScalarTypeConfig<TypeName>) {
  return new NexusScalarTypeDef(options.name, options)
}

export function asNexusMethod<T extends GraphQLScalarType>(
  scalar: T,
  methodName: string,
  sourceType?: SourceTypingDef
): T {
  return decorateType(scalar, {
    asNexusMethod: methodName,
    sourceType,
  })
}

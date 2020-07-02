import { assertValidName } from 'graphql'
import { NexusTypes, RootTypingDef, withNexusSymbol } from './_types'

type TypeScriptEnumLike = {
  [key: number]: string
}

export interface EnumMemberInfo {
  /**
   * The external "value" of the enum as displayed in the SDL
   */
  name: string
  /**
   * The internal representation of the enum
   */
  value?: string | number | object | boolean
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
}

export interface EnumTypeConfig<TypeName extends string> {
  name: TypeName
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef
  /**
   * All members of the enum, either as an array of strings/definition objects, as an object, or as a TypeScript enum
   */
  members:
    | Array<string | EnumMemberInfo>
    | Record<string, string | number | object | boolean>
    | TypeScriptEnumLike
}

export class NexusEnumTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: EnumTypeConfig<string>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}
withNexusSymbol(NexusEnumTypeDef, NexusTypes.Enum)

export function enumType<TypeName extends string>(config: EnumTypeConfig<TypeName>) {
  return new NexusEnumTypeDef(config.name, config)
}

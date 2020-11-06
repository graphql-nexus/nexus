import { isNexusNonNullTypeDef, isNexusNullTypeDef, NexusNonNullableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

export class NexusNonNullDef<TypeName extends NexusNonNullableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusNonNullDef: boolean = true

  constructor(readonly ofType: TypeName) {
    if (isNexusNonNullTypeDef(ofType)) {
      throw new Error('Cannot wrap a nonNull in a nonNull')
    }

    if (isNexusNullTypeDef(ofType)) {
      throw new Error('Cannot wrap a nullable in a nonNull')
    }
  }
}

withNexusSymbol(NexusNonNullDef, NexusTypes.NonNull)

export function nonNull<TypeName extends NexusNonNullableTypes>(type: TypeName) {
  return new NexusNonNullDef(type)
}

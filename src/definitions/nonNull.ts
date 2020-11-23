import { isNexusNonNullTypeDef, isNexusNullTypeDef, isNexusStruct, NexusNonNullableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'
import { isNonNullType, isType } from 'graphql'

export class NexusNonNullDef<TypeName extends NexusNonNullableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusNonNullDef: boolean = true

  constructor(readonly ofNexusType: TypeName) {
    if (typeof ofNexusType !== 'string' && !isNexusStruct(ofNexusType) && !isType(ofNexusType)) {
      throw new Error('Cannot wrap unknown types in a nonNull(). Saw ' + ofNexusType)
    }
  }
}

withNexusSymbol(NexusNonNullDef, NexusTypes.NonNull)

export function nonNull<TypeName extends NexusNonNullableTypes>(type: TypeName) {
  if (isNexusNonNullTypeDef(type) || isNonNullType(type)) {
    return type
  }
  if (isNexusNullTypeDef(type)) {
    return new NexusNonNullDef(type.ofNexusType)
  }
  return new NexusNonNullDef(type)
}

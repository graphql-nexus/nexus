import { isType } from 'graphql'
import { isNexusNonNullTypeDef, isNexusNullTypeDef, isNexusStruct, NexusNullableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

export class NexusNullDef<TypeName extends NexusNullableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusNullDef: boolean = true

  constructor(readonly ofNexusType: TypeName) {
    if (typeof ofNexusType !== 'string' && !isNexusStruct(ofNexusType) && !isType(ofNexusType)) {
      throw new Error('Cannot wrap unknown types in nullable(). Saw ' + ofNexusType)
    }
  }
}

withNexusSymbol(NexusNullDef, NexusTypes.Null)

/**
 * null()
 */
export function nullable<TypeName extends NexusNullableTypes>(type: TypeName) {
  if (isNexusNonNullTypeDef(type)) {
    return new NexusNullDef(type.ofNexusType)
  }
  if (isNexusNullTypeDef(type)) {
    return type
  }
  return new NexusNullDef(type)
}

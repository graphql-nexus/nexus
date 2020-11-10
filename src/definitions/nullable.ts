import { isNexusNonNullTypeDef, isNexusNullTypeDef, isNexusStruct, NexusNullableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

export class NexusNullDef<TypeName extends NexusNullableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusNullDef: boolean = true

  constructor(readonly ofType: TypeName) {
    if (isNexusNonNullTypeDef(ofType)) {
      throw new Error('Cannot wrap a nonNull() in a nullable()')
    }

    if (isNexusNullTypeDef(ofType)) {
      throw new Error('Cannot wrap a nullable() in a nullable()')
    }

    if (!isNexusStruct(ofType) && typeof ofType !== 'string') {
      throw new Error('Cannot wrap a type not constructed by Nexus in a nullable(). Saw ' + ofType)
    }
  }
}

withNexusSymbol(NexusNullDef, NexusTypes.Null)

/**
 * null()
 */
export function nullable<TypeName extends NexusNullableTypes>(type: TypeName) {
  return new NexusNullDef(type)
}

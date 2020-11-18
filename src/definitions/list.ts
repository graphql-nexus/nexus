import { AllNamedTypeDefs, isNexusStruct, NexusListableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'
/**
 * list()
 */
export type NexusListDefConfig<TypeName extends AllNamedTypeDefs> = {
  type: TypeName
}

export class NexusListDef<TypeName extends NexusListableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusListDef: boolean = true

  constructor(readonly ofType: TypeName) {
    if (!isNexusStruct(ofType) && typeof ofType !== 'string') {
      throw new Error('Cannot wrap a type not constructed by Nexus in a list(). Saw ' + ofType)
    }
  }
}

withNexusSymbol(NexusListDef, NexusTypes.List)

export function list<TypeName extends NexusListableTypes>(type: TypeName): NexusListDef<TypeName> {
  return new NexusListDef(type)
}

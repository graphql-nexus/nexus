import { GetGen } from '../typegenTypeHelpers'
import { AllNexusNamedTypeDefs } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

type AllNamedTypes = GetGen<'allNamedTypes', string> | AllNexusNamedTypeDefs
type AllTypes = AllNamedTypes | NexusListDef<any> | NexusNonNullDef<any>

/**
 * list()
 */
export type NexusListDefConfig<TypeName extends AllNamedTypes> = {
  type: TypeName
}

export class NexusListDef<TypeName extends AllTypes> {
  // @ts-ignore
  private _isNexusListDef: boolean = true

  constructor(readonly ofType: TypeName) {}
}

withNexusSymbol(NexusListDef, NexusTypes.List)

export function list<TypeName extends AllTypes>(type: TypeName) {
  return new NexusListDef(type)
}

/**
 * nonNull()
 */
export class NexusNonNullDef<TypeName extends AllTypes> {
  // @ts-ignore
  private _isNexusNonNullDef: boolean = true

  constructor(readonly ofType: TypeName) {}
}

withNexusSymbol(NexusNonNullDef, NexusTypes.NonNull)

export function nonNull<TypeName extends AllTypes>(type: TypeName) {
  return new NexusNonNullDef(type)
}

// @ts-ignore
function typeGuard() {
  // nonNull('Type') //                      -> Type!
  // list('Type') //                         -> [Type]
  // list(nonNull('Type')) //                -> [Type!]
  // nonNull(list('Type')) //                -> [Type]!
  // nonNull(list(nonNull('Type'))) //       -> [Type!]!
  // list(list('Type')) //                   -> [[Type]]
  // list(nonNull(list('Type'))) //          -> [[Type]!]
  // nonNull(list(list('Type'))) //          -> [[Type]]!
  // list(nonNull(list(nonNull('Type')))) // -> [[Type!]!]
  // nonNull(nonNull(list('Titi')))
}

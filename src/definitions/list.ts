import { GetGen } from '../typegenTypeHelpers'
import { AllNexusNamedTypeDefs } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

type AllNamedTypes = GetGen<'allNamedTypes', string> | AllNexusNamedTypeDefs

/**
 * list()
 */

type ListableTypes = AllNamedTypes | NexusNonNullDef<NonNullableTypes> | NexusListDef<ListableTypes>

export type NexusListDefConfig<TypeName extends ListableTypes> = {
  type: TypeName
}

export class NexusListDef<TypeName extends ListableTypes> {
  // @ts-ignore
  private _isNexusListDef: boolean = true

  constructor(readonly type: TypeName) {}
}

withNexusSymbol(NexusListDef, NexusTypes.List)

export function list<TypeName extends ListableTypes>(type: TypeName) {
  return new NexusListDef(type)
}

/**
 * nonNull()
 */

type NonNullableTypes = AllNamedTypes | NexusListDef<ListableTypes>

export class NexusNonNullDef<TypeName extends NonNullableTypes> {
  // @ts-ignore
  private _isNexusNonNullDef: boolean = true

  constructor(readonly type: TypeName) {}
}

withNexusSymbol(NexusNonNullDef, NexusTypes.NonNull)

export function nonNull<TypeName extends NonNullableTypes>(type: TypeName) {
  return new NexusNonNullDef(type)
}

// @ts-ignore
function typeGuard() {
  nonNull('Type') //                      -> Type!
  list('Type') //                         -> [Type]
  list(nonNull('Type')) //                -> [Type!]
  nonNull(list('Type')) //                -> [Type]!
  nonNull(list(nonNull('Type'))) //       -> [Type!]!
  list(list('Type')) //                   -> [[Type]]
  list(nonNull(list('Type'))) //          -> [[Type]!]
  nonNull(list(list('Type'))) //          -> [[Type]]!
  list(nonNull(list(nonNull('Type')))) // -> [[Type!]!]
}

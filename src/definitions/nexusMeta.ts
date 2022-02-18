import { ownProp } from '../utils'
import type { NexusInterfaceTypeDef } from './interfaceType'
import type { NexusObjectTypeDef } from './objectType'
import { isNexusStruct, isNexusInterfaceTypeDef, isNexusObjectTypeDef } from './wrapping'

/** Symbol marking an object as something that can provide Nexus schema definitions */
export const NEXUS_TYPE = Symbol.for('@nexus/meta/NEXUS_TYPE')
export const NEXUS_BUILD = Symbol.for('@nexus/meta/NEXUS_BUILD')

type OutType = NexusObjectTypeDef<any> | NexusInterfaceTypeDef<any>

/** Object representing a single output or interface type */
export type NexusMetaTypeProp = {
  [NEXUS_TYPE]: OutType
}

export type NexusMetaTypeFn = {
  [NEXUS_TYPE]: () => OutType
}

export type NexusMetaType = NexusMetaTypeProp | NexusMetaTypeFn

/** Object containing a symbol defining a function that should be fed into the Nexus type construction layer */
export type NexusMetaBuild = {
  [NEXUS_BUILD]: () => any
}

export type NexusMeta = NexusMetaType | NexusMetaBuild

export function isNexusMetaBuild(obj: any): obj is NexusMetaBuild {
  return Boolean(obj && typeof ownProp.get(obj, NEXUS_BUILD) === 'function')
}

export function isNexusMetaType(obj: any): obj is NexusMetaType {
  return isNexusMetaTypeProp(obj) || isNexusMetaTypeFn(obj)
}

export function isNexusMetaTypeProp(obj: any): obj is NexusMetaTypeProp {
  return Boolean(obj && ownProp.has(obj, NEXUS_TYPE) && isNexusStruct(ownProp.get(obj, NEXUS_TYPE)))
}

export function isNexusMetaTypeFn(obj: any): obj is NexusMetaTypeFn {
  return Boolean(obj && ownProp.has(obj, NEXUS_TYPE) && typeof ownProp.get(obj, NEXUS_TYPE) === 'function')
}

export function isNexusMeta(obj: any): obj is NexusMetaBuild | NexusMetaTypeFn | NexusMetaType {
  return isNexusMetaBuild(obj) || isNexusMetaType(obj) || isNexusMetaTypeFn(obj)
}

/**
 * Evaluates the thunk, replacing it with the type
 *
 * @param obj
 */
export function resolveNexusMetaType(obj: NexusMetaType): OutType {
  let value = ownProp.get(obj, NEXUS_TYPE)
  if (typeof value === 'function') {
    value = ownProp.set(obj, NEXUS_TYPE, value.call(obj))
  }
  if (!isNexusObjectTypeDef(value) && !isNexusInterfaceTypeDef(value)) {
    throw new Error(`Expected property of NEXUS_TYPE to be an object or interface type`)
  }
  return value
}

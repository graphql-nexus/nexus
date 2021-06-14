/** Symbol marking an object as something that can provide Nexus schema definitions */
export const TO_NEXUS = Symbol.for('@nexus/toNexus')

/** Object containing a symbol defining a function that should be fed into the Nexus type construction layer */
export type ToNexusObject = {
  [TO_NEXUS]: () => any
}

export function isToNexusObject(obj: any): obj is ToNexusObject {
  return obj && Boolean(obj[TO_NEXUS]) && typeof obj[TO_NEXUS] === 'function'
}

import { isNonNullType, isType } from 'graphql'
import { isNexusMeta } from './nexusMeta'
import { isNexusNonNullTypeDef, isNexusNullTypeDef, isNexusStruct, NexusNonNullableTypes } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

export class NexusNonNullDef<TypeName extends NexusNonNullableTypes> {
  // @ts-ignore
  // Required field for TS to differentiate NonNull from Null from List
  private _isNexusNonNullDef: boolean = true

  constructor(readonly ofNexusType: TypeName) {
    if (
      typeof ofNexusType !== 'string' &&
      !isNexusStruct(ofNexusType) &&
      !isNexusMeta(ofNexusType) &&
      !isType(ofNexusType)
    ) {
      throw new Error('Cannot wrap unknown types in a nonNull(). Saw ' + ofNexusType)
    }
  }
}

withNexusSymbol(NexusNonNullDef, NexusTypes.NonNull)

/**
 * [API Docs](https://nxs.li/docs/api/nonNull) | [Nullability Guide](https://nxs.li/guides/nullability) |
 * [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Type-System.Non-Null)
 *
 * Modify a type to be Non-Null.
 *
 * In Nexus input and output position types are nullable by default so use this to modify them so long as
 * you've not changed the non-null defaults for one or both positions.
 *
 * If you find yourself using this a large majority of the time then consider changing your nullability defaults.
 *
 * @example
 *   objectType({
 *     name: 'User',
 *     definition(t) {
 *       t.field('id', {
 *         type: nonNull('ID'),
 *       })
 *       t.field('bio', {
 *         args: {
 *           format: nonNull(booleanArg()),
 *           maxWords: intArg(),
 *         },
 *         type: 'String',
 *       })
 *     },
 *   })
 *
 *   // GraphQL SDL
 *   // -----------
 *   //
 *   // type User {
 *   //   id: ID!
 *   //   bio(maxWords: Int, format: Boolean!): String
 *   // }
 *
 * @param type The type to wrap in Non-Null. This may be expressed in one of three ways:
 *
 *   1. As string literals matching the name of a builtin scalar. E.g.: 'ID', 'String', ...
 *   2. As string literals matching the name of another type. E.g.: 'User', 'Location', ... Thanks to [Nexus'
 *        reflection system](https://nxs.li/guides/reflection) this is typesafe and autocompletable. This is
 *        the idiomatic approach in Nexus because it avoids excessive importing and circular references.
 *   3. As references to other enums or object type definitions. E.g.: User, Location
 *
 *   You may also use other type modifier helpers like list() which in turn accept one of the three
 */
export function nonNull<TypeName extends NexusNonNullableTypes>(type: TypeName) {
  if (isNexusNonNullTypeDef(type) || isNonNullType(type)) {
    /*
	  Ran into an issue around the generated return type for `nonNull()`, 
	  which produces:
	  
	  ```ts
	  NexusNonNullDef<any> | (TypeName & GraphQLNonNull<any>)
	  ```
	  
	  This is problematic when you reach a decent amount of types, where you'll 
	  hit a `union type that is too complex to represent` error. Removing the 
	  right hand side of the clause resolves the issue, and the fact that it's a 
	  `GraphQLNonNull` type is irrelevant, so we can just cast it to 
	  `NexusNonNullDef<any>` here
	*/
    return type as NexusNonNullDef<any>
  }
  if (isNexusNullTypeDef(type)) {
    return new NexusNonNullDef(type.ofNexusType)
  }
  return new NexusNonNullDef(type)
}

/**
 * Borrowed from `type-fest`
 *
 * Extract the keys from a type where the value type of the key extends the given `Condition`.
 */
export type ConditionalKeys<Base, Condition> = NonNullable<
  // Wrap in `NonNullable` to strip away the `undefined` type from the produced union.
  {
    // Map through all the keys of the given base type.
    [Key in keyof Base]: Condition extends Base[Key] // Pick only keys with types extending the given `Condition` type.
      ? Key // Retain this key since the condition passes.
      : never // Discard this key since the condition fails.

    // Convert the produced object into a union type of the keys which passed the conditional test.
  }[keyof Base]
>

/**
 * Taken from `type-fest`
 *
 * Pick keys from the shape that matches the given `Condition`.
 */
export type ConditionalPick<Base, Condition> = Pick<Base, ConditionalKeys<Base, Condition>>

/**
 * Taken from `type-fest`
 *
 * Get the values of a mapped types
 */
export type ValueOf<ObjectType, ValueType extends keyof ObjectType = keyof ObjectType> = ObjectType[ValueType]

/** Is the given type equal to the other given type? */
export type IsEqual<A, B> = A extends B ? (B extends A ? true : false) : false

export type RequiredDeeply<T> = DoRequireDeeply<Exclude<T, undefined>>

/**
 * Represents a POJO. Prevents from allowing arrays and functions.
 *
 * @remarks
 *   TypeScript interfaces will not be considered sub-types.
 */
export type PlainObject = {
  [x: string]: Primitive | object
}

/** Matches any [primitive value](https://developer.mozilla.org/en-US/docs/Glossary/Primitive). */
export type Primitive = null | undefined | string | number | boolean | symbol | bigint

type DoRequireDeeply<T> = {
  [K in keyof T]-?: Exclude<T[K], undefined> extends PlainObject
    ? DoRequireDeeply<Exclude<T[K], undefined>>
    : Exclude<T[K], undefined>
}

export type MaybePromiseLike<T> = T | PromiseLike<T>

export type UnwrapPromise<R> = R extends PromiseLike<infer U> ? U : R

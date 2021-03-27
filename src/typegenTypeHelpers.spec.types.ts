import { expectAssignable } from 'tsd'
import type { MaybePromiseDeep } from './typegenTypeHelpers'

/** MaybePromiseDeep */

// A case found by Sytten https://github.com/graphql-nexus/schema/issues/470
// The presence of .then was leading to type errors
type Ones = 1[]
type GraphQLResponse = Ones | null
const getOnes = () => Promise.resolve([] as Ones)
expectAssignable<MaybePromiseDeep<GraphQLResponse>>(getOnes().then((ones) => ones))
// object with array
expectAssignable<MaybePromiseDeep<{ a: 1[] }>>({ a: [1] })
expectAssignable<MaybePromiseDeep<{ a: 1[] }>>(Promise.resolve({ a: [1] }))
// array
expectAssignable<MaybePromiseDeep<1[]>>([1])
expectAssignable<MaybePromiseDeep<1[]>>(Promise.resolve([1]))

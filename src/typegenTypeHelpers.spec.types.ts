import { expectAssignable } from 'tsd'
import { MaybePromiseDeep } from './typegenTypeHelpers'

//
// A case found by Sytten https://github.com/graphql-nexus/schema/issues/470
// The presence of .then was leading to type errors

type ones = 1[]
type GraphQLResponse = ones | null
const getOnes = () => Promise.resolve([] as ones)

expectAssignable<MaybePromiseDeep<GraphQLResponse>>(getOnes().then((ones) => ones))

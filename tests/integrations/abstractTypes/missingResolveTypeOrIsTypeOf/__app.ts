import { objectType, unionType } from '../../../../src'
import './__typegen'

export const A = objectType({
  name: 'A',
  definition(t) {
    t.string('name')
  },
})

export const U1 = unionType({
  name: 'U1',
  resolveType() {
    return 'A' as const
  },
  definition(t) {
    t.members(A)
  },
})

export const U2 = unionType({
  name: 'U2',
  definition(t) {
    t.members(A)
  },
})

import { venn } from '../src/utils'

describe('utils', () => {
  test('venn lhs', () => {
    expect(venn([1, 2], [1])).toEqual([new Set([2]), new Set([1]), new Set([])])
  })
  test('venn rhs', () => {
    expect(venn([1], [1, 2])).toEqual([new Set([]), new Set([1]), new Set([2])])
  })
  test('venn both', () => {
    expect(venn([1, 2], [1, 2])).toEqual([new Set([]), new Set([1, 2]), new Set([])])
  })
})

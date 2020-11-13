import { makeSchema, objectType, unionType } from '../src'

it('console.error if strategy is isTypeOf and some fields are missing an implementation', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  makeSchema({
    types: [
      objectType({
        name: 'A',
        isTypeOf() {
          return true
        },
        definition(t) {
          t.id('id')
        },
      }),
      objectType({
        name: 'B',
        definition(t) {
          t.id('id')
        },
      }),
      unionType({
        name: 'AB',
        definition(t) {
          t.members('A', 'B')
        },
      }),
    ],
    outputs: false,
    features: {
      abstractTypeStrategies: {
        isTypeOf: true,
      },
    },
  })

  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      [Error: You have a faulty implementation for your union type "AB". Some members of union type "AB" are missing an \`isTypeOf\` implementation: "B"],
    ]
  `)
  spy.mockRestore()
})

it('console.error if strategy is resolveType and some type are missing an implementation', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  makeSchema({
    types: [
      objectType({
        name: 'A',
        definition(t) {
          t.id('id')
        },
      }),
      objectType({
        name: 'B',
        definition(t) {
          t.id('id')
        },
      }),
      unionType({
        name: 'AB',
        definition(t) {
          t.members('A', 'B')
        },
      }),
    ],
    outputs: false,
    features: {
      abstractTypeStrategies: {
        resolveType: true,
      },
    },
  })

  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      [Error: You have a faulty implementation for your union type "AB". It is missing a \`resolveType\` implementation.],
    ]
  `)
  spy.mockRestore()
})

it('console.error if strategy is both resolveType and isTypeOf and some type are missing an implementation', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  makeSchema({
    types: [
      objectType({
        name: 'A',
        isTypeOf() {
          return true
        },
        definition(t) {
          t.id('id')
        },
      }),
      objectType({
        name: 'B',
        definition(t) {
          t.id('id')
        },
      }),
      unionType({
        name: 'AB',
        definition(t) {
          t.members('A', 'B')
        },
      }),
    ],
    outputs: false,
    features: {
      abstractTypeStrategies: {
        resolveType: true,
        isTypeOf: true,
      },
    },
  })

  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      [Error: You have a faulty implementation for your union type "AB". Either implement its \`resolveType\` or implement \`isTypeOf\` on each object in the union. These objects are missing an \`isTypeOf\` implementation: "B"],
    ]
  `)
  spy.mockRestore()
})

it('disable console.errors if strategy is __typename', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  makeSchema({
    types: [
      objectType({
        name: 'A',
        definition(t) {
          t.id('id')
        },
      }),
      objectType({
        name: 'B',
        definition(t) {
          t.id('id')
        },
      }),
      unionType({
        name: 'AB',
        definition(t) {
          t.members('A', 'B')
        },
      }),
    ],
    outputs: false,
    features: {
      abstractTypeStrategies: {
        __typename: true,
        isTypeOf: true,
        resolveType: true,
      },
    },
  })

  expect(spy).toHaveBeenCalledTimes(0)
  spy.mockRestore()
})

it('disable console.errors if abstractRuntimeChecks: false', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()
  makeSchema({
    types: [
      objectType({
        name: 'A',
        definition(t) {
          t.id('id')
        },
      }),
      objectType({
        name: 'B',
        definition(t) {
          t.id('id')
        },
      }),
      unionType({
        name: 'AB',
        definition(t) {
          t.members('A', 'B')
        },
      }),
    ],
    outputs: false,
    features: {
      abstractTypeRuntimeChecks: false,
    },
  })

  expect(spy).toHaveBeenCalledTimes(0)
  spy.mockRestore()
})

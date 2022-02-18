import * as GQL from 'graphql'
import { list, makeSchema, subscriptionType } from '../src/core'
import { mockStream, subscribe, take } from './__helpers'

it('defines a field on the mutation type as shorthand', async () => {
  const schema = makeSchema({
    types: [
      subscriptionType({
        definition(t) {
          // lists
          t.list.field('someFields', {
            type: 'Int',
            subscribe() {
              return mockStream(10, 0, (int) => int - 1)
            },
            resolve: (event) => {
              return event
            },
          })
          t.field('someInts', {
            type: list('Int'),
            subscribe() {
              return mockStream(10, 0, (int) => int + 1)
            },
            resolve: (event) => {
              return event
            },
          })
          // singular
          t.field('someField', {
            type: 'Int',
            subscribe() {
              return mockStream(10, 0, (int) => int - 1)
            },
            resolve: (event) => {
              return event
            },
          })
          t.field({
            name: 'someField2',
            type: 'Int',
            subscribe() {
              return mockStream(10, 0, (int) => int - 1)
            },
            resolve: (event) => {
              return event
            },
          })
          t.int('someInt', {
            subscribe() {
              return mockStream(10, 0, (int) => int + 1)
            },
            resolve: (event) => {
              return event
            },
          })
          t.string('someString', {
            subscribe() {
              return mockStream(10, '', (str) => str + '!')
            },
            resolve: (event) => {
              return event
            },
          })
          t.float('someFloat', {
            subscribe() {
              return mockStream(10, 0.5, (f) => f)
            },
            resolve: (event) => {
              return event
            },
          })
          t.boolean('someBoolean', {
            subscribe() {
              return mockStream(10, true, (b) => b)
            },
            resolve: (event) => {
              return event
            },
          })
          t.id('someID', {
            subscribe() {
              return mockStream(10, 'abc', (id) => id)
            },
            resolve: (event) => {
              return event
            },
          })
        },
      }),
    ],
    outputs: false,
  })

  expect(GQL.printSchema(GQL.lexicographicSortSchema(schema)).trim()).toMatchInlineSnapshot(`
    "type Query {
      ok: Boolean!
    }

    type Subscription {
      someBoolean: Boolean
      someField: Int
      someField2: Int
      someFields: [Int]
      someFloat: Float
      someID: ID
      someInt: Int
      someInts: [Int]
      someString: String
    }"
  `)

  expect(
    await Promise.all([
      subscribe(
        schema,
        `
          subscription {
            someField
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someField2
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someInt
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someString
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someBoolean
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someFloat
          }
        `
      ).then(take(3)),
      subscribe(
        schema,
        `
          subscription {
            someID
          }
        `
      ).then(take(3)),
    ])
  ).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "someField": -1,
          },
        },
        Object {
          "data": Object {
            "someField": -2,
          },
        },
        Object {
          "data": Object {
            "someField": -3,
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someField2": -1,
          },
        },
        Object {
          "data": Object {
            "someField2": -2,
          },
        },
        Object {
          "data": Object {
            "someField2": -3,
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someInt": 1,
          },
        },
        Object {
          "data": Object {
            "someInt": 2,
          },
        },
        Object {
          "data": Object {
            "someInt": 3,
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someString": "!",
          },
        },
        Object {
          "data": Object {
            "someString": "!!",
          },
        },
        Object {
          "data": Object {
            "someString": "!!!",
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someBoolean": true,
          },
        },
        Object {
          "data": Object {
            "someBoolean": true,
          },
        },
        Object {
          "data": Object {
            "someBoolean": true,
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someFloat": 0.5,
          },
        },
        Object {
          "data": Object {
            "someFloat": 0.5,
          },
        },
        Object {
          "data": Object {
            "someFloat": 0.5,
          },
        },
      ],
      Array [
        Object {
          "data": Object {
            "someID": "abc",
          },
        },
        Object {
          "data": Object {
            "someID": "abc",
          },
        },
        Object {
          "data": Object {
            "someID": "abc",
          },
        },
      ],
    ]
  `)
})

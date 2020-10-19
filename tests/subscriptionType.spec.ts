import * as GQL from 'graphql'
import { makeSchema, subscriptionType } from '../src/core'
import { mockStream, subscribe, take } from './_helpers'

it('defines a field on the mutation type as shorthand', async () => {
  const schema = makeSchema({
    types: [
      subscriptionType({
        definition(t) {
          //todo .list case
          t.field('someField', {
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

  expect(GQL.printSchema(schema)).toMatchInlineSnapshot(`
    "type Subscription {
      someField: Int
      someInt: Int
      someString: String
      someFloat: Float
      someBoolean: Boolean
      someID: ID
    }

    type Query {
      ok: Boolean!
    }
    "
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

import * as GQL from 'graphql'
import { makeSchema, subscriptionType } from '../src/core'
import { mockStream, subscribe, take } from './_helpers'

it('defines a field on the mutation type as shorthand', async () => {
  const schema = makeSchema({
    types: [
      subscriptionType({
        definition(t) {
          t.field('someField', {
            type: 'Int',
            subscribe() {
              return mockStream(10, 0, (n) => n + 1)
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
    "type Query {
      ok: Boolean!
    }

    type Subscription {
      someField: Int!
    }
    "
  `)

  expect(
    await subscribe(
      schema,
      `
        subscription {
          someField
        }
      `
    ).then(take(3))
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "data": Object {
          "someField": 1,
        },
      },
      Object {
        "data": Object {
          "someField": 2,
        },
      },
      Object {
        "data": Object {
          "someField": 3,
        },
      },
    ]
  `)
})

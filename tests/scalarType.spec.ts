import { graphql } from 'graphql'
import { GraphQLDate, GraphQLDateTime } from 'graphql-iso-date'
import { asNexusMethod, inputObjectType, makeSchema, objectType, queryField } from '../src/core'

describe('scalarType', () => {
  it('asNexusMethod: should wrap a scalar and make it available on the builder', async () => {
    const schema = makeSchema({
      types: [
        asNexusMethod(GraphQLDateTime, 'dateTime'),
        asNexusMethod(GraphQLDate, 'date'),
        objectType({
          name: 'User',
          definition(t) {
            t.id('id')
            // @ts-ignore
            t.dateTime('dateTimeField')
          },
        }),
        queryField('user', {
          type: 'User',
          args: {
            input: inputObjectType({
              name: 'SomeInput',
              definition(t) {
                // @ts-ignore
                t.date('date', { required: true })
              },
            }).asArg({ required: true }),
          },
          resolve: (root, args) => ({
            id: `User:1`,
            dateTimeField: args.input.date,
          }),
        }),
      ],
      outputs: false,
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql(
        schema,
        `
          {
            user(input: { date: "2020-01-01" }) {
              id
              dateTimeField
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
})

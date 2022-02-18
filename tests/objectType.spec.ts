import { graphql } from 'graphql'
import { makeSchema, objectType, queryField } from '../src/core'

describe('objectType', () => {
  it('builds creates an object type', async () => {
    const schema = makeSchema({
      types: [
        objectType({
          name: 'User',
          definition(t) {
            t.id('id')
            t.string('name')
            t.float('floatField')
          },
        }),
        queryField('user', {
          type: 'User',
          resolve: () => ({
            id: `User:1`,
            name: 'Test User',
            floatField: 123.4,
          }),
        }),
      ],
      outputs: false,
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql({
        schema,
        source: `
          {
            user {
              id
              name
              floatField
            }
          }
        `,
      })
    ).toMatchSnapshot()
  })
})

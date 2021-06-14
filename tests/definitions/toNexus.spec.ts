import { graphql } from 'graphql'
import { makeSchema, objectType, queryField } from '../../src'
import { TO_NEXUS } from '../../src/core'

class User {
  id() {
    return 'User:1'
  }

  ok() {
    return true
  }

  static [TO_NEXUS]() {
    return [
      objectType({
        name: 'User',
        definition(t) {
          t.id('id')
          t.boolean('ok')
        },
      }),
      queryField('user', () => ({
        type: 'User',
        resolve: () => new User(),
      })),
    ]
  }
}

describe('toNexus', () => {
  test('toNexus', async () => {
    const schema = makeSchema({
      types: [User, User], // Shouldn't be an issue importing twice
      outputs: {
        schema: false,
        typegen: false,
      },
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql(
        schema,
        `
          query UserToNexus {
            user {
              id
              ok
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
})

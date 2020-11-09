import { graphql } from 'graphql'
import path from 'path'
import { makeSchema, objectType, queryField, unionType } from '../src'

describe('unionType', () => {
  test('unionType', async () => {
    const schema = makeSchema({
      features: { abstractTypes: { resolveType: true } },
      types: [
        objectType({
          name: 'DeletedUser',
          definition(t) {
            t.string('message', { resolve: (root) => `This user ${root.id} was deleted` })
          },
          rootTyping: `{ id: number; deletedAt: Date }`,
        }),
        objectType({
          name: 'User',
          definition(t) {
            t.int('id')
            t.string('name')
          },
          rootTyping: `{ id: number; name: string; deletedAt?: null }`,
        }),
        unionType({
          name: 'UserOrError',
          resolveType(o) {
            return o.deletedAt ? 'DeletedUser' : 'User'
          },
          definition(t) {
            t.members('User', 'DeletedUser')
          },
        }),
        queryField('userTest', {
          type: 'UserOrError',
          resolve: () => ({ id: 1, name: 'Test User' }),
        }),
        queryField('deletedUserTest', {
          type: 'UserOrError',
          resolve: () => ({
            id: 1,
            name: 'Test User',
            deletedAt: new Date('2019-01-01'),
          }),
        }),
      ],
      outputs: {
        schema: path.join(__dirname, 'unionTypeTest.graphql'),
        typegen: false,
      },
      shouldGenerateArtifacts: false,
    })
    expect(
      await graphql(
        schema,
        `
          fragment UserOrErrorFields on UserOrError {
            __typename
            ... on User {
              id
              name
            }
            ... on DeletedUser {
              message
            }
          }
          query UserOrErrorTest {
            userTest {
              ...UserOrErrorFields
            }
            deletedUserTest {
              ...UserOrErrorFields
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
})

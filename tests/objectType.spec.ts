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
      await graphql(
        schema,
        `
          {
            user {
              id
              name
              floatField
            }
          }
        `
      )
    ).toMatchSnapshot()
  })

  it('throws when chaining .list twice', () => {
    expect(() => {
      makeSchema({
        types: [
          objectType({
            name: 'throwingList',
            definition(t) {
              t.list.list.id('id')
            },
          }),
        ],
        outputs: false,
        shouldGenerateArtifacts: false,
      })
    }).toThrowErrorMatchingSnapshot()
  })

  it('warns when specifying .list and list: true', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation()
    makeSchema({
      outputs: false,

      types: [
        objectType({
          name: 'throwingList',
          definition(t) {
            t.list.field('someField', {
              list: true,
              type: 'Boolean',
            })
          },
        }),
      ],
      shouldGenerateArtifacts: false,
    })
    expect(spy.mock.calls[0]).toMatchSnapshot()
    expect(spy).toBeCalledTimes(1)
    spy.mockRestore()
  })

  it('throws when modifyType is used', () => {
    expect(() => {
      makeSchema({
        outputs: false,
        types: [
          objectType({
            name: 'testing',
            definition(t) {
              t.modify('someField', {})
            },
          }),
        ],
      })
    }).toThrowErrorMatchingSnapshot()
  })
})

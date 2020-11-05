import { graphql } from 'graphql'
import { inputObjectType, list, makeSchema, objectType, queryField } from '../src/core'

describe('inputObject', () => {
  it('builds creates an inputObject type', async () => {
    const schema = makeSchema({
      types: [
        inputObjectType({
          name: 'InputObj',
          definition(t) {
            t.id('idInput')
            t.boolean('boolInput')
            t.float('floatInput')
            t.int('intInput')
            t.field('inlineField', {
              type: inputObjectType({
                name: 'InlineFiedExample',
                definition(t) {
                  t.boolean('ok')
                },
              }),
            })
          },
        }),
        objectType({
          name: 'User',
          definition(t) {
            t.id('id', {
              args: {
                input: 'InputObj',
              },
            })
          },
        }),
        queryField('user', {
          type: 'User',
          resolve: () => ({
            id: `User:1`,
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
            user(input: { boolInput: true, floatInput: 123.4, intInput: 1 }) {
              id
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
          inputObjectType({
            name: 'throwingListInput',
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
      types: [
        inputObjectType({
          name: 'throwingList',
          definition(t) {
            t.list.field('someField', {
              type: list('Boolean'),
            })
          },
        }),
      ],
      outputs: false,
      shouldGenerateArtifacts: false,
    })
    expect(spy.mock.calls[0]).toMatchSnapshot()
    expect(spy).toBeCalledTimes(1)
    spy.mockRestore()
  })

  it('has asArg for using one-off inputObjects inline', async () => {
    const schema = makeSchema({
      types: [
        objectType({
          name: 'User',
          definition(t) {
            t.id('id', {
              args: {
                input: inputObjectType({
                  name: 'InputObj',
                  definition(t) {
                    t.id('idInput')
                    t.boolean('boolInput')
                    t.float('floatInput')
                    t.int('intInput')
                  },
                }).asArg({ default: { idInput: 1 } }),
              },
            })
          },
        }),
        queryField('user', {
          type: 'User',
          resolve: () => ({
            id: `User:1`,
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
            user(input: { boolInput: true, floatInput: 123.4, intInput: 1 }) {
              id
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
})

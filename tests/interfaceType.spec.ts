import { graphql } from 'graphql'
import path from 'path'
import { DateTimeResolver } from 'graphql-scalars'
import { generateSchema, interfaceType, makeSchema, objectType, queryField, asNexusMethod } from '../src/core'

describe('interfaceType', () => {
  it('can be implemented by object types', async () => {
    const schema = makeSchema({
      types: [
        interfaceType({
          name: 'Node',
          definition(t) {
            t.id('id')
            // @ts-ignore
            t.dateTime('createdAt')
          },
          resolveType: () => null,
        }),
        asNexusMethod(DateTimeResolver, 'dateTime'),
        objectType({
          name: 'User',
          isTypeOf(data) {
            return typeof data.name === 'string'
          },
          definition(t) {
            t.implements('Node')
            t.string('name')
          },
        }),
        queryField('user', {
          type: 'User',
          resolve: () => ({ id: `User:1`, name: 'Test User' }),
        }),
      ],
      outputs: {
        schema: path.join(__dirname, 'interfaceTypeTest.graphql'),
        typegen: false,
      },
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
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
  it('can extend other interfaces', async () => {
    const schema = makeSchema({
      types: [
        interfaceType({
          name: 'LivingOrganism',
          definition(t) {
            t.string('type')
          },
        }),
        interfaceType({
          name: 'Animal',
          definition(t) {
            t.implements('LivingOrganism')
            t.string('classification')
          },
        }),
        interfaceType({
          name: 'Pet',
          definition(t) {
            t.implements('Animal')
            t.string('owner')
          },
        }),
        objectType({
          name: 'Dog',
          isTypeOf(data) {
            return typeof data.breed === 'string'
          },
          definition(t) {
            t.implements('Pet')
            t.string('breed')
          },
        }),
        queryField('dog', {
          type: 'Dog',
          resolve: () => ({
            type: 'Animal',
            classification: 'Canis familiaris',
            owner: 'Mark',
            breed: 'Puli',
          }),
        }),
      ],
      outputs: {
        schema: path.join(__dirname, 'interfaceTypeTest.graphql'),
        typegen: false,
      },
      shouldGenerateArtifacts: false,
      features: {
        abstractTypeStrategies: {
          resolveType: false,
          isTypeOf: true,
        },
      },
    })
    expect(
      await graphql(
        schema,
        `
          {
            dog {
              type
              classification
              owner
              breed
            }
          }
        `
      )
    ).toMatchSnapshot()
  })
  it('can not implement itself', async () => {
    expect(() =>
      makeSchema({
        types: [
          interfaceType({
            name: 'Node',
            definition(t) {
              t.id('id')
              t.implements('Node')
            },
          }),
        ],
        outputs: false,
        shouldGenerateArtifacts: false,
      })
    ).toThrowErrorMatchingSnapshot()
  })
  it('deduplicates interfaces implementing interfaces', async () => {
    if (require('graphql/package.json').version.startsWith('14')) {
      return
    }

    const { schemaTypes } = await generateSchema.withArtifacts(
      {
        types: [
          interfaceType({
            name: 'Node',
            resolveType() {
              return null
            },
            definition(t) {
              t.id('id')
            },
          }),
          interfaceType({
            name: 'Node2',
            resolveType() {
              return null
            },
            definition(t) {
              t.implements('Node')
              t.id('id2')
            },
          }),
          objectType({
            name: 'Foo',
            isTypeOf() {
              return true
            },
            definition(t) {
              t.implements('Node2', 'Node')
            },
          }),
        ],
        outputs: false,
      },
      null
    )
    expect(schemaTypes).toMatchSnapshot()
  })
  it('detects circular dependencies', async () => {
    expect(() =>
      makeSchema({
        types: [
          interfaceType({
            name: 'NodeA',
            definition(t) {
              t.id('a')
              t.implements('NodeC')
            },
          }),
          interfaceType({
            name: 'NodeB',
            definition(t) {
              t.id('b')
              t.implements('NodeA')
            },
          }),
          interfaceType({
            name: 'NodeC',
            definition(t) {
              t.id('c')
              t.implements('NodeB')
            },
          }),
        ],
        outputs: false,
        shouldGenerateArtifacts: false,
      })
    ).toThrowErrorMatchingSnapshot()
  })
  it('logs error when resolveType is not provided for an interface', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    makeSchema({
      types: [
        interfaceType({
          name: 'Node',
          definition(t) {
            t.id('id')
          },
        }),
      ],
      outputs: false,
      shouldGenerateArtifacts: false,
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    expect(spy.mock.calls[0]).toMatchSnapshot()
    expect(spy).toBeCalledTimes(1)
    spy.mockRestore()
  })
})

import { graphql } from 'graphql'
import {
  idArg,
  interfaceType,
  makeSchema,
  NexusGraphQLSchema,
  nonNull,
  objectType,
  queryField,
  stringArg,
} from '../src/core'

describe('modify', () => {
  let schema: NexusGraphQLSchema

  beforeAll(() => {
    schema = makeSchema({
      types: [
        interfaceType({
          name: 'Node',
          definition(t) {
            t.id('id', {
              description: 'Some Node ID Description',
              resolve: () => {
                throw new Error('Abstract')
              },
            })
            t.field('subNode', {
              type: 'Node',
            })
            t.string('requiredInSubtype')
          },
          resolveType: (o) => o.__typename,
        }),
        objectType({
          name: 'User',
          definition(t) {
            t.implements('Node')
            t.modify('id', {
              description: 'Some User ID Description',
              resolve: (root) => `User:${root.id}`,
            })
            t.field('subNode', {
              type: 'User',
            })
            t.modify('requiredInSubtype', {
              type: nonNull('String'),
            })
          },
        }),
        objectType({
          name: 'Throws',
          definition(t) {
            t.implements('Node')
          },
        }),
        objectType({
          name: 'AddArg',
          definition(t) {
            t.implements('Node')
            t.modify('id', {
              args: { someArg: stringArg() },
              resolve: (root, args) => args.someArg ?? `AddArg:${root.id}`,
            })
          },
        }),
        queryField('node', {
          type: 'Node',
          args: {
            id: nonNull(idArg()),
          },
          resolve: (root, args) => {
            const [__typename, id] = args.id.split(':')
            return { __typename, id }
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
  })

  it('can modify an existing interface field description', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          node: __type(name: "Node") {
            fields {
              name
              description
            }
          }
          user: __type(name: "User") {
            fields {
              name
              description
            }
          }
        }
      `,
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.node.fields.find((f: { name: string }) => f.name === 'id').description).toEqual(
      'Some Node ID Description'
    )
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.user.fields.find((f: { name: string }) => f.name === 'id').description).toEqual(
      'Some User ID Description'
    )
  })

  it('can modify an existing interface field resolve', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          user: node(id: "User:1") {
            id
          }
          throws: node(id: "Throws:1") {
            id
          }
        }
      `,
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.user.id).toEqual('User:1')
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.throws.id).toEqual(null)
    expect(result.errors?.[0].message).toEqual('Abstract')
  })

  it('can add additional field args to an interface field', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          withArg: node(id: "AddArg:1") {
            ... on AddArg {
              id(someArg: "SomeArg!")
            }
          }
          withoutArg: node(id: "AddArg:1") {
            ... on AddArg {
              id
            }
          }
        }
      `,
    })

    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.withArg.id).toEqual('SomeArg!')
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.withoutArg.id).toEqual('AddArg:1')
  })

  it('can replace an abstract type field inherited from an interface', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          node: __type(name: "Node") {
            fields {
              name
              description
              type {
                name
              }
            }
          }
          user: __type(name: "User") {
            fields {
              name
              description
              type {
                name
              }
            }
          }
        }
      `,
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.node.fields.find((f: { name: string }) => f.name === 'subNode').type.name).toEqual(
      'Node'
    )
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.user.fields.find((f: { name: string }) => f.name === 'subNode').type.name).toEqual(
      'User'
    )
  })

  it('can modify nullability of an abstract type field inherited from an interface', async () => {
    const result = await graphql({
      schema,
      source: `
        {
          node: __type(name: "Node") {
            fields {
              name
              description
              type {
                name
              }
            }
          }
          user: __type(name: "User") {
            fields {
              name
              description
              type {
                kind
                ofType {
                  name
                }
              }
            }
          }
        }
      `,
    })

    expect(
      // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
      result.data?.node.fields.find((f: { name: string }) => f.name === 'requiredInSubtype').type.name
    ).toEqual('String')
    expect(
      // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
      result.data?.user.fields.find((f: { name: string }) => f.name === 'requiredInSubtype').type.kind
    ).toEqual('NON_NULL')
    expect(
      // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
      result.data?.user.fields.find((f: { name: string }) => f.name === 'requiredInSubtype').type.ofType.name
    ).toEqual('String')
  })
})

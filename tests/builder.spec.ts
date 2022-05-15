import {
  buildSchema,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLString,
  lexicographicSortSchema,
  printSchema,
  printType,
} from 'graphql'
import {
  extendType,
  interfaceType,
  makeSchema,
  mutationType,
  objectType,
  queryField,
  queryType,
} from '../src'

describe('builder', () => {
  it('can replace the Query root type with an alternate type', () => {
    const OtherQuery = objectType({
      name: 'RootQuery',
      definition(t) {
        t.string('name')
      },
    })

    const Query = objectType({
      name: 'Query',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherQuery, Query],
      schemaRoots: {
        query: OtherQuery,
      },
    })
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })

  it('does not add a placeholder Query type when an alternate queryRoot has been defined', () => {
    const OtherQuery = objectType({
      name: 'RootQuery',
      definition(t) {
        t.string('name')
      },
    })

    const schema = makeSchema({
      types: [OtherQuery],
      schemaRoots: {
        query: OtherQuery,
      },
    })
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })

  it('can replace the Mutation root type with an alternate type', () => {
    const OtherMutation = objectType({
      name: 'RootMutation',
      definition(t) {
        t.string('name')
      },
    })

    const Mutation = objectType({
      name: 'Mutation',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherMutation, Mutation],
      schemaRoots: {
        mutation: OtherMutation,
      },
    })
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })

  it('can replace the Subscription root type with an alternate type', () => {
    const OtherSubscription = objectType({
      name: 'RootSubscription',
      definition(t) {
        t.string('name')
      },
    })

    const Subscription = objectType({
      name: 'Subscription',
      definition(t) {
        t.string('ok')
      },
    })

    const schema = makeSchema({
      types: [OtherSubscription, Subscription],
      schemaRoots: {
        subscription: OtherSubscription,
      },
    })
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })
})

describe('builder.mergeSchema', () => {
  function gql(args: TemplateStringsArray) {
    return args.join('')
  }

  const SDL = gql`
    interface Node {
      id: ID!
    }

    interface ExternalNode {
      id: ID!
    }

    type InternalType {
      fieldName: String
    }

    type User implements Node & ExternalNode {
      id: ID!
      name: String
    }

    type Book implements Node {
      id: ID!
      name: String
    }

    scalar UUID

    type Query {
      node(id: ID!): Node
      internalNodesByIds(ids: [ID!]!, internal: String!): [Node]!
      userByUuids(uuid: UUID): User
    }
  `

  const schema = buildSchema(SDL)

  const node = interfaceType({
    name: 'Node',
    definition(t) {
      t.nonNull.id('id', {
        description: 'A Node ID is globally unique',
      })
    },
    resolveType() {
      return 'User'
    },
  })

  const Author = objectType({
    name: 'Author',
    definition(t) {
      t.implements('Node')
      t.list.field('books', {
        type: 'Book',
      })
    },
  })

  const someBook = queryField('someBook', {
    type: 'Book',
    resolve() {
      return {
        id: 'Book:1',
        name: 'Slaughterhouse Five',
      }
    },
  })

  it('can merge with an externally created schema', () => {
    const finalSchema = makeSchema({
      types: [node, someBook, Author],
      mergeSchema: {
        schema,
      },
    })
    expect(printSchema(lexicographicSortSchema(finalSchema)).trim()).toMatchSnapshot()
  })

  it('can exclude types from the output schema', () => {
    const finalSchema = makeSchema({
      types: [node],
      mergeSchema: {
        schema,
        skipTypes: ['InternalType'],
      },
    })
    expect(finalSchema.getType('InternalType')).toBeUndefined()
  })

  it('can exclude fields from the output schema', () => {
    const finalSchema = makeSchema({
      types: [node],
      mergeSchema: {
        schema,
        skipFields: {
          Query: ['internalNodesByIds'],
        },
      },
    })
    const type = finalSchema.getType('Query') as GraphQLObjectType
    expect(type.getFields()['internalNodesByIds']).toBeUndefined()
  })

  it('can exclude args from the output fields', () => {
    const finalSchema = makeSchema({
      types: [node],
      mergeSchema: {
        schema,
        skipArgs: {
          Query: {
            internalNodesByIds: ['internal'],
          },
        },
      },
    })
    const type = finalSchema.getType('Query') as GraphQLObjectType
    expect(type.getFields()['internalNodesByIds']?.args.find((a) => a.name === 'internal')).toBeUndefined()
  })

  it('can merge with local types', () => {
    const LocalUser = objectType({
      name: 'User',
      definition(t) {
        t.string('localName')
      },
    })
    const unmerged = makeSchema({
      types: [LocalUser],
      mergeSchema: {
        schema,
      },
    })
    expect(printType(unmerged.getType('User') as GraphQLNamedType)).toMatchSnapshot('unmerged')

    const merged = makeSchema({
      types: [LocalUser],
      mergeSchema: {
        schema,
        mergeTypes: ['User'],
      },
    })

    expect(printType(merged.getType('User') as GraphQLNamedType)).toMatchSnapshot('merged')
  })

  it('Merges Mutation & Query types by default', () => {
    const sdl = gql`
      type Query {
        externalFn(a: String): String
      }

      type Mutation {
        externalMutation(a: String): String
      }
    `

    const localQuery = queryType({
      definition(t) {
        t.string('localFn')
      },
    })

    const localMutation = mutationType({
      definition(t) {
        t.string('localMutation')
      },
    })

    const merged = makeSchema({
      types: [localQuery, localMutation],
      mergeSchema: {
        schema: buildSchema(sdl),
      },
    })

    expect(printType(merged.getType('Query') as GraphQLNamedType)).toMatchSnapshot('merged query')
    expect(printType(merged.getType('Mutation') as GraphQLNamedType)).toMatchSnapshot('merged mutation')

    const unmerged = makeSchema({
      types: [localQuery, localMutation],
      mergeSchema: {
        schema: buildSchema(sdl),
        mergeTypes: [],
      },
    })

    expect(printType(unmerged.getType('Query') as GraphQLNamedType)).toMatchSnapshot('unmerged query')
    expect(printType(unmerged.getType('Mutation') as GraphQLNamedType)).toMatchSnapshot('unmerged mutation')
  })
})

describe('graphql-js interop', () => {
  it('extend types works with GraphQLNamedType (#88)', () => {
    const Viewer = new GraphQLObjectType({
      name: 'Viewer',
      fields: {
        name: { type: GraphQLString },
      },
    })

    // Using extendType to extend types defined with `graphql`
    const NexusViewer = extendType({
      type: 'Viewer',
      definition(t) {
        t.int('age')
      },
    })

    const Query = new GraphQLObjectType({
      name: 'Query',
      fields: () => ({
        viewer: { type: Viewer },
      }),
    })

    const schema = makeSchema({
      types: [Query, NexusViewer],
    })

    expect(printSchema(schema).trim()).toMatchSnapshot()
  })
})

import { buildSchema, GraphQLField, GraphQLInterfaceType, GraphQLObjectType } from 'graphql'
import * as path from 'path'
import { core } from '../src'
import { typegenFormatPrettier } from '../src/core'
import { EXAMPLE_SDL } from './_sdl'

const { makeSchema, TypegenPrinter, TypegenMetadata } = core

describe('typegenPrinter', () => {
  let typegen: core.TypegenPrinter
  let metadata: core.TypegenMetadata
  beforeEach(async () => {
    const writeFileSpy = jest.spyOn(TypegenMetadata.prototype, 'writeFile')

    const schema = makeSchema({
      outputs: {
        typegen: path.join(__dirname, 'typegen/types.gen.ts'),
        schema: path.join(__dirname, 'typegen/schema.gen.graphql'),
      },
      shouldGenerateArtifacts: true,
      types: [buildSchema(EXAMPLE_SDL)],
      // __typename put to true to prevent from erroring because of missing resolveType
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
      async formatTypegen(source, type) {
        const prettierConfigPath = require.resolve('../.prettierrc')
        const content = await typegenFormatPrettier(prettierConfigPath)(source, type)

        return content.replace("'@nexus/schema'", `'../../src'`)
      },
    }) as core.NexusGraphQLSchema

    metadata = new TypegenMetadata({
      outputs: {
        typegen: path.join(__dirname, 'test-gen.ts'),
        schema: path.join(__dirname, 'test-gen.graphql'),
      },
      typegenAutoConfig: {
        backingTypeMap: {
          UUID: 'string',
        },
        sources: [
          {
            alias: 't',
            source: path.join(__dirname, '__helpers/index.ts'),
          },
        ],
      },
      contextType: {
        module: path.join(__dirname, '__helpers/index.ts'),
        export: 'TestContext',
      },
    })

    while (!writeFileSpy.mock.results.length) {
      await new Promise((res) => setTimeout(res, 10))
    }

    // wait for artifact generation to complete
    await writeFileSpy.mock.results[0].value

    const typegenInfo = await metadata.getTypegenInfo(schema)
    typegen = new TypegenPrinter(metadata.sortSchema(schema), {
      ...typegenInfo,
      typegenPath: '',
    })
    jest
      .spyOn(typegen, 'hasResolver')
      .mockImplementation((field: GraphQLField<any, any>, type: GraphQLObjectType | GraphQLInterfaceType) => {
        if (type.name === 'Query' || type.name === 'Mutation') {
          return true
        }
        return false
      })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('builds the enum object type defs', () => {
    expect(typegen.printEnumTypeMap()).toMatchSnapshot()
  })

  it('builds the input object type defs', () => {
    expect(typegen.printInputTypeMap()).toMatchSnapshot()
  })

  it('should build an argument type map', () => {
    expect(typegen.printArgTypeMap()).toMatchSnapshot()
  })

  it('should print a object type map', () => {
    expect(typegen.printObjectTypeMap()).toMatchSnapshot()
  })

  it('should print a interface type map', () => {
    expect(typegen.printInterfaceTypeMap()).toMatchSnapshot()
  })

  it('should print a union type map', () => {
    expect(typegen.printUnionTypeMap()).toMatchSnapshot()
  })

  it('should print a root type map', () => {
    expect(typegen.printRootTypeDef()).toMatchSnapshot()
  })

  it('should not print roots for fields with resolvers', () => {
    // If we don't have a dedicated "root type", then we need to infer
    // what the return type should be based on the shape of the object
    // If the field has a resolver, we assume it's derived, otherwise
    // you'll need to supply a backing root type with more information.
    jest
      .spyOn(typegen, 'hasResolver')
      .mockImplementation((field: GraphQLField<any, any>, type: GraphQLObjectType | GraphQLInterfaceType) => {
        if (type.name === 'Query' || type.name === 'Mutation') {
          return true
        }
        if (type.name === 'User' && field.name === 'posts') {
          return true
        }
        return false
      })
    expect(typegen.printObjectTypeMap()).toMatchSnapshot()
    expect(typegen.printRootTypeDef()).toMatchSnapshot()
  })

  it('should print a return type map', () => {
    expect(typegen.printFieldTypesMap()).toMatchSnapshot()
  })

  it('should print the full output', () => {
    expect(typegen.print()).toMatchSnapshot()
  })
})

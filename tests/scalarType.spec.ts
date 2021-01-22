import { graphql } from 'graphql'
import { GraphQLDate, GraphQLDateTime } from 'graphql-scalars'
import {
  asNexusMethod,
  inputObjectType,
  makeSchema,
  makeSchemaInternal,
  objectType,
  queryField,
  resolveTypegenConfig,
  scalarType,
} from '../src/core'
import { TypegenMetadata } from '../src/typegenMetadata'

describe('scalarType', () => {
  it('asNexusMethod: may specify the TS type of the scalar', async () => {
    const schema = makeSchemaInternal({
      types: [asNexusMethod(GraphQLDate, 'date', 'Int')],
      outputs: false,
      shouldExitAfterGenerateArtifacts: false,
    })
    const generator = new TypegenMetadata(resolveTypegenConfig(schema.finalConfig))
    const typegen = await generator.generateTypesFile(schema.schema, 'foo.ts')
    expect(typegen).toMatch(/Date: Int/)
  })
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
                t.date('date')
              },
            }).asArg(),
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

  it('sourceTyping: allows importing a node module for the typing path', async () => {
    const schema = makeSchemaInternal({
      types: [
        scalarType({
          name: 'TestScalar',
          sourceType: {
            module: 'graphql',
            export: 'GraphQLScalar',
          },
          serialize() {},
        }),
      ],
      outputs: false,
      shouldExitAfterGenerateArtifacts: false,
    })
    const generator = new TypegenMetadata(resolveTypegenConfig(schema.finalConfig))
    const typegen = await generator.generateTypesFile(schema.schema, 'foo.ts')
    expect(typegen).toMatch(/import { GraphQLScalar } from \"graphql\"/)
  })

  it('can override the backing type for known scalars', async () => {
    const schema = makeSchemaInternal({
      types: [
        objectType({
          name: 'Test',
          definition(t) {
            t.id('id')
          },
        }),
      ],
      outputs: false,
      shouldExitAfterGenerateArtifacts: false,
      sourceTypes: {
        modules: [],
        mapping: {
          ID: 'unknown',
        },
      },
    })
    const generator = new TypegenMetadata(resolveTypegenConfig(schema.finalConfig))
    const typegen = await generator.generateTypesFile(schema.schema, 'foo.ts')
    expect(typegen).toMatch(/id\?\: unknown | null; \/\/ ID/)
    expect(typegen).toMatch(/ID: unknown/)
  })
})

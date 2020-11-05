import { GraphQLDateTime } from 'graphql-scalars'
import path from 'path'
import {
  decorateType,
  dynamicInputMethod,
  dynamicOutputMethod,
  inputObjectType,
  makeSchema,
  objectType,
} from '../src'
import { dynamicOutputProperty } from '../src/dynamicProperty'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('dynamicOutputMethod', () => {
  it('should provide a method on the output type builder', async () => {
    makeSchema({
      types: [
        dynamicOutputMethod({
          name: 'foo',
          typeDefinition: 'String',
          factory({ typeDef }) {
            typeDef.field('viaFoo', { type: 'Int' })
          },
        }),
        objectType({
          name: 'Bar',
          definition(t) {
            //@ts-expect-error
            t.foo()
          },
        }),
      ],
      outputs: {
        typegen: path.join(__dirname, 'test-output.ts'),
        schema: path.join(__dirname, 'schema.graphql'),
      },
      shouldGenerateArtifacts: false,
    })
  })
})

describe('dynamicInputMethod', () => {
  it('should provide a method on the input definition', async () => {
    makeSchema({
      types: [
        decorateType(GraphQLDateTime, {
          rootTyping: 'Date',
        }),
        inputObjectType({
          name: 'SomeInput',
          definition(t) {
            t.id('id')
            //@ts-expect-error
            t.timestamps()
          },
        }),
        dynamicInputMethod({
          name: 'timestamps',
          factory({ typeDef }) {
            typeDef.field('createdAt', { type: 'DateTime' })
            typeDef.field('updatedAt', { type: 'DateTime' })
          },
        }),
      ],
      outputs: {
        typegen: path.join(__dirname, 'test-output.ts'),
        schema: path.join(__dirname, 'schema.graphql'),
      },
      shouldGenerateArtifacts: false,
    })
  })
})

describe('dynamicOutputProperty', () => {
  it('should provide a way for adding a chainable api on the output definition', async () => {
    makeSchema({
      types: [
        decorateType(GraphQLDateTime, {
          rootTyping: 'Date',
        }),
        objectType({
          name: 'DynamicPropObject',
          definition(t) {
            t.id('id')
            // @ts-ignore
            t.model.timestamps()
          },
        }),
        dynamicOutputProperty({
          name: 'model',
          factory({ typeDef }) {
            return {
              timestamps() {
                typeDef.field('createdAt', { type: 'DateTime' })
                typeDef.field('updatedAt', { type: 'DateTime' })
              },
            }
          },
        }),
      ],
      outputs: {
        typegen: path.join(__dirname, 'test-output.ts'),
        schema: path.join(__dirname, 'schema.graphql'),
      },
      shouldGenerateArtifacts: false,
    })
  })
})

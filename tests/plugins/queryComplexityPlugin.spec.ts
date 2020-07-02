import { GraphQLObjectType } from 'graphql'
import path from 'path'
import { makeSchema, objectType, queryComplexityPlugin, queryField } from '../../src'
import { generateSchema } from '../../src/core'

describe('queryComplexityPlugin', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  // consoleWarnSpy is not used in any tests but its here to prevent console warn
  // for the last test, which warns about specifying config value for makeSchema
  jest.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    jest.resetAllMocks()
  })

  const createTestSchema = (types?: any) => {
    return makeSchema({
      types,
      outputs: false,
      plugins: [queryComplexityPlugin()],
    })
  }

  test('complexity number should be set on field extension if defined', () => {
    const testSchema = createTestSchema([
      objectType({
        name: 'User',
        definition(t) {
          t.int('id', {
            // @ts-ignore
            complexity: 1,
          })
        },
      }),
    ])
    const user = testSchema.getType('User') as GraphQLObjectType
    const idField = user.getFields().id
    expect(idField.extensions).toHaveProperty('complexity')
    expect(idField.extensions?.complexity).toBe(1)
  })

  test('complexity estimator should be set on field extension if defined', () => {
    const estimator = () => 1
    const testSchema = createTestSchema([
      objectType({
        name: 'User',
        definition(t) {
          t.int('id', {
            // @ts-ignore
            complexity: estimator,
          })
        },
      }),
    ])
    const user = testSchema.getType('User') as GraphQLObjectType
    const idField = user.getFields().id
    expect(idField.extensions).toHaveProperty('complexity')
    expect(idField.extensions?.complexity).toBe(estimator)
  })

  test('complexity number should work on query fields too', () => {
    const testSchema = createTestSchema([
      queryField('ok', {
        type: 'Boolean',
        // @ts-ignore
        complexity: 1,
        resolve: () => true,
      }),
    ])
    const ok = testSchema.getQueryType()?.getFields().ok
    expect(ok?.extensions).toHaveProperty('complexity')
    expect(ok?.extensions?.complexity).toBe(1)
  })

  test('complexity should not be set on field extension if not defined', () => {
    const testSchema = createTestSchema([
      objectType({
        name: 'User',
        definition(t) {
          t.int('id')
        },
      }),
    ])
    const user = testSchema.getType('User') as GraphQLObjectType
    const idField = user.getFields().id
    expect(idField.extensions).not.toHaveProperty('complexity')
  })

  test('throws error if complexity is of invalid type', () => {
    const testSchema = createTestSchema([
      objectType({
        name: 'User',
        definition(t) {
          t.int('id', {
            // @ts-ignore
            complexity: 'invalid',
          })
        },
      }),
    ])
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot()
  })

  test('printing the query complexity schema', async () => {
    const result = await generateSchema.withArtifacts(
      {
        types: [
          queryField('ok', {
            type: 'Boolean',
            resolve: () => true,
          }),
        ],
        plugins: [queryComplexityPlugin()],
      },
      path.join(__dirname, 'test.gen.ts')
    )
    expect(result.tsTypes).toMatchSnapshot('Full Type Output')
  })
})

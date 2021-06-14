import { lexicographicSortSchema, printSchema } from 'graphql'
import { createPlugin, makeSchema, objectType, PluginConfig, queryType } from '../src'
import { extendType, inputObjectType, NexusAcceptedTypeDef } from '../src/core'

const fooObject = objectType({
  name: 'foo',
  definition(t) {
    t.string('bar')
  },
})

const queryField = extendType({
  type: 'Query',
  definition(t) {
    t.string('something')
  },
})

describe('runtime config validation', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  const whenGiven = (config: any) => () => createPlugin(config)

  it('checks name present', () => {
    expect(whenGiven({})).toThrowErrorMatchingSnapshot()
  })

  it('checks name is string', () => {
    expect(whenGiven({ name: 1 })).toThrowErrorMatchingSnapshot()
  })

  it('checks name is not empty', () => {
    expect(whenGiven({ name: '' })).toThrowErrorMatchingSnapshot()
  })

  it('checks onInstall is a function if defined', () => {
    whenGiven({ name: 'x', onInstall: 'foo' })()
    expect(spy).toBeCalledTimes(1)
    jest.resetAllMocks()
    whenGiven({ name: 'x', onInstall: {} })()
    expect(spy).toBeCalledTimes(1)
  })
})

describe('a plugin may', () => {
  const whenGiven = (pluginConfig: PluginConfig) => () =>
    makeSchema({
      outputs: false,
      types: [],
      plugins: [createPlugin(pluginConfig)],
    })

  it('do nothing', () => {
    expect(whenGiven({ name: 'x' }))
  })
})

describe('onInstall plugins', () => {
  const whenGiven = ({
    onInstall,
    plugin,
    appTypes,
  }: {
    onInstall?: PluginConfig['onInstall']
    plugin?: Omit<PluginConfig, 'name'>
    appTypes?: NexusAcceptedTypeDef[]
  }) => {
    const xPluginConfig = plugin || { onInstall }

    return printSchema(
      lexicographicSortSchema(
        makeSchema({
          outputs: false,
          types: appTypes || [],
          plugins: [createPlugin({ name: 'x', ...xPluginConfig })],
        })
      )
    )
  }

  it('is an optional hook', () => {
    expect(whenGiven({ plugin: {} }))
  })

  it('may return an empty array of types', () => {
    expect(whenGiven({ onInstall: () => {} }))
  })

  it('may contribute types', () => {
    expect(
      whenGiven({
        onInstall: (builder) => {
          builder.addType(queryField)
        },
      })
    ).toMatchSnapshot()
  })

  it('has access to top-level types', () => {
    expect(
      whenGiven({
        onInstall: (builder) => {
          if (!builder.hasType('foo')) {
            builder.addType(queryField)
          }
        },
        appTypes: [fooObject],
      })
    ).toMatchSnapshot()
  })

  it('does not see fallback ok-query', () => {
    expect(
      whenGiven({
        onInstall(builder) {
          if (builder.hasType('Query')) {
            builder.addType(queryField)
          }
        },
      })
    ).toMatchSnapshot()
  })

  it('does not have access to inline types', () => {
    expect(
      whenGiven({
        onInstall: (builder) => {
          if (builder.hasType('Inline')) {
            builder.addType(queryField)
          }
        },
        appTypes: [
          queryType({
            definition(t) {
              t.string('bar', {
                args: {
                  inline: inputObjectType({
                    name: 'Inline',
                    definition(t2) {
                      t2.string('hidden')
                    },
                  }),
                },
              })
            },
          }),
        ],
      })
    ).toMatchSnapshot()
  })
})

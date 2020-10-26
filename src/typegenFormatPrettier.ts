import * as path from 'path'
import type * as Prettier from 'prettier'

export type TypegenFormatFn = (content: string, type: 'types' | 'schema') => string | Promise<string>

// todo use Prettier.Options type instead of just `object`
// but will this force us to make prettier a dep then since that type would be user-visible?
export function typegenFormatPrettier(prettierConfig: string | object): TypegenFormatFn {
  return async function formatTypegen(content: string, type: 'types' | 'schema') {
    let prettier: typeof import('prettier')
    /* istanbul ignore next */
    try {
      prettier = require('prettier') as typeof import('prettier')
    } catch {
      console.warn(
        'It looks like you provided a `prettierConfig` option to GraphQL Nexus, but you do not have prettier ' +
          'installed as a dependency in your project. Please add it as a peerDependency of nexus to use this feature. ' +
          'Skipping formatting.'
      )
      return content
    }

    let prettierConfigResolved: Prettier.Options

    if (typeof prettierConfig === 'string') {
      /* istanbul ignore if */
      if (!path.isAbsolute(prettierConfig)) {
        console.error(
          new Error(`Expected prettierrc path to be absolute, saw ${prettierConfig}. Skipping formatting.`)
        )
        return content
      }
      prettierConfigResolved = (await prettier.resolveConfig('ignore_this', {
        config: prettierConfig,
      }))! // non-null assert b/c config file is explicitly passed
    } else {
      prettierConfigResolved = prettierConfig
    }

    return prettier.format(content, {
      ...prettierConfigResolved,
      parser: type === 'types' ? 'typescript' : 'graphql',
    })
  }
}

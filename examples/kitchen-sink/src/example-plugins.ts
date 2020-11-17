import { plugin, interfaceType, FieldResolver, nonNull } from '@nexus/schema'

export const logMutationTimePlugin = plugin({
  name: 'LogMutationTime',
  onCreateFieldResolver(config) {
    if (config.parentTypeConfig.name !== 'Mutation') {
      return
    }
    return async (root, args, ctx, info, next) => {
      const startTimeMs = new Date().valueOf()
      const value = await next(root, args, ctx, info)
      const endTimeMs = new Date().valueOf()
      console.log(`Mutation ${info.operation.name} took ${endTimeMs - startTimeMs} ms`)
      return value
    }
  },
})

export const NodePlugin = plugin({
  name: 'NodePlugin',
  description: 'Allows us to designate the field used to ',
  objectTypeDefTypes: `node?: string | core.FieldResolver<TypeName, any>`,
  onObjectDefinition(t, { node }) {
    if (node) {
      let resolveFn
      if (typeof node === 'string') {
        const fieldResolve: FieldResolver<any, any> = (root, args, ctx, info) => {
          return `${info.parentType.name}:${root[node]}`
        }
        resolveFn = fieldResolve
      } else {
        resolveFn = node
      }
      t.implements('Node')
      t.field('id', {
        type: nonNull('ID'),
        resolve: resolveFn,
      })
    }
  },
  onMissingType(t, _builder) {
    if (t === 'Node') {
      return interfaceType({
        name: 'Node',
        description:
          'A "Node" is an Object with a required ID field (id), per the https://relay.dev/docs/en/graphql-server-specification',
        resolveType(source) {
          if (source.__typename) {
            return source.__typename
          }

          throw new Error('__typename missing for resolving Node')
        },
        definition(t) {
          t.field('id', {
            type: nonNull('ID'),
            resolve: () => {
              throw new Error('Abstract')
            },
          })
        },
      })
    }
  },
})

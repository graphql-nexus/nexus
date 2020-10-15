import { plugin, interfaceType, FieldResolver } from '@nexus/schema'

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
      t.id('id', {
        nullable: false,
        resolve: resolveFn,
      })
    }
  },
  onMissingType(t, builder) {
    if (t === 'Node') {
      return interfaceType({
        name: 'Node',
        description:
          'A "Node" is a field with a required ID field (id), per the https://relay.dev/docs/en/graphql-server-specification',
        definition(t) {
          t.id('id', {
            nullable: false,
            resolve: () => {
              throw new Error('Abstract')
            },
          })
          t.resolveType((t) => {
            if (t.__typename) {
              return t.__typename
            }
            throw new Error('__typename missing for resolving Node')
          })
        },
      })
    }
  },
})

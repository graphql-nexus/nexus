import { GraphQLFieldResolver } from 'graphql'
import { intArg, stringArg } from '../definitions/args'
import { NexusObjectTypeDef, objectType } from '../definitions/objectType'
import { dynamicOutputMethod } from '../dynamicMethod'

const relayConnectionMap = new Map<string, NexusObjectTypeDef<string>>()

let pageInfo: NexusObjectTypeDef<string>

export const RelayConnectionFieldMethod = dynamicOutputMethod({
  name: 'relayConnectionField',
  typeDefinition: `<FieldName extends string>(fieldName: FieldName, opts: {
      type: NexusGenObjectNames | NexusGenInterfaceNames | core.NexusObjectTypeDef<any> | core.NexusInterfaceTypeDef<any>,
      edges: core.SubFieldResolver<TypeName, FieldName, "edges">,
      pageInfo: core.SubFieldResolver<TypeName, FieldName, "pageInfo">,
      args?: Record<string, core.NexusArgDef<any>>,
      nullable?: boolean,
      description?: string
    }): void
  `,
  factory({ typeDef: t, args: [fieldName, config] }) {
    /* istanbul ignore next */
    if (!config.type) {
      throw new Error(`Missing required property "type" from relayConnection field ${fieldName}`)
    }
    const typeName = typeof config.type === 'string' ? config.type : config.type.name
    pageInfo =
      pageInfo ||
      objectType({
        name: `ConnectionPageInfo`,
        definition(p) {
          p.boolean('hasNextPage')
          p.boolean('hasPreviousPage')
        },
      })
    /* istanbul ignore next */
    if (config.list) {
      throw new Error(`Collection field ${fieldName}.${typeName} cannot be used as a list.`)
    }
    if (!relayConnectionMap.has(typeName)) {
      relayConnectionMap.set(
        typeName,
        objectType({
          name: `${typeName}RelayConnection`,
          definition(c) {
            c.list.field('edges', {
              type: objectType({
                name: `${typeName}Edge`,
                definition(e) {
                  e.id('cursor')
                  e.field('node', { type: config.type })
                },
              }),
            })
            c.field('pageInfo', { type: pageInfo })
          },
        })
      )
    }
    t.field(fieldName, {
      type: relayConnectionMap.get(typeName)!,
      args: {
        first: intArg(),
        after: stringArg(),
        last: intArg(),
        before: stringArg(),
        ...config.args,
      },
      nullable: config.nullable,
      description: config.description,
      resolve(root, args, ctx, info) {
        const edgeResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.edges(root, args, ctx, fArgs[3])
        const pageInfoResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.pageInfo(root, args, ctx, fArgs[3])
        return {
          edges: edgeResolver,
          pageInfo: pageInfoResolver,
        }
      },
    })
  },
})

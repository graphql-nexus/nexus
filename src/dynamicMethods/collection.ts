import { GraphQLFieldResolver } from 'graphql'
import { intArg } from '../definitions/args'
import { NexusObjectTypeDef, objectType } from '../definitions/objectType'
import { dynamicOutputMethod } from '../dynamicMethod'

const basicCollectionMap = new Map<string, NexusObjectTypeDef<string>>()

export const CollectionFieldMethod = dynamicOutputMethod({
  name: 'collectionField',
  typeDefinition: `<FieldName extends string>(fieldName: FieldName, opts: {
      type: NexusGenObjectNames | NexusGenInterfaceNames | core.NexusObjectTypeDef<any> | core.NexusInterfaceTypeDef<any>,
      nodes: core.SubFieldResolver<TypeName, FieldName, "nodes">,
      totalCount: core.SubFieldResolver<TypeName, FieldName, "totalCount">,
      args?: core.ArgsRecord,
      nullable?: boolean,
      description?: string
    }): void;`,
  factory({ typeDef: t, args: [fieldName, config] }) {
    /* istanbul ignore next */
    if (!config.type) {
      throw new Error(`Missing required property "type" from collectionField ${fieldName}`)
    }
    const typeName = typeof config.type === 'string' ? config.type : config.type.name
    /* istanbul ignore next */
    if (config.list) {
      throw new Error(`Collection field ${fieldName}.${typeName} cannot be used as a list.`)
    }
    if (!basicCollectionMap.has(typeName)) {
      basicCollectionMap.set(
        typeName,
        objectType({
          name: `${typeName}Collection`,
          definition(c) {
            c.int('totalCount')
            c.list.field('nodes', { type: config.type })
          },
        })
      )
    }
    t.field(fieldName, {
      type: basicCollectionMap.get(typeName)!,
      args: config.args || {
        page: intArg(),
        perPage: intArg(),
      },
      nullable: config.nullable,
      description: config.description,
      resolve(root, args, ctx, info) {
        const nodesResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.nodes(root, args, ctx, fArgs[3])
        const totalCountResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.totalCount(root, args, ctx, fArgs[3])
        return {
          nodes: nodesResolver,
          totalCount: totalCountResolver,
        }
      },
    })
  },
})

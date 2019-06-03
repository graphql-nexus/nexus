import { dynamicOutputMethod } from "../dynamicMethod";
import { NexusObjectTypeDef, objectType } from "../definitions/objectType";
import { GraphQLFieldResolver } from "graphql";
import { intArg } from "../definitions/args";

const basicCollectionMap = new Map<string, NexusObjectTypeDef<string>>();

export const Collection = dynamicOutputMethod({
  name: "collection",
  typeDefinition: `<FieldName extends string>(fieldName: FieldName, opts: {
      type: NexusGenObjectNames | NexusGenInterfaceNames | core.NexusObjectTypeDef<string> | core.NexusInterfaceTypeDef<string>,
      nodes: core.SubFieldResolver<TypeName, FieldName, "nodes">,
      totalCount: core.SubFieldResolver<TypeName, FieldName, "totalCount">,
      args?: core.ArgsRecord,
      nullable?: boolean,
      description?: string
    }): void;`,
  factory({ typeDef: t, args: [fieldName, config] }) {
    const type =
      typeof config.type === "string" ? config.type : config.type.name;
    if (config.list) {
      throw new Error(
        `Collection field ${fieldName}.${type} cannot be used as a list.`
      );
    }
    if (!basicCollectionMap.has(type)) {
      basicCollectionMap.set(
        type,
        objectType({
          name: `${type}Collection`,
          definition(c) {
            c.int("totalCount");
            c.list.field("nodes", { type });
          },
        })
      );
    }
    t.field(fieldName, {
      type: basicCollectionMap.get(type)!,
      args: config.args || {
        page: intArg(),
        perPage: intArg(),
      },
      nullable: config.nullable,
      description: config.description,
      resolve(root, args, ctx, info) {
        const nodesResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.nodes(root, args, ctx, fArgs[3]);
        const totalCountResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.totalCount(root, args, ctx, fArgs[3]);
        return {
          nodes: nodesResolver,
          totalCount: totalCountResolver,
        };
      },
    });
  },
});

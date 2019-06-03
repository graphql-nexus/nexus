import { dynamicOutputMethod } from "../dynamicMethod";
import { objectType, NexusObjectTypeDef } from "../definitions/objectType";
import { GraphQLFieldResolver } from "graphql";
import { intArg, stringArg } from "../definitions/args";

const relayConnectionMap = new Map<string, NexusObjectTypeDef<string>>();

let pageInfo: NexusObjectTypeDef<string>;

export const RelayConnection = dynamicOutputMethod({
  name: "relayConnection",
  typeDefinition: `<FieldName extends string>(fieldName: FieldName, opts: {
      type: NexusGenObjectNames | NexusGenInterfaceNames | core.NexusObjectTypeDef<string> | core.NexusInterfaceTypeDef<string>,
      edges: core.SubFieldResolver<TypeName, FieldName, "edges">,
      pageInfo: core.SubFieldResolver<TypeName, FieldName, "pageInfo">,
      args?: Record<string, core.NexusArgDef<string>>,
      nullable?: boolean,
      description?: string
    }): void`,
  factory({ typeDef: t, args: [fieldName, config] }) {
    const type =
      typeof config.type === "string" ? config.type : config.type.name;
    pageInfo =
      pageInfo ||
      objectType({
        name: `ConnectionPageInfo`,
        definition(p) {
          p.boolean("hasNextPage");
          p.boolean("hasPreviousPage");
        },
      });
    if (config.list) {
      throw new Error(
        `Collection field ${fieldName}.${type} cannot be used as a list.`
      );
    }
    if (!relayConnectionMap.has(config.type)) {
      relayConnectionMap.set(
        config.type,
        objectType({
          name: `${config.type}RelayConnection`,
          definition(c) {
            c.list.field("edges", {
              type: objectType({
                name: `${config.type}Edge`,
                definition(e) {
                  e.id("cursor");
                  e.field("node", { type: config.type });
                },
              }),
            });
            c.field("pageInfo", { type: pageInfo });
          },
        })
      );
    }
    t.field(fieldName, {
      type: relayConnectionMap.get(config.type)!,
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
          config.edges(root, args, ctx, fArgs[3]);
        const pageInfoResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.pageInfo(root, args, ctx, fArgs[3]);
        return {
          edges: edgeResolver,
          pageInfo: pageInfoResolver,
        };
      },
    });
  },
});

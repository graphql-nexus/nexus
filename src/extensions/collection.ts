import { dynamicOutputField } from "../dynamicField";
import { NexusObjectTypeDef, objectType } from "../definitions/objectType";
import { GraphQLFieldResolver } from "graphql";

const basicCollectionMap = new Map<string, NexusObjectTypeDef<string>>();

export const Collection = dynamicOutputField({
  name: "collection",
  typeDefinition: `<FieldName extends string>(fieldName: FieldName, opts: {
      type: NexusGenObjectNames | NexusGenInterfaceNames | core.NexusObjectTypeDef<string> | core.NexusInterfaceTypeDef<string>,
      items: core.SubFieldResolver<TypeName, FieldName, "items">,
      totalCount: core.SubFieldResolver<TypeName, FieldName, "totalCount">,
      args?: core.ArgsRecord,
      nullable?: boolean,
      description?: string
    }): void;`,
  factory(t, config) {
    const type =
      typeof config.type === "string" ? config.type : config.type.name;
    if (config.list) {
      throw new Error(
        `Collection field ${config.fieldName}.${type} cannot be used as a list.`
      );
    }
    if (!basicCollectionMap.has(type)) {
      basicCollectionMap.set(
        type,
        objectType({
          name: `${type}Collection`,
          definition(c) {
            c.int("totalCount");
            c.list.field("items", { type: type });
          },
        })
      );
    }
    t.field(config.fieldName, {
      type: basicCollectionMap.get(type)!,
      args: config.args || {},
      nullable: config.nullable,
      description: config.description,
      resolve(root, args, ctx, info) {
        const itemsResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.items(root, args, ctx, fArgs[3]);
        const totalCountResolver: GraphQLFieldResolver<any, any> = (...fArgs) =>
          config.totalCount(root, args, ctx, fArgs[3]);
        return {
          items: itemsResolver,
          totalCount: totalCountResolver,
        };
      },
    });
  },
});

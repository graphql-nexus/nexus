import { plugin } from "../plugin";
import { dynamicOutputMethod } from "../dynamicMethod";
import { intArg, ArgsRecord } from "../definitions/args";
import { ObjectDefinitionBlock } from "../definitions/objectType";

export function base64(i: string) {
  return Buffer.from(i, "utf8").toString("base64");
}

export function unbase64(i: string) {
  return Buffer.from(i, "base64").toString("utf8");
}

export interface ConnectionFieldConfig<
  TypeName extends string,
  FieldName extends string
> {
  /**
   * Adds individual
   */
  extendEdge?: (def: ObjectDefinitionBlock<TypeName>) => void;
  /**
   * Adding additional
   */
  extendConnection?: (def: ObjectDefinitionBlock<TypeName>) => void;
}

export interface ConnectionPluginConfig {
  /**
   * @default 'connectionField'
   */
  fieldName?: string;
  /**
   * Field description
   */
  description?: string;
  /**
   * Deprecation reason
   */
  deprecated?: string;
  /**
   * Whether we want the inputs to follow the spec, or if we
   * want something different across the board
   * for instance - { input: { pageSize: intArg(), page: intArg() } }
   */
  inputs?: "spec" | ArgsRecord;
  /**
   * How we want the connection name to be named.
   * Provide this option to override.
   *
   * @default
   *
   * type Organization {
   *   members(...): UserConnection
   * }
   *
   * unless either the `inputs`, `extendEdge`, or `extendConnection`
   * are provided on the field definition - in which case:
   *
   * type Organization {
   *   members(...): OrganizationMembersUserConnection
   * }
   */
  name?: (fieldConfig: any) => string;
  /**
   * The edge type we want to return
   */
  edgeType?: (fieldConfig: any) => string;
  /**
   * Setting to true means that Nexus will automatically add the cursor
   * property for each node in the list.
   * @default true
   */
  autoCursor?: boolean;
  /**
   * Whether we want the "edges" field on the connection / need to
   * implement this in the contract.
   *
   * @default true
   */
  edges?: boolean;
  /**
   * Whether we want a "nodes" field on the connection / need to
   * implement this in the contract.
   *
   * @default false
   */
  nodes?: boolean;
  /**
   * Whether we want "pageInfo" field on the connection / need to
   * implement this in the contract.
   *
   * @default true
   */
  pageInfo?: boolean;
  /**
   * Extend *all* edges to include additional fields, beyond cursor and node
   */
  extendEdge?: Record<string, any>;
  /**
   * Any additional fields we want to make available to the connection type,
   * beyond edges and/or node
   */
  extendConnection?: Record<string, any>;
}

const defaultConfig: ConnectionPluginConfig = {
  inputs: {
    first: intArg(),
  },
};

export const connectionPlugin = (config: "spec" | ConnectionPluginConfig) => {
  const finalConfig: ConnectionPluginConfig =
    config === "spec" ? defaultConfig : config;
  return plugin({
    name: "ConnectionPlugin",
    onInstall(t) {
      // Defines the field added to the definition block:
      // t.connectionField('fieldName', {
      //   type: User
      // })
      let dynamicConfig = [];
      if (finalConfig.edges) {
        dynamicConfig.push([
          "edges",
          `SubFieldResolver<TypeName, FieldName, "edges">`,
        ]);
      }
      if (finalConfig.nodes) {
        dynamicConfig.push([
          "nodes",
          `SubFieldResolver<TypeName, FieldName, "nodes">`,
        ]);
      }
      t.addType(
        dynamicOutputMethod({
          name: finalConfig.fieldName || "connectionField",
          typeDefinition: `<FieldName extends string>(
            fieldName: FieldName, 
            config: ConnectionFieldConfig<TypeName, FieldName> & ${dynamicConfig}
          ): void`,
          factory({ typeName, typeDef: t, args: [fieldName, config] }) {
            const type = isExtended(config)
              ? `${typeName}${upperFirst(fieldName)}Connection`
              : `${typeName}Connection`;
            t.field(fieldName, {
              type,
              description: finalConfig.description,
              ...config,
              resolve(root, args, ctx, info) {},
            });
          },
        })
      );
      // TODO: Deprecate this syntax
      return { types: [] };
    },
  });
};

const isExtended = (config: ConnectionFieldConfig<any, any>) => {
  if (config.extendConnection || config.extendEdge) {
    return true;
  }
  return false;
};

const upperFirst = (fieldName: string) => {
  return fieldName
    .slice(0, 1)
    .toUpperCase()
    .concat(fieldName.slice(1));
};

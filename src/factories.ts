import * as E from "./enums";
import * as T from "./types";
import {
  isEnumType,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
  GraphQLEnumTypeConfig,
  GraphQLInterfaceTypeConfig,
  GraphQLInputObjectTypeConfig,
  GraphQLObjectTypeConfig,
  GraphQLUnionTypeConfig,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfigMap,
  GraphQLOutputType,
} from "graphql";

export type GQLitType =
  | GQLitScalarType
  | GQLitEnumType
  | GQLitObjectType<any>
  | GQLitInterfaceType<any>
  | GQLitUnionType
  | GQLitInputObjectType;

export class GQLitScalarType {
  constructor(readonly options: T.GQLitScalarOptions) {}
  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(name: string): GraphQLScalarTypeConfig<any, any> {
    ensureBuilding();
    return {
      name,
      ...this.options,
    };
  }
}

/**
 * Backing type for an enum member.
 */
export class GQLitEnumType {
  protected meta: T.GQLitTypeMetadata = {};
  protected members: T.EnumDefType[] = [];

  mix(typeName: string, mixOptions?: T.GQLitMixOptions) {
    this.members.push({
      type: E.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  /**
   * Add an individual value member to the enum
   */
  member(info: { value: string; internalValue?: any }) {
    const memberInfo = {
      ...info,
      internalValue:
        typeof info.internalValue === "undefined"
          ? info.value
          : info.internalValue,
    };
    this.members.push({ type: E.NodeType.ENUM_MEMBER, info: memberInfo });
  }

  /**
   * Any description about the enum type.
   */
  description(description: string) {
    this.meta.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   *
   * The GQLitEnumTpye requires the typeData arg because it
   * needs to synchronously return and therefore must
   */
  toConfig(name: string, typeData: TypeDataArg): GraphQLEnumTypeConfig {
    ensureBuilding();
    let values: GraphQLEnumValueConfigMap = {},
      description;
    this.members.forEach(member => {
      switch (member.type) {
        case E.NodeType.ENUM_MEMBER:
          values[member.info.value] = {
            value: member.info.internalValue,
            description: member.info.description,
          };
          break;
        case E.NodeType.MIX:
          if (typeData.currentlyBuilding.has(member.typeName)) {
            throw new Error(
              `Circular dependency mixin detected when building GQLit Enum: ${name}`
            );
          }
          const toBuildFn = typeData.pendingTypeMap[member.typeName];
          let enumToMix;
          if (typeof toBuildFn === "function") {
            enumToMix = toBuildFn(typeData.currentlyBuilding.add(name));
          } else if (typeData.finalTypeMap[member.typeName]) {
            enumToMix = typeData.finalTypeMap[member.typeName];
          } else {
            throw new Error(`Missing mixin enum type: ${member.typeName}`);
          }

          if (!isEnumType(enumToMix)) {
            throw new Error(
              `Cannot mix non-enum type ${enumToMix.name} with enum values`
            );
          }
          const { pick, omit } = member.mixOptions;
          enumToMix.getValues().forEach(val => {
            if (pick && pick.indexOf(val.name) === -1) {
              return;
            }
            if (omit && omit.indexOf(val.name) !== -1) {
              return;
            }
            values[val.name] = {
              description: val.description,
              deprecationReason: val.deprecationReason,
              value: val.value,
              astNode: val.astNode,
            };
          });
          break;
      }
    });
    if (Object.keys(values).length === 0) {
      throw new Error(`GQLitEnum ${name} must have at least one member`);
    }
    return {
      name,
      values,
      description,
    };
  }
}

export class GQLitUnionType {
  protected meta: T.GQLitTypeMetadata = {};
  protected members: T.UnionTypeDef[] = [];

  mix(type: string) {
    this.members.push({ type: E.NodeType.MIX, typeName: type, mixOptions: {} });
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(name: string): GraphQLUnionTypeConfig<any, any> {
    ensureBuilding();
    return {
      name,
      types: () => [],
    };
  }
}

abstract class GQLitWithFields<Root, Schema, Opts, ListOpts> {
  protected fields: T.FieldDefType<Opts, ListOpts>[] = [];

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: T.GQLitMixOptions) {
    this.fields.push({
      type: E.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<O extends Opts>(name: T.FieldName<Root, O>, options?: O) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<O extends Opts>(name: T.FieldName<Root, O>, options?: O) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<O extends Opts>(name: T.FieldName<Root, O>, options?: O) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<O extends Opts>(name: T.FieldName<Root, O>, options?: O) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<O extends Opts>(name: T.FieldName<Root, O>, options?: O) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the object type.
   */
  field(name: T.FieldName<Root, Opts>, type: T.GQLTypes, options?: Opts) {
    this.fields.push({
      type: E.NodeType.FIELD,
      fieldName: name,
      fieldType: type,
      fieldOptions: options || ({} as any),
    });
  }

  /**
   * Defines a field, which is actually a list of another field type
   */
  list(name: string, type: T.GQLTypes, options?: ListOpts) {
    this.fields.push({
      type: E.NodeType.LIST,
      fieldName: name,
      fieldType: type,
      fieldOptions: options || ({} as any),
    });
  }
}

export class GQLitObjectType<Root, Schema = any> extends GQLitWithFields<
  Root,
  Schema,
  T.GQLitFieldOptions<Root>,
  T.GQLitListOptions<Root>
> {
  /**
   * Metadata about the object type
   */
  protected meta: T.GQLitTypeMetadata = {};
  /**
   * All interfaces the object implements.
   */
  protected interfaces: string[] = [];

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  implements(interfaceName: T.InterfaceNames<Schema>) {
    this.interfaces.push(interfaceName);
  }

  /**
   * Adds a description to the metadata for the object type.
   */
  description(description: string) {
    this.meta.description = description;
  }

  /**
   * Adds an "isTypeOf" check to the object type.
   */
  isTypeOf(fn: (value: any) => boolean) {
    this.meta.isTypeOf = fn;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(
    name: string,
    getType: T.GetTypeFn
  ): GraphQLObjectTypeConfig<any, any> {
    ensureBuilding();
    const additional: Partial<GraphQLObjectTypeConfig<any, any>> = {};
    if (this.meta.description) {
      additional.description = withDeprecationComment(this.meta.description);
    }
    return {
      name,
      interfaces: () => {
        return this.interfaces.map(i => getType<GraphQLInterfaceType>(i));
      },
      fields: () => {
        return Object.keys(this.fields).reduce(
          (fields, field) => {
            fields[field] = {
              type: getType<GraphQLOutputType>(field),
              // args?: GraphQLFieldConfigArgumentMap;
              // resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
              // subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
              // deprecationReason?: Maybe<string>;
              // description?: Maybe<string>;
              // astNode?: Maybe<FieldDefinitionNode>;
            };
            return fields;
          },
          {} as GraphQLFieldConfigMap<any, any>
        );
      },
    };
  }
}

export class GQLitInterfaceType<Root, Schema = any> extends GQLitWithFields<
  Root,
  Schema,
  T.GQLitFieldOptions<Root>,
  T.GQLitListOptions<Root>
> {
  resolveType(typeResolver: any) {}

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(name: string): GraphQLInterfaceTypeConfig<any, any> {
    ensureBuilding();
    return {
      name,
      fields: () => {
        return {};
      },
    };
  }
}

export class GQLitInputObjectType extends GQLitWithFields<any, any, any, any> {
  protected meta: T.GQLitTypeMetadata = {};

  description(description: string) {
    this.meta.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(name: string): GraphQLInputObjectTypeConfig {
    ensureBuilding();
    return {
      name,
      fields: () => {
        return {};
      },
    };
  }
}

/**
 * A `GQLitAbstractType` contains fields that can be shared among `GQLitObjectType`,
 * `GQLitInterface`, `GQLitInputObjectType` or other `GQLitAbstractType`s
 *
 * Use the `.mix` to mixin the abstract type fields.
 */
export class GQLitAbstractType extends GQLitWithFields<any, any, any, any> {}

// Ignoring these, since they're only provided for a better developer experience,
// we don't want these to actually be picked up by intellisense.
// @ts-ignore
GQLitAbstractType.prototype.implements = function() {
  throw new Error(`
    Oops, looks like you are trying to call "implements" on an abstract type definition.
    Abstract types cannot implement interfaces, as they are not concrete types.
    Call .implements() on the concrete type that uses this AbstractType instead.
  `);
};

interface TypeDataArg {
  finalTypeMap: Record<string, GraphQLNamedType>;
  pendingTypeMap: Record<
    string,
    ((building: Set<string>) => GraphQLNamedType) | null
  >;
  currentlyBuilding: Set<string>;
}

/**
 * buildGQLitType
 *
 * For internal use, builds concrete representations of the GQLit types for the Schema.
 *
 * @param name name of the type being built
 * @param type GQLitType representation of the GraphQL type being built
 * @param typeMap the map of currently resolved types, used to
 * @param currentlyBuilding a Set of types currenty being "mixed", used to break circular dependencies
 */
export function buildGQLitType(
  name: string,
  type: GQLitType,
  typeData: TypeDataArg
): GraphQLNamedType {
  isBuilding += 1;
  let returnType: GraphQLNamedType;
  if (type instanceof GQLitObjectType) {
    returnType = new GraphQLObjectType(type.toConfig(name);
  } else if (type instanceof GQLitInputObjectType) {
    returnType = new GraphQLInputObjectType(type.toConfig(name));
  } else if (type instanceof GQLitEnumType) {
    returnType = new GraphQLEnumType(type.toConfig(name, typeData));
  } else if (type instanceof GQLitScalarType) {
    returnType = new GraphQLScalarType(type.toConfig(name));
  } else if (type instanceof GQLitUnionType) {
    returnType = new GraphQLUnionType(type.toConfig(name));
  } else if (type instanceof GQLitInterfaceType) {
    returnType = new GraphQLInterfaceType(type.toConfig(name));
  } else {
    throw new Error(`Invalid value, expected GQLit type, saw ${type}`);
  }
  isBuilding -= 1;
  return returnType;
}

/**
 * Counter, to determine whether we're building or not. Used to error if `toConfig` is
 * called erroneously from userland.
 */
let isBuilding = 0;

function ensureBuilding() {
  if (isBuilding === 0) {
    throw new Error(
      ".toConfig should only be called internally, while constructing the schema types"
    );
  }
}

function withDeprecationComment(description?: string | null) {
  return description;
}

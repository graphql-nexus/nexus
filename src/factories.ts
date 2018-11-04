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
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLNonNull,
  GraphQLField,
  isInterfaceType,
  isObjectType,
  GraphQLFieldConfigMap,
} from "graphql";

export type GQLiteralType =
  | GQLiteralScalarType
  | GQLiteralEnumType
  | GQLiteralObjectType<any>
  | GQLiteralInterfaceType<any>
  | GQLiteralUnionType
  | GQLiteralInputObjectType;

export class GQLiteralScalarType {
  constructor(
    protected readonly name: string,
    readonly options: T.GQLiteralScalarOptions
  ) {}
  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(): GraphQLScalarTypeConfig<any, any> {
    ensureBuilding();
    return {
      name: this.name,
      ...this.options,
    };
  }
}

/**
 * Backing type for an enum member.
 */
export class GQLiteralEnumType {
  protected meta: T.GQLiteralTypeMetadata = {};
  protected members: T.EnumDefType[] = [];

  constructor(protected readonly name: string) {}

  mix(typeName: string, mixOptions?: T.GQLiteralMixOptions) {
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
   * The GQLiteralEnumType requires the typeData arg because it
   * needs to synchronously return and therefore must check for / break
   * circular references when mixing.
   */
  toConfig(typeData: TypeDataArg): GraphQLEnumTypeConfig {
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
              `Circular dependency mixin detected when building GQLit Enum: ${
                this.name
              }`
            );
          }
          const toBuildFn = typeData.pendingTypeMap[member.typeName];
          let enumToMix;
          if (typeof toBuildFn === "function") {
            enumToMix = toBuildFn(typeData.currentlyBuilding.add(this.name));
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
      throw new Error(
        `GQLiteralEnum ${this.name} must have at least one member`
      );
    }
    return {
      name: this.name,
      values,
      description,
    };
  }
}

export class GQLiteralUnionType {
  protected meta: T.GQLiteralTypeMetadata = {};
  protected unionMembers: T.UnionTypeDef[] = [];

  constructor(protected readonly name: string) {}

  mix(type: string) {
    this.unionMembers.push({
      type: E.NodeType.MIX,
      typeName: type,
      mixOptions: {},
    });
  }

  members(...types: string[]) {
    types.forEach(typeName => {
      this.unionMembers.push({ type: E.NodeType.UNION_MEMBER, typeName });
    });
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(getType: T.GetTypeFn): GraphQLUnionTypeConfig<any, any> {
    ensureBuilding();
    return {
      name: this.name,
      types: () => {
        return this.unionMembers.reduce((result: GraphQLObjectType[], item) => {
          return result;
        }, []);
      },
    };
  }
}

abstract class GQLitWithFields<Root, Schema, Opts, ListOpts> {
  protected fields: T.FieldDefType<Root>[] = [];

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: T.GQLiteralMixOptions) {
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

export class GQLiteralObjectType<Root, Schema = any> extends GQLitWithFields<
  Root,
  Schema,
  T.GQLiteralFieldOptions<Root>,
  T.GQLiteralListOptions<Root>
> {
  /**
   * Metadata about the object type
   */
  protected meta: T.GQLiteralTypeMetadata = {};
  /**
   * All interfaces the object implements.
   */
  protected interfaces: string[] = [];

  constructor(protected readonly name: string) {
    super();
  }

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
  toConfig(getType: T.GetTypeFn): GraphQLObjectTypeConfig<any, any> {
    ensureBuilding();
    const additional: Partial<GraphQLObjectTypeConfig<any, any>> = {};
    if (this.meta.description) {
      additional.description = withDeprecationComment(this.meta.description);
    }
    return {
      name: this.name,
      interfaces: () => {
        return this.interfaces.map(i => {
          const iface = getType(i);
          if (!isInterfaceType(iface)) {
            throw new Error(
              `Expected ${this.name} - ${i} to be an interface, saw ${iface}`
            );
          }
          return iface;
        });
      },
      fields: () => {
        const interfaceFields: Record<
          string,
          GraphQLFieldConfig<any, any>
        > = {};
        const typeFields: Record<string, GraphQLFieldConfig<any, any>> = {};
        this.fields.forEach(field => {
          switch (field.type) {
            case E.NodeType.FIELD: {
              typeFields[field.fieldName] = buildGraphQLField(
                this.name,
                field,
                getType
              );
              break;
            }
            case E.NodeType.LIST: {
              typeFields[field.fieldName] = buildGraphQLList(
                this.name,
                field,
                getType
              );
              break;
            }
            case E.NodeType.MIX: {
              //
              break;
            }
          }
          // typeFields[field] =
        });
        return {
          ...interfaceFields,
          ...typeFields,
        };
      },
    };
  }
}

export class GQLiteralInterfaceType<Root, Schema = any> extends GQLitWithFields<
  Root,
  Schema,
  T.GQLiteralFieldOptions<Root>,
  T.GQLiteralListOptions<Root>
> {
  /**
   * Metadata about the object type
   */
  protected meta: T.GQLiteralInterfaceMetadata = {};

  constructor(protected readonly name: string) {
    super();
  }

  /**
   * Adds a description to the metadata for the interface type.
   */
  description(description: string) {
    this.meta.description = description;
  }

  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType(typeResolver: any) {
    this.meta.resolveType = typeResolver;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(getType: T.GetTypeFn): GraphQLInterfaceTypeConfig<any, any> {
    ensureBuilding();
    let description;
    return {
      name: this.name,
      fields: () => {
        const interfaceFields: GraphQLFieldConfigMap<any, any> = {};
        this.fields.forEach(field =>
          buildObjectField(interfaceFields, this.name, field)
        );
        return interfaceFields;
      },
      resolveType: this.meta.resolveType,
      description,
      // astNode?: Maybe<InterfaceTypeDefinitionNode>;
      // extensionASTNodes?: Maybe<ReadonlyArray<InterfaceTypeExtensionNode>>;
    };
  }
}

export class GQLiteralInputObjectType extends GQLitWithFields<
  any,
  any,
  any,
  any
> {
  protected meta: T.GQLiteralTypeMetadata = {};

  constructor(protected readonly name: string) {
    super();
  }

  description(description: string) {
    this.meta.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(getType: T.GetTypeFn): GraphQLInputObjectTypeConfig {
    ensureBuilding();
    return {
      name: this.name,
      fields: () => {
        return {};
      },
    };
  }
}

/**
 * A `GQLiteralAbstractType` contains fields that can be shared among `GQLiteralObjectType`,
 * `GQLiteralInterface`, `GQLiteralInputObjectType` or other `GQLiteralAbstractType`s
 *
 * Use the `.mix` to mixin the abstract type fields.
 */
export class GQLiteralAbstractType extends GQLitWithFields<
  any,
  any,
  any,
  any
> {}

// Ignoring these, since they're only provided for a better developer experience,
// we don't want these to actually be picked up by intellisense.
// @ts-ignore
GQLiteralAbstractType.prototype.implements = function() {
  throw new Error(`
    Oops, looks like you are trying to call "implements" on an abstract type definition.
    Abstract types cannot implement interfaces, as they are not concrete types.
    Call .implements() on the concrete type that uses this AbstractType instead.
  `);
};

function buildObjectField(
  targetObject: GraphQLFieldConfigMap<any, any>,
  typeName: string,
  field: T.FieldDefType
) {
  switch (field.type) {
    case E.NodeType.MIX: {
    }
    case E.NodeType.MIX_ABSTRACT: {
    }
  }
}

function buildGraphQLField(
  name: string,
  field: T.FieldDef<any>,
  getType: T.GetTypeFn
): GraphQLFieldConfig<any, any> {
  const nullItem = Boolean(field.fieldOptions.nullable);
  const fieldType = getType(field.fieldType);
  if (!isObjectType(fieldType)) {
    throw new Error(
      `Expected ${name} - ${
        field.fieldName
      } to be an object type, saw ${fieldType}`
    );
  }
  let args;
  return {
    type: nullItem ? fieldType : GraphQLNonNull(fieldType),
    // args?: GraphQLFieldConfigArgumentMap;
    // resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    // subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    // deprecationReason?: Maybe<string>;
    // description?: Maybe<string>;
    // astNode?: Maybe<FieldDefinitionNode>;
  };
}

function buildGraphQLList(
  name: string,
  list: T.ListDef<any>,
  getType: T.GetTypeFn
): GraphQLFieldConfig<any, any> {
  const nullList = Boolean(list.fieldOptions.nullable);
  const nullItem = Boolean(list.fieldOptions.itemNull);
  const fieldType = getType(list.fieldType);
  let args;
  const type = GraphQLList(nullItem ? fieldType : GraphQLNonNull(fieldType));
  return {
    type: nullList ? type : GraphQLNonNull(type),
    // args?: GraphQLFieldConfigArgumentMap;
    // resolve?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    // subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
    // deprecationReason?: Maybe<string>;
    // description?: Maybe<string>;
    // astNode?: Maybe<FieldDefinitionNode>;
  };
}

interface TypeDataArg {
  finalTypeMap: Record<string, GraphQLNamedType>;
  pendingTypeMap: Record<
    string,
    ((building: Set<string>) => GraphQLNamedType) | null
  >;
  currentlyBuilding: Set<string>;
}

/**
 * buildGQLiteralType
 *
 * For internal use, builds concrete representations of the GQLit types for the Schema.
 *
 * @param name name of the type being built
 * @param type GQLiteralType representation of the GraphQL type being built
 * @param typeMap the map of currently resolved types, used to
 * @param currentlyBuilding a Set of types currenty being "mixed", used to break circular dependencies
 */
export function buildGQLiteralType(
  name: string,
  type: GQLiteralType,
  typeData: TypeDataArg,
  getType?: T.GetTypeFn
): GraphQLNamedType {
  isBuilding += 1;
  const getTypeFn: T.GetTypeFn =
    getType ||
    ((typeName: string) => {
      const t = typeData.finalTypeMap[typeName];
      if (!t) {
        throw new Error(`Missing type ${typeName}`);
      }
      return t;
    });
  let returnType: GraphQLNamedType;
  if (type instanceof GQLiteralObjectType) {
    returnType = new GraphQLObjectType(type.toConfig(getTypeFn));
  } else if (type instanceof GQLiteralInputObjectType) {
    returnType = new GraphQLInputObjectType(type.toConfig(getTypeFn));
  } else if (type instanceof GQLiteralInterfaceType) {
    returnType = new GraphQLInterfaceType(type.toConfig(getTypeFn));
  } else if (type instanceof GQLiteralUnionType) {
    returnType = new GraphQLUnionType(type.toConfig(getTypeFn));
  } else if (type instanceof GQLiteralEnumType) {
    returnType = new GraphQLEnumType(type.toConfig(typeData));
  } else if (type instanceof GQLiteralScalarType) {
    returnType = new GraphQLScalarType(type.toConfig());
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

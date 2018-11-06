import * as Types from "./types";
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
  GraphQLFieldConfigMap,
  isOutputType,
  isInputType,
  isNamedType,
  GraphQLInputFieldConfigMap,
} from "graphql";
import { GQLiteralArgument } from "./definitions";

export type GQLiteralType =
  | GQLiteralScalarType
  | GQLiteralEnumType
  | GQLiteralObjectType<any>
  | GQLiteralInterfaceType
  | GQLiteralUnionType
  | GQLiteralInputObjectType;

export class GQLiteralScalarType {
  constructor(
    protected readonly name: string,
    readonly options: Types.GQLiteralScalarOptions
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
export class GQLiteralEnumType<GenTypes> {
  protected meta: Types.GQLiteralTypeMetadata = {};
  protected members: Types.EnumDefType[] = [];

  constructor(protected readonly name: string) {}

  mix<T extends string>(typeName: T, mixOptions?: Types.GQLiteralMixOptions<>) {
    this.members.push({
      item: Types.NodeType.MIX,
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
    this.members.push({ item: Types.NodeType.ENUM_MEMBER, info: memberInfo });
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
    this.members.forEach((member) => {
      switch (member.item) {
        case Types.NodeType.ENUM_MEMBER:
          values[member.info.value] = {
            value: member.info.internalValue,
            description: member.info.description,
          };
          break;
        case Types.NodeType.MIX:
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
          enumToMix.getValues().forEach((val) => {
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
  protected meta: Types.GQLiteralTypeMetadata = {};
  protected unionMembers: Types.UnionTypeDef[] = [];

  constructor(protected readonly name: string) {}

  mix(type: string) {
    this.unionMembers.push({
      item: Types.NodeType.MIX,
      typeName: type,
      mixOptions: {},
    });
  }

  members(...types: string[]) {
    types.forEach((typeName) => {
      this.unionMembers.push({ item: Types.NodeType.UNION_MEMBER, typeName });
    });
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  toConfig(getType: Types.GetTypeFn): GraphQLUnionTypeConfig<any, any> {
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

abstract class GQLitWithFields {
  protected fields: Types.FieldDefType[] = [];

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: Types.GQLiteralMixOptions) {
    this.fields.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<O extends Opts>(name: Types.FieldName<Root, O>, options?: O) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<O extends Opts>(name: Types.FieldName<Root, O>, options?: O) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<O extends Opts>(name: Types.FieldName<Root, O>, options?: O) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<O extends Opts>(name: Types.FieldName<Root, O>, options?: O) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<O extends Opts>(name: Types.FieldName<Root, O>, options?: O) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the object type
   */
  field(
    name: Types.FieldName<Root, Opts>,
    type: Types.GQLTypes,
    options?: Opts
  ) {
    this.fields.push({
      item: Types.NodeType.FIELD,
      fieldName: name,
      fieldType: type,
      fieldOptions: options || ({} as any),
    });
  }
}

export class GQLiteralOutputObject extends GQLitWithFields {
  /**
   * Define an id argument for a field.
   */
  idArg(options?: Types.GQLiteralArgOptions) {
    return this.fieldArg("ID", options);
  }

  /**
   * Define an int argument for a field.
   */
  intArg(options?: Types.GQLiteralArgOptions) {
    return this.fieldArg("Int", options);
  }

  /**
   * Define a string argument for a field.
   */
  stringArg(options?: Types.GQLiteralArgOptions) {
    return this.fieldArg("String", options);
  }

  /**
   * Define a float argument for a field.
   */
  floatArg(options?: Types.GQLiteralArgOptions) {
    return this.fieldArg("Float", options);
  }

  /**
   * Define a boolean argument for a field.
   */
  booleanArg(options?: Types.GQLiteralArgOptions) {
    return this.fieldArg("Boolean", options);
  }

  /**
   * Define a field argument for a field.
   */
  fieldArg(type: Types.GQLArgTypes, options?: Types.GQLArgOpts) {
    return GQLiteralArgument(type, options);
  }
}

export class GQLiteralObjectType<GenTypes, ObjTypes> extends GQLitWithFields {
  /**
   * Metadata about the object type
   */
  protected meta: Types.GQLiteralTypeMetadata = {};

  /**
   * All interfaces the object implements.
   */
  protected interfaces: Types.InterfaceNames<GenTypes>[] = [];

  constructor(protected readonly name: string) {
    super();
  }

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  implements(interfaceName: Types.InterfaceNames<GenTypes>) {
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
  toConfig(getType: Types.GetTypeFn): GraphQLObjectTypeConfig<any, any> {
    ensureBuilding();
    const additional: Partial<GraphQLObjectTypeConfig<any, any>> = {};
    if (this.meta.description) {
      additional.description = withDeprecationComment(this.meta.description);
    }
    return {
      name: this.name,
      interfaces: () => {
        return this.interfaces.map((i) => {
          const interfaceType = getType(i);
          if (!isInterfaceType(interfaceType)) {
            throw new Error(
              `Expected ${
                this.name
              } - ${i} to be an interface, saw ${interfaceType}`
            );
          }
          return interfaceType;
        });
      },
      fields: () => {
        const interfaceFields: Record<
          string,
          GraphQLFieldConfig<any, any>
        > = {};
        const typeFields: Record<string, GraphQLFieldConfig<any, any>> = {};
        this.fields.forEach((field) => {
          switch (field.item) {
            case Types.NodeType.FIELD: {
              typeFields[field.fieldName] = buildGraphQLField<Root>(
                this.name,
                field.fieldName,
                field.fieldType,
                field.fieldOptions,
                getType
              );
              break;
            }
            case Types.NodeType.MIX: {
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

export class GQLiteralInterfaceType<
  GenTypes,
  InterfaceTypes
> extends GQLitWithFields {
  /**
   * Metadata about the object type
   */
  protected meta: Types.GQLiteralInterfaceMetadata = {};

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
  toConfig(getType: Types.GetTypeFn): GraphQLInterfaceTypeConfig<any, any> {
    ensureBuilding();
    let description;
    return {
      name: this.name,
      fields: () => buildObjectFields(this.name, this.fields),
      resolveType: this.meta.resolveType,
      description,
      // astNode?: Maybe<InterfaceTypeDefinitionNode>;
      // extensionASTNodes?: Maybe<ReadonlyArray<InterfaceTypeExtensionNode>>;
    };
  }
}

export class GQLiteralInputObjectType extends GQLitWithFields {
  protected meta: Types.GQLiteralTypeMetadata = {};

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
  toConfig(getType: Types.GetTypeFn): GraphQLInputObjectTypeConfig {
    ensureBuilding();
    return {
      name: this.name,
      fields: () => buildInputObjectFields(this.name, this.fields),
      description: this.meta.description,
    };
  }
}

/**
 * A `GQLiteralAbstractType` contains fields that can be shared among `GQLiteralObjectType`,
 * `GQLiteralInterface`, `GQLiteralInputObjectType` or other `GQLiteralAbstractType`s
 *
 * Use the `.mix` to mixin the abstract type fields.
 */
export class GQLiteralAbstract extends GQLiteralOutputObject {}

// Ignoring these, since they're only provided for a better developer experience,
// we don't want these to actually be picked up by intellisense.
// @ts-ignore
GQLiteralAbstract.prototype.implements = function() {
  throw new Error(`
    Oops, looks like you are trying to call "implements" on an abstract type definition.
    Abstract types cannot implement interfaces, as they are not concrete types.
    Call .implements() on the concrete type that uses this AbstractType instead.
  `);
};

function buildObjectFields(
  typeName: string,
  fields: Types.FieldDefType<any>[]
): GraphQLFieldConfigMap<any, any> {
  const fieldMap: GraphQLFieldConfigMap<any, any> = {};
  fields.forEach((field) => {
    switch (field.item) {
      case Types.NodeType.MIX: {
        break;
      }
      case Types.NodeType.MIX_ABSTRACT: {
        break;
      }
      case Types.NodeType.FIELD: {
        break;
      }
    }
  });
  return fieldMap;
}

function buildInputObjectFields(
  typeName: string,
  fields: Types.FieldDefType<any>[]
): GraphQLInputFieldConfigMap {
  const fieldMap: GraphQLInputFieldConfigMap = {};
  fields.forEach((field) => {
    switch (field.item) {
      case Types.NodeType.MIX: {
        break;
      }
      case Types.NodeType.MIX_ABSTRACT: {
        break;
      }
      case Types.NodeType.FIELD: {
        break;
      }
    }
  });
  return fieldMap;
}

function buildGraphQLField(
  typeName: string,
  fieldName: string,
  fieldType: string,
  fieldOptions: Types.GQLiteralOutputFieldOptions<any>,
  getType: Types.GetTypeFn
): GraphQLFieldConfig<any, any> {
  const type = getType(fieldType);
  const nullable = Boolean(fieldOptions.nullable);
  if (typeof fieldOptions.listItemNullable === "boolean") {
    console.warn("listItemNullable should ");
  }
  const nullItem = Boolean(fieldOptions.listItemNullable);
  if (!isNamedType(fieldType)) {
    throw new Error("");
  }
  if (!isOutputType(fieldType)) {
    throw new Error(
      `Expected ${typeName} - ${fieldName} to be an object type, saw ${fieldType}`
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

function buildGraphQLArgument() {
  const requiredArg = Boolean();
  // if (!isNamedType()) {
  // }
  // if (!isInputType()) {
  // }
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
  getType?: Types.GetTypeFn
): GraphQLNamedType {
  isBuilding += 1;
  const getTypeFn: Types.GetTypeFn =
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
      ".toConfig should only be called internally, while GQLiteral is constructing the schema types"
    );
  }
}

function withDeprecationComment(description?: string | null) {
  return description;
}

import { GetGen, AbstractTypeResolver } from "../typegenTypeHelpers";
import { AbstractOutputDefinitionBuilder } from "./blocks";
import { NexusTypes, withNexusSymbol } from "./_types";
import { assertValidName } from "graphql";
import { NexusObjectTypeDef } from "./objectType";

export interface UnionDefinitionBuilder<
  TypeName extends string,
  GenTypes = NexusGen
> extends AbstractOutputDefinitionBuilder<TypeName, GenTypes> {
  addUnionMembers(members: UnionMembers): void;
}

export type UnionMembers<GenTypes = NexusGen> = Array<
  GetGen<GenTypes, "objectNames"> | NexusObjectTypeDef<string>
>;

export class UnionDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {
  constructor(
    protected typeBuilder: UnionDefinitionBuilder<TypeName, GenTypes>
  ) {}
  /**
   * All ObjectType names that should be part of the union, either
   * as string names or as references to the `objectType()` return value
   */
  members(...unionMembers: UnionMembers<GenTypes>) {
    this.typeBuilder.addUnionMembers(unionMembers);
  }
  /**
   * Sets the "resolveType" method for the current union
   */
  resolveType(fn: AbstractTypeResolver<TypeName, GenTypes>) {
    this.typeBuilder.setResolveType(fn);
  }
}

export interface NexusUnionTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  /**
   * The name of the union type
   */
  name: TypeName;
  /**
   * Builds the definition for the union
   */
  definition(t: UnionDefinitionBlock<TypeName, GenTypes>): void;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string; // | DeprecationInfo;
}

export class NexusUnionTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusUnionTypeConfig<any, any>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusUnionTypeDef, NexusTypes.Union);

/**
 * Defines a new `GraphQLUnionType`
 * @param config
 */
export function unionType<TypeName extends string, GenTypes = NexusGen>(
  config: NexusUnionTypeConfig<TypeName, GenTypes>
) {
  return new NexusUnionTypeDef(config.name, config);
}

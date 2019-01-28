import {
  AbstractResolveRoot,
  MaybePromise,
  AbstractResolveReturn,
  GetGen,
} from "../typegenTypeHelpers";
import { MaybeThunk, DeprecationInfo, NexusTypes } from "./_types";
import { GraphQLObjectType, assertValidName } from "graphql";
import { wrappedType } from "./wrappedType";

export interface UnionTypeConfig<TypeName extends string, GenTypes = NexusGen> {
  name: TypeName;
  members: MaybeThunk<GetGen<GenTypes, "objectNames"> | GraphQLObjectType>;
  resolveType(
    source: AbstractResolveRoot<GenTypes, TypeName>
  ): MaybePromise<AbstractResolveReturn<TypeName, GenTypes>>;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string | DeprecationInfo;
}

export type UnionTypeDef = ReturnType<typeof unionType>;

/**
 * Defines a new `GraphQLUnionType`
 * @param config
 */
export function unionType<TypeName extends string, GenTypes = NexusGen>(
  config: UnionTypeConfig<TypeName, GenTypes>
) {
  const { name, ...rest } = config;
  return wrappedType({
    nexus: NexusTypes.Union as NexusTypes.Union,
    name: assertValidName(config.name),
    ...rest,
  });
}

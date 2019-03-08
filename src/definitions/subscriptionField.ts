import { extendType } from "./extendType";
import { CommonOutputFieldConfig } from "./definitionBlocks";
import { GraphQLResolveInfo } from "graphql";
import {
  ResultValue,
  MaybePromiseDeep,
  ArgsValue,
  GetGen,
} from "../typegenTypeHelpers";
import { AllNexusOutputTypeDefs, NexusWrappedType } from "./wrapping";
import { AsyncIterator } from "./_types";

export interface SubscribeFieldConfig<
  TypeName extends string,
  FieldName extends string,
  T = any
> extends CommonOutputFieldConfig<TypeName, FieldName> {
  type:
    | GetGen<"allOutputTypes">
    | AllNexusOutputTypeDefs
    | NexusWrappedType<AllNexusOutputTypeDefs>;

  subscribe(
    root: object,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<"context">,
    info: GraphQLResolveInfo
  ): AsyncIterator<T>;

  /**
   * Resolve method for the field
   */
  resolve(
    root: T,
    args: ArgsValue<TypeName, FieldName>,
    context: GetGen<"context">,
    info: GraphQLResolveInfo
  ): MaybePromiseDeep<ResultValue<"Subscription", FieldName>>;
}

export function subscriptionField<FieldName extends string>(
  fieldName: string,
  config:
    | SubscribeFieldConfig<"Subscription", FieldName>
    | (() => SubscribeFieldConfig<"Subscription", FieldName>)
) {
  return extendType({
    type: "Subscription",
    definition(t) {
      const finalConfig = typeof config === "function" ? config() : config;
      t.field(fieldName, finalConfig);
    },
  });
}

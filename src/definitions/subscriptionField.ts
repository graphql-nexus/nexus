import { GraphQLResolveInfo } from "graphql";
import {
  ArgsValue,
  GetGen,
  MaybePromise,
  MaybePromiseDeep,
  ResultValue,
} from "../typegenTypeHelpers";
import { CommonOutputFieldConfig } from "./definitionBlocks";
import { extendType } from "./extendType";
import { AllNexusOutputTypeDefs } from "./wrapping";
import { AsyncIterator } from "./_types";

export interface SubscribeFieldConfig<
  TypeName extends string,
  FieldName extends string,
  T = any
> extends CommonOutputFieldConfig<TypeName, FieldName> {
  type: GetGen<"allOutputTypes"> | AllNexusOutputTypeDefs;

  subscribe(
    root: object,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<"context">,
    info: GraphQLResolveInfo
  ): MaybePromise<AsyncIterator<T>> | MaybePromiseDeep<AsyncIterator<T>>;

  /**
   * Resolve method for the field
   */
  resolve(
    root: T,
    args: ArgsValue<TypeName, FieldName>,
    context: GetGen<"context">,
    info: GraphQLResolveInfo
  ):
    | MaybePromise<ResultValue<"Subscription", FieldName>>
    | MaybePromiseDeep<ResultValue<"Subscription", FieldName>>;
}

export function subscriptionField<FieldName extends string>(
  fieldName: FieldName,
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

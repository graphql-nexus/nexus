import { FieldOutConfig } from "../core";
import { extendType } from "./extendType";

export function mutationField<FieldName extends string>(
  fieldName: FieldName,
  config:
    | FieldOutConfig<"Mutation", FieldName>
    | (() => FieldOutConfig<"Mutation", FieldName>)
) {
  const finalConfig = typeof config === "function" ? config() : config;
  return extendType({
    type: "Mutation",
    definition(t) {
      t.field(fieldName, finalConfig);
    },
  });
}

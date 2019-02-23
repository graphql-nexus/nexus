import { FieldOutConfig } from "../core";
import { extendType } from "./extendType";

export function mutationField<FieldName extends string>(
  fieldName: FieldName,
  config:
    | FieldOutConfig<"Mutation", FieldName>
    | (() => FieldOutConfig<"Mutation", FieldName>)
) {
  return extendType({
    type: "Mutation",
    definition(t) {
      const finalConfig = typeof config === "function" ? config() : config;
      t.field(fieldName, finalConfig);
    },
  });
}

import { FieldOutConfig } from "../core";
import { extendType } from "./extendType";

export function queryField<FieldName extends string>(
  fieldName: FieldName,
  config:
    | FieldOutConfig<"Query", FieldName>
    | (() => FieldOutConfig<"Query", FieldName>)
) {
  return extendType({
    type: "Query",
    definition(t) {
      const finalConfig = typeof config === "function" ? config() : config;
      t.field(fieldName, finalConfig);
    },
  });
}

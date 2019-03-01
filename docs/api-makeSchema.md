---
id: api-makeSchema
title: makeSchema
sidebar_label: makeSchema
---

Defines the GraphQL schema, by combining the GraphQL types defined
by the GraphQL Nexus layer or any manually defined GraphQLType objects.

Requires at least one type be named "Query", which will be used as the
root query type.

```ts
export declare function makeSchema(options: SchemaConfig): GraphQLSchema;
```

```ts
interface SchemaConfig {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
  /**
   * When the schema starts and `process.env.NODE_ENV !== "production"`,
   * artifact files are auto-generated containing the .graphql definitions of
   * the schema
   */
  outputs:
    | {
        /**
         * Absolute path where the GraphQL IDL file should be written
         */
        schema: string | false;
        /**
         * File path where generated types should be saved
         */
        typegen: string | false;
      }
    | false;
  /**
   * Whether the schema & types are generated when the server
   * starts. Default is !process.env.NODE_ENV || process.env.NODE_ENV !== "production"
   */
  shouldGenerateArtifacts?: boolean;
  /**
   * Automatically configure type resolution for the TypeScript
   * representations of the associated types.
   *
   * Alias for typegenConfig: typegenAutoConfig(options)
   */
  typegenAutoConfig?: TypegenAutoConfigOptions;
  /**
   * A configuration function for advanced cases where
   * more control over the `TypegenInfo` is needed.
   */
  typegenConfig?: (
    schema: GraphQLSchema,
    outputPath: string
  ) => TypegenInfo | PromiseLike<TypegenInfo>;
  /**
   * Either an absolute path to a .prettierrc file, or an object
   * with relevant Prettier rules to be used on the generated output
   */
  prettierConfig?: string | object;
  /**
   * Manually apply a formatter to the generated content before saving,
   * see the `prettierConfig` option if you want to use Prettier.
   */
  formatTypegen?: TypegenFormatFn;
  /**
   * Configures the default "nonNullDefaults" for the entire schema the type.
   * Read more about how nexus handles nullability
   */
  nonNullDefaults?: NonNullConfig;
}
```

---
id: type-generation
title: Type Generation Details
sidebar_label: Type Generation Details
---

This is the most important piece to understand to get the most out of Nexus. It is relevant to JavaScript as well as TypeScript users, as tools like VSCode and `// @ts-check` can utilize these types to aid in autocomplete or type-checking. A core goal of Nexus is to have the best possible type coverage with the least possible manual type annotation.

## Overview

Nexus was designed with TypeScript in mind. In order to fully typecheck our GraphQL objects, we need to generate a number of types that combine the schema, any type or field configuration provided, and the GraphQL resolution algorithm to create as much type-safety as possible without any additional work importing and assigning types throughout the codebase.

## Root Types

A **root type** is a type representation of the value used to resolve the fields of an object type. It as the object that will be passed as the first argument of `resolve`. It can be a plain JS object, a database model, a mongoose document, a JS class, anything that fulfills the contract defined by the GraphQL object type, based on the field definitions.

Scalars can also have backing types, representing the value they are parsed into.

Sometimes GraphQL types are passthrough, and don't have a dedicated type backing them. One such case would be in the `Edge` of a Relay style pagination. In this case, Nexus will generate a type-definition which makes assumptions of the necessary value to fulfill the contract. If this is incorrect, you can always provide a concrete type for the object.

## Field Type

A **field type** is the valid return value used to a field on an object type. In GraphQL, promises can be returned at every level of the type resolution, so we wrap the types in a `MaybePromiseDeep<T>` type to express this.

## Configuring our types

The [Ghost Example](https://github.com/prisma/nexus/blob/develop/examples/ghost/src/ghost-schema.ts) is the best to look at for an example of how we're able to capture the types from existing runtime objects or definitions and merge them with our schema.

The [makeSchema](api-makeSchema.md) takes an option `typegenAutoConfig` which helps us find the types we need to import into our generated schema.

```ts
export interface TypegenAutoConfigOptions {
  /**
   * Any headers to prefix on the generated type file
   */
  headers?: string[];
  /**
   * Array of files to match for a type
   *
   *   sources: [
   *     { source: 'typescript', alias: 'ts' },
   *     { source: path.join(__dirname, '../backingTypes'), alias: 'b' },
   *   ]
   */
  sources: TypegenConfigSourceModule[];
  /**
   * Typing for the context, referencing a type defined in the aliased module
   * provided in sources e.g. 'alias.Context'
   */
  contextType?: string;
  /**
   * Types that should not be matched for a backing type,
   *
   * By default this is set to ['Query', 'Mutation', 'Subscription']
   *
   *   skipTypes: ['Query', 'Mutation', /(.*?)Edge/, /(.*?)Connection/]
   */
  skipTypes?: (string | RegExp)[];
  /**
   * If debug is set to true, this will log out info about all types
   * found, skipped, etc. for the type generation files.
   */
  debug?: boolean;
  /**
   * If provided this will be used for the backing types rather than the auto-resolve
   * mechanism above. Useful as an override for one-off cases, or for scalar
   * backing types.
   */
  backingTypeMap?: Record<string, string>;
}

export interface TypegenConfigSourceModule {
  /**
   * The module for where to look for the types.
   * This uses the node resolution algorithm via require.resolve,
   * so if this lives in node_modules, you can just provide the module name
   * otherwise you should provide the absolute path to the file.
   */
  source: string;
  /**
   * When we import the module, we use 'import * as ____' to prevent
   * conflicts. This alias should be a name that doesn't conflict with any other
   * types, usually a short lowercase name.
   */
  alias: string;
  /**
   * Provides a custom approach to matching for the type
   *
   * If not provided, the default implementation is:
   *
   *   (type) => [
   *      new RegExp(`(?:interface|type|class)\\s+(${type.name})\\W`, "g"),
   *      new RegExp(`\\w*(?<!(?:const\\s+))enum\\s+(${type.name})\\W`, "g"),
   *   ]
   *
   */
  typeMatch?: (
    type: GraphQLNamedType,
    defaultRegex: RegExp
  ) => RegExp | RegExp[];
  /**
   * A list of typesNames or regular expressions matching type names
   * that should be resolved by this import. Provide an empty array if you
   * wish to use the file for context and ensure no other types are matched.
   */
  onlyTypes?: (string | RegExp)[];
  /**
   * By default the import is configured 'import * as alias from', setting glob to false
   * will change this to 'import alias from'
   */
  glob?: false;
}
```

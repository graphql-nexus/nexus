---
id: type-generation
title: Type Generation Details
sidebar_label: Type Generation Details
---

This is the most important piece to understand to get the most out of Nexus. It is relevant to JavaScript as well as TypeScript users, as tools like VSCode and `// @ts-check` can utilize these types to aid in autocomplete or type-checking. A core goal of Nexus is to have the best possible type coverage with the least possible manual type annotation.

## Overview

Nexus was designed with TypeScript in mind. In order to fully typecheck our GraphQL objects, we need to generate a number of types that combine the schema, any type or field configuration provided, and the GraphQL resolution algorithm to create as much type-safety as possible without any additional work importing and assigning types throughout the codebase.

## Root Types

A **root type** is a type representation of the value used to resolve the fields of an object type. It is the object that will be passed as the first argument of `resolve`. It can be a plain JS object, a database model, a mongoose document, a JS class, anything that fulfills the contract defined by the GraphQL object type, based on the field definitions.

Scalars can also have backing types, representing the value they are parsed into.

Sometimes GraphQL types are passthrough, and don't have a dedicated type backing them. One such case would be in the `Edge` of a Relay style pagination. In this case, Nexus will generate a type-definition which makes assumptions of the necessary value to fulfill the contract. If this is incorrect, you can always provide a concrete type for the object.

## Field Type

A **field type** is the valid return value used to a field on an object type. In GraphQL, promises can be returned at every level of the type resolution, so we wrap the types in a `MaybePromiseDeep<T>` type to express this.

## Configuring our types

The [Ghost Example](https://github.com/prisma-labs/nexus/blob/develop/examples/ghost/src/ghost-schema.ts) is the best to look at for an example of how we're able to capture the types from existing runtime objects or definitions and merge them with our schema.

The [makeSchema](api-makeSchema.md) takes several options which helps us find the types we need to import into our generated schema, and customize where these generated types are output. Read more about the API [here](api-makeSchema.md).

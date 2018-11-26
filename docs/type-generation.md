---
id: type-generation
title: Type Generation Details
sidebar_label: Type Generation Details
---

This is relevant to JavaScript as well as TypeScript users, as the Intellisense of tools like VSCode can utilize these types to aid in autocomplete. The goal is to have the best possible type coverage with the least possible manual type annotation.

## Overview

GraphQLiteral was designed with TypeScript in mind. In order to fully typecheck our GraphQL objects, we need to generate a number of types that combine the schema, any type or field configuration provided, and the GraphQL resolution algorithm to create as much type-safety as possible without any additional work importing and assigning types throughout the codebase.

## Backing Types

A **backing type** is a type representation of the value used to resolve the fields of a GraphQL object type. In GraphQL terminology this is the `rootValue` for the object. Other tools like Prisma refer to this as a `model`.

Whatever you want to call it, just think of it as the object that will be passed as the first argument of `resolve`. It can be a plain JS object, a database model, a mongoose document, a JS class, anything that fulfills the contract defined by the GraphQL object type, based on
the field definitions.

Sometimes GraphQL types are passthrough, and don't have a dedicated type backing them. One such case would be in the `Edge` of a Relay style pagination. In this case, GraphQLiteral will generate a type-definition which makes assumptions of the necessary value to fulfill the contract. If this is incorrect, you can always provide a concrete type for the resolver.

> In the case of default resolve functions, we will lose type safety if the
> backing type is not defined. For this reason, defining a backing type is required
> for any object with a type-level resolver. If you wish to disable this behavior,
> add `strict: false` to the options for the schema.

## Return Type

A **return type** is the valid return value used to a field on an object type. In GraphQL, promises can be returned at every level of the type resolution and it will automatically handle them, so for this reason properly typing a return type can be tricky. If the **backing type** is explicitly defined, we'll assume the returned value should be that. Otherwise we'll check for any of the more esoteric combinations of promises and values as GraphQL permits.

## Field Args, Input Types, and Enums

These types are straightforward, they are just representations of their concrete representations.

## Custom Resolvers

When you define a custom resolver for a type, you are intentionally replacing the algorithm GraphQL uses to resolve field members.

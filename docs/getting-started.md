---
id: getting-started
title: GraphQL Nexus
sidebar_label: Getting Started
---

Robust, composable type definition for GraphQL in TypeScript/JavaScript.

GraphQL Nexus aims to combine the simplicity and ease of development of SDL development approaches like [graphql-tools](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) with the long-term maintainability of programmatic construction, as seen in [graphene-python](https://docs.graphene-python.org/en/latest/), [graphql-ruby](https://github.com/rmosolgo/graphql-ruby), or [graphql-js](https://github.com/graphql/graphql-js).

Nexus builds upon the primitives of `graphql-js`, and similar to the schema-first approach, utilizes the type names rather than concrete object references to build the schema.

What this means is you won't end up with a ton of confusing imports just to build out your types, side-stepping the dreaded circular import problem.

GraphQL Nexus was designed with TypeScript/JavaScript intellisense in mind, and combines TypeScript generics, conditional types, and type merging to provide full auto-generated type coverage out of the box.

Check out the [example projects](https://github.com/graphql-nexus/nexus/tree/develop/examples) to get some ideas of what this looks like in practice, or try it out in the [playground](../playground) to see what we mean!

## Installation

GraphQL Nexus requires that `graphql` it be installed as a peer dependency. It can be installed with either `npm` or `yarn`.

`yarn add nexus graphql`

or

`npm i --save nexus graphql`

## Building a Schema

As documented in the [API reference](../api-reference) GraphQL Nexus provides a consistent, scalable approach to defining GraphQL types in code. Fields are referred to by their GraphQL defined name.

```js
import { objectType, stringArg, fieldArg, makeSchema } from "nexus";

const Query = objectType("Query", (t) => {
  t.field("account", "Account", {
    args: {
      name: stringArg(),
      status: fieldArg("StatusEnum"),
    },
  });
  t.field("accountsById", "Account", {
    list: true,
    args: {
      ids: intArg({ list: true }),
    },
  });
  t.field("accounts", "AccountConnection", {
    args: {
      limit: intArg({ required: true }),
    },
  });
});

const Node = objectType("Node", (t) => {
  t.id("id", { description: "Unique identifier for the resource" });
});

const Account = objectType("Account", (t) => {
  t.implements("Node");
  t.string("username");
  t.string("email");
});

const StatusEnum = enumType("StatusEnum", ["ACTIVE", "DISABLED"]);

const schema = makeSchema({
  types: [Account, Node, Query, StatusEnum],
  // or types: { Account, Node, Query }
  // or types: [Account, [Node], { Query }]
  // This is intentionally a very permissive API :)
});
```

> The schema expects an Object named `Query` is defined at the top-level.

## Nullability & Default Values

_tl;dr - GraphQL Nexus assumes output fields are non-null by default_

One benefit of GraphQL is the strict enforcement and guarentees of null values it provides in the type definitions. One opinion held by GraphQL is that fields should be considered nullable by default.

The GraphQL documentation provides [this explanation](https://graphql.org/learn/best-practices/#nullability):

> ... in a GraphQL type system, every field is nullable by default. This is because there are many things which can go awry in a networked service backed by databases and other services. A database could go down, an asynchronous action could fail, an exception could be thrown. Beyond simply system failures, authorization can often be granular, where individual fields within a request can have different authorization rules.

GraphQL Nexus breaks slightly from this convention, and instead assumes by all fields are "non-null" unless otherwise specified with a `nullable` option set to `true`. It also assumes all arguments are nullable unless `required` is set to true.

The rationale being that for most applications, the case of returning `null` to mask errors and still properly handle this partial response is exceptional, and should be handled as such by manually defining these places where a schema could break in this regard.

If you find yourself wanting this the other way around, there is a `nullability` option for the `makeSchema` which will make all fields nullable unless `required: true` (an alias for `nullable: false`) is specified during field definition.

This can also be configured on a per-type basis, using the `nullability` method on the type definition object. This comes in handy where you know you want

#### default

Enforcing non-null guarantees at the resolver layer can be tedious, so GraphQL Nexus also provides a `default` option; a value used when the resolved type is otherwise `null` or `undefined`. Providing the `default` will set the schema definition for the field to non-null regardless of root schema configuration, unless `nullable: true` is set explicitly on the field.

```ts
const AccountInfo = objectType("AccountInfo", (t) => {
  t.string("description", { default: "N/A" });
  t.int("linkedAccountId", { nullable: true });
});
```

## Resolving: Inline Function

One common idiom in GraphQL is exposing fields that mask or rename the property name on the backing object. GraphQL Nexus makes this simple by allowing a function as the second parameter to the resolver function.

```ts
const User = objectType("User", (t) => {
  t.id("id", (o) => o.user_id);
  t.id("name", (o) => o.user_name);
  t.id("description", (o) => o.user_description);
});
```

When using the TypeScript, configuring the [backing object type](type-generation.md#backing-types) definitions will check for the existence of the property on the object, and error if a non-existent property is referenced.

## Type Mixing

When hand constructing schemas in a GraphQL Schema Definition Language (SDL) file, one of the big pain points is making a change to multiple types at once, for instance when adding a field to an interface. Changing types, keeping consistent descriptions, field deprecation are all difficult when you're maintaining this by hand.

## Auto-Generated Artifacts

When you make a change to your GraphQL schema it is useful to see how exactly this changes the contract of the API, or the associated typings.

GraphQL Nexus takes care of this for you, simply provide a path to where you want these files to be output and it will auto-generate them when the server starts. By default, this only occurs when `process.env.NODE_ENV !== "production"`.

```js
const schema = makeSchema({
  types: [
    /* All schema types provided here */
  ],
  outputs: {
    schema: path.join(__dirname, "../../my-schema.graphql"),
    typegen: path.join(__dirname, "../../my-generated-types.d.ts"),
  },
});
```

Read more about how the automatic [type generation](type-generation.md) works.

<blockquote class="good">
Although your <code>.graphql</code> file is generated, we recommend you check the file into source control. This gives you visibility into how changes in type construction affect the schema consumed by the end-user.
</blockquote>

## Type-Level defaultResolver

<blockquote class="warn">
<b>Warning:</b>

Specifying a defaultResolver for a type can have unintended consequences, and makes it harder to statically type. It is only recommended for advanced use-cases.

</blockquote>

GraphQL Nexus allows you to define an override to the `defaultResolver` on a per-type basis.

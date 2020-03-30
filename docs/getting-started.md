---
id: getting-started
title: GraphQL Nexus
sidebar_label: Getting Started
---

Robust, composable type definition for GraphQL in TypeScript/JavaScript.

<blockquote class="warn">
<b>Note:</b>

The documentation is very new and may contain some gaps, please help us fill them in by opening issues or better yet, pull-requests when you think something could be explained better. The [examples](https://github.com/graphql-nexus/nexus/tree/develop/examples) are a great place to look to better understand how the library can be used.

</blockquote>

GraphQL Nexus aims to combine the simplicity and ease of development of SDL development approaches like [graphql-tools](https://www.apollographql.com/docs/graphql-tools/generate-schema.html) with the long-term maintainability of programmatic construction, as seen in [graphene-python](https://docs.graphene-python.org/en/latest/), [graphql-ruby](https://github.com/rmosolgo/graphql-ruby), or [graphql-js](https://github.com/graphql/graphql-js).

Nexus builds upon the primitives of `graphql-js`, and attempts to take the simplicity of the SDL schema-first approach and pair it with the power of having the full language runtime at your disposal.

GraphQL Nexus was designed with TypeScript/JavaScript intellisense in mind, and combines TypeScript generics, conditional types, and type merging to provide full auto-generated type coverage out of the box.

Check out the [example projects](https://github.com/graphql-nexus/nexus/tree/develop/examples) to get some ideas of what this looks like in practice, or try it out in the [playground](../playground) to see what we mean!

## Installation

GraphQL Nexus can be installed with either `npm` or `yarn`.

<!--DOCUSAURUS_CODE_TABS-->
<!--npm-->

```sh
npm install nexus
npm install graphql # required as a peer dependency
```

<!--yarn-->

```sh
yarn add nexus
yarn add graphql # required as a peer dependency
```

<!--END_DOCUSAURUS_CODE_TABS-->

## Building an Example Schema

As documented in the [API reference](api-core-concepts.md) GraphQL Nexus provides a consistent, scalable approach to defining GraphQL types in code.

```js
import {
  objectType,
  interfaceType,
  queryType,
  stringArg,
  enumType,
  intArg,
  arg,
  makeSchema,
} from "@nexus/schema";

const Node = interfaceType({
  name: "Node",
  definition(t) {
    t.id("id", { description: "Unique identifier for the resource" });
    t.resolveType(() => null);
  },
});

const Account = objectType({
  name: "Account",
  definition(t) {
    t.implements(Node); // or t.implements("Node")
    t.string("username");
    t.string("email");
  },
});

const StatusEnum = enumType({
  name: "StatusEnum",
  members: ["ACTIVE", "DISABLED"],
});

const Query = queryType({
  definition(t) {
    t.field("account", {
      type: Account, // or "Account"
      args: {
        name: stringArg(),
        status: arg({ type: "StatusEnum" }),
      },
    });
    t.list.field("accountsById", {
      type: Account, // or "Account"
      args: {
        ids: intArg({ list: true }),
      },
    });
  },
});

// Recursively traverses the value passed to types looking for
// any valid Nexus or graphql-js objects to add to the schema,
// so you can be pretty flexible with how you import types here.
const schema = makeSchema({
  types: [Account, Node, Query, StatusEnum],
  // or types: { Account, Node, Query }
  // or types: [Account, [Node], { Query }]
});
```

## Nullability & Default Values

_tl;dr - GraphQL Nexus assumes output fields are non-null by default_

One benefit of GraphQL is the strict enforcement and guarantees of null values it provides in the type definitions. One opinion held by GraphQL is that fields should be considered nullable by default.

The GraphQL documentation provides [this explanation](https://graphql.org/learn/best-practices/#nullability):

> ... in a GraphQL type system, every field is nullable by default. This is because there are many things which can go awry in a networked service backed by databases and other services. A database could go down, an asynchronous action could fail, an exception could be thrown. Beyond simply system failures, authorization can often be granular, where individual fields within a request can have different authorization rules.

GraphQL Nexus breaks slightly from this convention, and instead assumes by all fields are "non-null" unless otherwise specified with a `nullable` option set to `true`. It also assumes all input types (fields/args) are nullable unless `required` is set to true.

The rationale being that for most applications, the case of returning `null` to mask errors and still properly handle this partial response is exceptional, and should be handled as such by manually defining these places where a schema could break in this regard.

If you find yourself wanting this the other way around, there is a `nonNullDefaults` option for the `makeSchema` which will make all fields nullable unless `required: true` (an alias for `nullable: false`) is specified during field definition.

This can also be configured on a per-type basis, using the `nonNullDefaults` option on the type definition object. This can be handy if you find yourself adding `{ nullable: true }` to many fields of an output object type, or `{required: true}` to many arguments.

## Resolving: Inline Function

One common idiom in GraphQL is exposing fields that mask or rename the property name on the backing object. GraphQL Nexus makes this simple by allowing a function as the second parameter to any built-in scalar resolver function.

```ts
const User = objectType({
  name: "User",
  definition(t) {
    t.id("id", (o) => o.user_id);
    t.string("name", (o) => o.user_name);
    t.string("description", (o) => o.user_description);
  },
});
```

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

## Testing Nexus

Nexus encourages separating your domain logic from the actual resolvers via context, so you should be able to test and reuse your application logic independent of GraphQL. See the use of the [data-sources](https://github.com/prisma-labs/nexus/tree/develop/examples/ghost/src/data-sources) in the ghost example for a start on how you might structure your data layer.

More info about testing patterns for GraphQL will be coming soon.

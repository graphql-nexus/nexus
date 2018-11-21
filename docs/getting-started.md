---
id: getting-started
title: GQLiteral
sidebar_label: Getting Started
---

Robust, composable type definition for GraphQL in TypeScript/JavaScript.

GQLiteral aims to combine the simplicity and ease of development of schema-first development approaches (like [graphql-tools](https://www.apollographql.com/docs/graphql-tools/generate-schema.html)) with the long-term maintainability of tools like [graphene-python](https://docs.graphene-python.org/en/latest/), or [graphql-ruby](https://github.com/rmosolgo/graphql-ruby), or [graphql-js](https://github.com/graphql/graphql-js).

It builds upon the primitives of `graphql-js` and similar to the schema-first approach, it uses the type names rather than per-type object references to build the schema. What this means is you won't end up with a ton of confusing imports just to build out your types, side-stepping the dreaded circular import problem.

GQLiteral was designed with TypeScript/JavaScript intellisense in mind, and makes use of TypeScript generics, conditional types, and type merging to provide as much type coverage as possible out of the box. Read more about how you can [configure](typescript-setup.md) your project to best take advantage of this.

## Installation

GQLiteral requires that `graphql` it be installed as a peer dependency. It can be installed with either `npm` or `yarn`.

```sh
yarn add gqliteral graphql-js
```

```sh
npm i --save gqliteral graphql-js
```

## Building a Schema

As documented in the [API reference](api-reference.md) GQLiteral provides a consistent, scalable approach to defining GraphQL types in code. Fields are referred to by their GraphQL defined name.

The schema requires that an Object named `Query` be provided at the top-level.

```js
const Query = objectType("Query", (t) => {
  t.field("account", "Account", {
    args: {
      name: t.stringArg({
        description:
          "Providing the name of the account holder will search for accounts matching that name",
      }),
      status: t.fieldArg("StatusEnum"),
    },
  });
  t.field("accountsById", "Account", {
    list: true,
    args: {
      ids: t.intArg({ list: true }),
    },
  });
  t.field("accounts", "AccountConnection", {
    args: {
      limit: t.intArg({ required: true }),
    },
  });
});

const Node = objectType("Node", (t) => {
  t.id("id", { description: "Node ID" });
});

const UserFields = GQLiteralAbstractType((t) => {
  t.string("username");
  t.string("email");
});

const Account = objectType("Account", (t) => {
  t.implements("Node");
  t.mix(UserFields);
});

const schema = buildSchema({
  types: [Account, Node, Query],
});
```

## Nullability & Default Values

One benefit of GraphQL is the strict enforcement and guarentees of null values it provides in the type definitions. One opinion held by GraphQL is that fields should be considered nullable by default. The GraphQL documentation provides [this explanation](https://graphql.org/learn/best-practices/#nullability):

> However in a GraphQL type system, every field is nullable by default. This is because there are many things which can go awry in a networked service backed by databases and other services. A database could go down, an asynchronous action could fail, an exception could be thrown. Beyond simply system failures, authorization can often be granular, where individual fields within a request can have different authorization rules.

`GQLiteral` breaks slightly from this convention, and instead assumes by all fields are "non-null" unless otherwise specified with a `nullable` option set to `true`. It also assumes all arguments are nullable unless `required` is set to true.

The rationale being that for most applications, the case of returning `null` to mask errors and still properly handle this partial response is exceptional, and should be handled as such by manually defining these places where a schema could break in this regard.

If you find yourself wanting this the other way around, there is a `defaultNull` option for the `buildSchema` which will make all fields nullable unless `nullable: false` is specified during field definition.

This can also be configured on a per-type basis, using the `defaultNull` method on the type definition object. This comes in handy where you want to "mix" an `AbstractType` into an `ObjectType` and an `InputObjectType`, and the fields should be considered nullable by default on input, and required by default on output.

```

```

#### default

Enforcing non-null guarantees at the resolver layer can be tedious, so GQLiteral also provides a `default` option; a value used when the resolved type is otherwise `null` or `undefined`. Providing the `default` will set the schema definition for the field to non-null regardless of root schema configuration, unless `nullable: true` is set explicitly on the field.

```ts
const AccountInfo = objectType("AccountInfo", (t) => {
  t.string("description", { default: "N/A" });
  t.int("linkedAccountId", { nullable: true });
});
```

## Type Mixing

When hand constructing schemas in a GraphQL Interface Definition Language (IDL) file, one of the big pain points is making a change to multiple types at once, for instance when adding a field to an interface. Changing types, keeping consistent descriptions, field deprecation are all difficult when you're maintaining this by hand.

## AbstractType

Have you ever found yourself re-using the same set of fields in multiple types, but it doesn't necessarily warrant the ceremony of being a named `interface` type? Or maybe you have a set of fields that are mirrored in both the input & output.

## Resolving: Property

One common idiom in GraphQL is exposing fields that mask or rename the property name on the backing object. GQLiteral provides a `property` option on the field configuration object, for conveniently accessing an object property without needing to define a resolver function.

```ts
const User = objectType("User", (t) => {
  t.id("id", { property: "user_id" });
  t.id("name", { property: "user_name" });
  t.id("description", { property: "user_description" });
});
```

When using the TypeScript, configuring the [backing object type](typescript-setup.md) definitions will check for the existence of the property on the object, and error if a non-existent property is referenced.

## Resolving: defaultResolver

GQLiteral allows you to define an override to the `defaultResolver` on a per-type basis. This can be quite powerful when you wish to define unique default behavior that goes beyond

## Generating the IDL file

When making a change to GraphQL it is often beneficial to see how exactly this changes the output types. GQLiteral makes this simple, provide a path to where you want the schema file to be output and this file will automatically be generated when `process.env.NODE_ENV === "development"`.

```js
const schema = buildSchema({
  types: [
    /* All schema types provided here */
  ],
  definitionFile: path.join(__dirname, "../../schema.graphql"),
});
```

It is recommended that although your `graphql` file is generated, you check the file into source control. This gives you visibility into how changes in type construction affect the

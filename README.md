# Nexus Schema

[![CircleCI](https://img.shields.io/circleci/build/github/graphql-nexus/schema)](https://circleci.com/gh/graphql-nexus/schema)
[![npm version](https://badge.fury.io/js/%40nexus%2Fschema.svg)](https://badge.fury.io/js/%40nexus%2Fschema)

Declarative, code-first and strongly typed GraphQL schema construction for TypeScript & JavaScript

> **Note**
>
> The `nexus` package is becoming the Nexus framework. Learn more about the transition in [#373](https://github.com/prisma-labs/nexus/issues/373). Learn how to migrate your app to the framework in the [migration guide](/getting-started/migrate-from-nexus-schema). Don't worry, you will be able to continue using this schema component standalone.

## Overview

- **Code-first**: Programmatically define your GraphQL types in JavaScript/TypeScript
- **Compatible with the GraphQL ecosystem**: Nexus is based on `graphql-js`
- **Type-safe**: Nexus enables auto-completion and error checks in your IDE (even for JS)
- **Generates SDL & TS definitions**: SDL schema and typings are updated as you code

## Examples

**"Hello World" GraphQL server with `graphql-yoga`**

```ts
import { queryType, stringArg, makeSchema } from "@nexus/schema";
import { GraphQLServer } from "graphql-yoga";

const Query = queryType({
  definition(t) {
    t.string("hello", {
      args: { name: stringArg({ nullable: true }) },
      resolve: (parent, { name }) => `Hello ${name || "World"}!`,
    });
  },
});

const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: __dirname + "/generated/schema.graphql",
    typegen: __dirname + "/generated/typings.ts",
  },
});

const server = new GraphQLServer({
  schema,
});

server.start(() => `Server is running on http://localhost:4000`);
```

All examples of Nexus Schema can be found in the [`/examples`](./examples) directory:

- [githunt-api](./examples/githunt-api)
- [ts-ast-reader](./examples/ts-ast-reader)
- [apollo-fullstack](./examples/apollo-fullstack)
- [star-wars](./examples/star-wars)
- [kitchen-sink](./examples/kitchen-sink)

## Features

- Expressive, declarative API for building schemas
- No need to re-declare interface fields per-object
- Optionally possible to reference types by name (with autocomplete) rather than needing to import every single piece of the schema
- Assumes non-null by default, but makes this configurable on per-schema/per-type basis
- Interoperable with vanilla `graphql-js` types, and it's _just_ a [`GraphQLSchema`](https://graphql.org/graphql-js/type/#graphqlschema) so it fits in just fine with existing community solutions of `apollo-server`, `graphql-middleware`, etc.
- Inline function resolvers for when you need to do simple field aliasing
- Auto-generated graphql SDL schema, great for when seeing how any code changes affected the schema
- Lots of good [examples](https://github.com/prisma-labs/nexus/tree/develop/examples) to get you started and thorough [API documentation](https://nexus.js.org/docs/api-core-concepts)
- Full type-safety for free
- Internal structure allows library authors to build more advanced abstractions
- Independent from Prisma, but integrates nicely using the [`nexus-prisma`](https://github.com/prisma-labs/nexus-prisma) plugin
- Allows code re-use by creating higher level "functions" which wrap common fields

## Documentation

You can find the docs for Nexus Schema [here](https://nexus.js.org).

## Install

Nexus Schema can be installed via the `@nexus/schema` package. It also requires `graphql` as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/):

```
npm install --save @nexus/schema graphql
```

or

```
yarn add @nexus/schema graphql
```

## Migrate from SDL

If you've been following an [SDL-first](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/) approach to build your GraphQL server and want to see what your code looks like when written with GraphQL Nexus, you can use the [**SDL converter**](https://nexus.js.org/converter):

![](https://imgur.com/AbkFWNO.png)

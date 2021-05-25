# Nexus

[![trunk](https://github.com/graphql-nexus/nexus/workflows/trunk/badge.svg)](https://github.com/graphql-nexus/nexus/actions/workflows/trunk.yml)
[![npm version](https://badge.fury.io/js/%40nexus%2Fschema.svg)](https://badge.fury.io/js/%40nexus%2Fschema)

Declarative, code-first and strongly typed GraphQL schema construction for TypeScript & JavaScript.

## Installation

```
npm install nexus graphql
```

Note you must also add `graphql`. Nexus pins to it as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/).

## Features

- **Expressive, declarative API for building schemas**
- **Full type-safety for free**
- **Powerful plugin system**
- **No need to re-declare interface fields per-object**
- **Optionally possible to reference types by name (with autocomplete)**  
  Rather than needing to import every single piece of the schema
- **Interoperable with vanilla `graphql-js` types, and it's _just_ a [`GraphQLSchema`](https://graphql.org/graphql-js/type/#graphqlschema)**  
  So it fits in just fine with existing community solutions of `apollo-server`, `graphql-middleware`, etc.
- **Inline function resolvers**  
  For when you need to do simple field aliasing
- **Auto-generated graphql SDL schema**  
  Great for when seeing how any code changes affected the schema
- **DRY-up schema design**  
  Create higher level "functions" which wrap common fields

## Example

```ts
import { queryType, stringArg, makeSchema } from 'nexus'
import { GraphQLServer } from 'graphql-yoga'

const Query = queryType({
  definition(t) {
    t.string('hello', {
      args: { name: stringArg() },
      resolve: (parent, { name }) => `Hello ${name || 'World'}!`,
    })
  },
})

const schema = makeSchema({
  types: [Query],
  outputs: {
    schema: __dirname + '/generated/schema.graphql',
    typegen: __dirname + '/generated/typings.ts',
  },
})

const server = new GraphQLServer({
  schema,
})

server.start(() => `Server is running on http://localhost:4000`)
```

More examples can be found in the [`/examples`](./examples) directory:

- [githunt-api](./examples/githunt-api)
- [ts-ast-reader](./examples/ts-ast-reader)
- [apollo-fullstack](./examples/apollo-fullstack)
- [star-wars](./examples/star-wars)
- [kitchen-sink](./examples/kitchen-sink)

## Documentation

You can find the docs for Nexus [here](http://nexusjs.org/).

## Migrate from SDL

If you've been following an [SDL-first](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/) approach to build your GraphQL server and want to see what your code looks like when written with GraphQL Nexus, you can use the [**SDL converter**](https://nexus.js.org/converter).

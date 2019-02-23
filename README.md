<p align="center"><a href="https://nexus.js.org"><img src="https://i.imgur.com/Y5BgDGl.png" width="150" /><a></p>

# GraphQL Nexus

Declarative, code-first and strongly typed GraphQL schema construction for TypeScript & JavaScript

> GraphQL Nexus is independent from Prisma. To learn how it can best be combined with Prisma, check out the [`nexus-prisma`](https://github.com/prisma/nexus-prisma) plugin.

## Overview

- **Code-first**: Programmatically define your GraphQL types in JavaScript/TypeScript
- **Compatible with the GraphQL ecosystem**: Nexus is based on `graphql-js`
- **Type-safe**: Nexus enables auto-completion and error checks in your IDE (even for JS)
- **Generates SDL & TS definitions**: SDL schema and typings are updated as you code

## Features

- Expressive, declarative API for building schemas
- No need to re-declare interface fields per-object
- Optionally possible to reference types by name (with autocomplete) rather than needing to import every single piece of the schema
- Assumes non-null by default, but makes this configurable on per-schema/per-type basis
- Interoperable with vanilla `graphql-js` types, and it's _just_ a [`GraphQLSchema`](https://graphql.org/graphql-js/type/#graphqlschema) so it fits in just fine with existing community solutions of `apollo-server`, `graphql-middleware`, etc.
- Inline function resolvers for when you need to do simple field aliasing
- Auto-generated graphql SDL schema, great for when seeing how any code changes affected the schema
- Lots of good [examples](https://github.com/prisma/nexus/tree/develop/examples) to get you started and thorough [API documentation](https://nexus.js.org/docs/api-core-concepts)
- Full type-safety for free
- Internal structure allows library authors to build more advanced abstractions
- Independent from Prisma, but integrates nicely using the [`nexus-prisma`](https://github.com/prisma/nexus-prisma) plugin
- Allows code re-use by creating higher level "functions" which wrap common fields

## Documentation

You can find the docs for GraphQL Nexus [here](https://nexus.js.org).

## CI

[![CircleCI](https://circleci.com/gh/prisma/nexus.svg?style=svg)](https://circleci.com/gh/prisma/nexus)

## Install

GraphQL Nexus can be installed via the `nexus` package. It also requires `graphql` as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/):

```
npm install --save nexus graphql
```

or

```
yarn add nexus graphql
```

## Migrate from SDL

If you've been following an [SDL-first](https://www.prisma.io/blog/the-problems-of-schema-first-graphql-development-x1mn4cb0tyl3/) approach to build your GraphQL server and want to see what your code looks like when written with GraphQL Nexus, you can use the [**SDL converter**](https://nexus.js.org/converter):

![](https://imgur.com/AbkFWNO.png)

## Examples

All examples of GraphQL Nexus can be found in the [/examples](https://github.com/prisma/nexus/tree/develop/examples) directory.

<Details>
<Summary>Example: Hello World (with `graphql-yoga`)</Summary>

```ts
import { queryType, stringArg, makeSchema } from "nexus";
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

</Details>

<Details>
<Summary>Example: Star Wars</Summary>

```ts
import { interfaceType, objectType, enumType, arg, stringArg } from "nexus";

export const Character = interfaceType({
  name: "Character",
  definition: (t) => {
    t.string("id", { description: "The id of the character" });
    t.string("name", { description: "The name of the character" });
    t.list.field("friends", {
      type: Character,
      description:
        "The friends of the character, or an empty list if they have none.",
      resolve: (character) => getFriends(character),
    });
    t.list.field("appearsIn", {
      type: "Episode",
      description: "Which movies they appear in.",
      resolve: (o) => o.appears_in,
      args: {
        id: idArg({ required: true }),
      },
    });
    t.resolveType((character) => character.type);
  },
});

export const Droid = objectType({
  name: "Droid",
  description: "A mechanical creature in the Star Wars universe.",
  definition(t) {
    t.implements(Character);
    t.string("primaryFunction", {
      description: "The primary function of the droid.",
      resolve: (o) => o.primary_function || "N/A",
    });
  },
});

const OriginalEpisodes = [
  { name: "NEWHOPE", value: 4, description: "Released in 1977." },
  { name: "EMPIRE", value: 5, description: "Released in 1980." },
  { name: "JEDI", value: 6, description: "Released in 1983" },
];

export const Episode = enumType({
  name: "Episode",
  description: "One of the films in the Star Wars Trilogy",
  members: OriginalEpisodes,
});

export const Human = objectType({
  name: "Human",
  description: "A humanoid creature in the Star Wars universe.",
  definition(t) {
    t.implements(Character);
    t.string("homePlanet", {
      nullable: true,
      description: "The home planet of the human, or null if unknown.",
      resolve: (o) => o.home_planet || null,
    });
  },
});

const characterArgs = {
  id: stringArg({
    required: true,
    description: "id of the character",
  }),
};

const heroArgs = {
  episode: arg({
    type: "Episode",
    description:
      "If omitted, returns the hero of the whole saga. If provided, returns the hero of that particular episode.",
  }),
};

// or queryType({...
export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("hero", {
      type: Character,
      args: heroArgs,
      resolve: (_, { episode }) => getHero(episode),
    });
    t.field("human", {
      type: Human,
      args: characterArgs,
      resolve: (_, { id }) => getHuman(id),
    });
    t.field("droid", {
      type: Droid,
      args: characterArgs,
      resolve: (_, { id }) => getDroid(id),
    });
  },
});
```

</Details>

---

## License (MIT)

(c) 2018-2019 Tim Griesser

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

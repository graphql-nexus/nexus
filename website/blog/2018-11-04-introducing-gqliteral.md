---
title: Introducing GQLiteral
author: Tim Griesser
authorURL: http://twitter.com/tgriesser
---

## Why GQLiteral?

GQLiteral comes from my experiences building several production grade APIs in GraphQL, ever since the project was initially released. I have been lucky enough to have the opportunity to work in different languages and frameworks while building these tools - namely [graphql-js](https://github.com/graphql/graphql-js), [graphql-tools](https://github.com/graphql/graphql-js) (Apollo), [graphene-python](https://docs.graphene-python.org/en/latest/) and [graphql-ruby](https://github.com/rmosolgo/graphql-ruby).

<!--truncate-->

After working with some of these other toolkits, it felt like the JavaScript implementations were lacking a bit. The schema-first development starts out great, by simply expressing your schema in the GraphQL Interface Definition Language (IDL), and providing resolvers matching to the types as needed you are up and running fast! No need for tons of requires just to get your schema working properly, no

As your schema then grows to hundreds or thousands of types, manually curating these IDL fragments becomes tedious. Documentation changes can be tough. Changes to fields on interfaces can require manual changes to many implementing types, a process that can be quite error prone. GQLiteral looks to split the difference between these approaches, keeping the process as simple as possible while leveraging the runtime to introduce powerful ways of [mixing types]().

The core idea of GQLiteral draws from the simplicity of basing the schema off the IDL - just using the type names to reference types! It's an idea that had been sitting in the back of my head since a PR for resolving interfaces with the [type name](https://github.com/graphql/graphql-js/pull/509) - just haven't taken the time since then to write it all out.

GQLiteral was strongly influenced by [graphene-python](https://docs.graphene-python.org/en/latest/), which was up until now my favorite experience building a GraphQL schema.

Because some features of Python do not exist or do not translate well in JavaScript, namely multiple-inheritance and class metaprogramming, some parts of the API have been reimagined to work well with what the JavaScript does provide us: excellent support for first class functions!

## Project Goals

Developer experience.

## Non-Goals

Opinions on resolvers or context. While I have preferences on how resolvers and context objects should be structured and utilized, this project won't enforce them.

Explicit integration with any ORMs, data-stores, etc.

## Further Reading

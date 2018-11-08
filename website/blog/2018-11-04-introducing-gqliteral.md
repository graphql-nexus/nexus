---
title: Introducing GQLiteral
author: Tim Griesser
authorURL: http://twitter.com/tgriesser
---

## Why GQLiteral?

GQLiteral comes from my experiences building several production APIs in GraphQL, and actively contributing to tooling since the project was initially released. I've been lucky enough to have the opportunity to work in different languages and frameworks while building these APIs - namely [graphql-js](https://github.com/graphql/graphql-js), [graphql-tools](https://github.com/graphql/graphql-js) (Apollo), [graphene-python](https://docs.graphene-python.org/en/latest/) and [graphql-ruby](https://github.com/rmosolgo/graphql-ruby).

<!--truncate-->

After working with the toolkits in other languages, it felt like the JavaScript implementations were lacking a bit. The schema-first development starts out great, by simply expressing your schema in the GraphQL Interface Definition Language (IDL) and providing resolvers matching to the types as needed you are up and running fast! No need for tons of requires or "overhead" to get a GraphQL server running.

As your schema then grows to hundreds or thousands of types, manually curating these IDL fragments becomes tedious. Documentation changes can be tough. Modifying fields on interfaces can require manual changes to many implementing types, a process that can be quite error prone. If only there were a way to combine the simplicity of schema-first development, with the maintainability of the traditional approach. GQLiteral aims to fill that voide, keeping the process as simple as possible while leveraging the runtime to introduce powerful ways of [mixing types](), introducing [type]() or [schema]() wide changes, and much more.

The core idea of GQLiteral draws from basing the schema off the IDL - it uses the type names rather than imports to reference types! It's an idea that had been sitting in the back of my mind since a PR for resolving interfaces with the [type name](https://github.com/graphql/graphql-js/pull/509).

GQLiteral was strongly influenced by [graphene-python](https://docs.graphene-python.org/en/latest/), which until this point has been my favorite experience of building a GraphQL schema.

Because some features of Python do not exist or do not translate well in JavaScript, namely multiple-inheritance and class metaprogramming, some parts of the API have been reimagined to work well with what the JavaScript does provide us: excellent support for first class functions!

## Project Goals

Developer experience.

## Non-Goals

Opinions on resolvers or context. While I have preferences on how resolvers and context objects should be structured and utilized, this project won't enforce them.

Explicit integration with any ORMs, data-stores, etc.

## Further Reading

- [Getting Started]()
- [Simple Example API]()

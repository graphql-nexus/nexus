---
title: Introducing GraphQLiteral
author: Tim Griesser
authorURL: http://twitter.com/tgriesser
---

## Why GraphQLiteral?

GraphQLiteral was born out of from my experiences building several production APIs in GraphQL, and actively contributing to tooling since the project was initially released. I've had the fortune of being able to work in in different languages and frameworks on these projects; one vanilla [graphql-js](https://github.com/graphql/graphql-js), schema-first with [graph.ql](https://github.com/matthewmueller/graph.ql) and [graphql-tools](https://github.com/graphql/graphql-js). Following that with [graphene-python](https://docs.graphene-python.org/en/latest/) and most recently with a bit of [graphql-ruby](https://github.com/rmosolgo/graphql-ruby).

After working with the toolkits in other languages, it felt like the JavaScript implementations were lacking a bit. <!--truncate--> The schema-first development starts out great, by simply expressing your schema in the GraphQL Interface Definition Language (IDL) and providing resolvers matching to the types as needed you are up and running fast! No need for tons of requires or "overhead" to get a GraphQL server running.

As your schema then grows to hundreds or thousands of types, manually curating these IDL fragments becomes tedious. Documentation changes can be tough. Modifying fields on interfaces can require manual changes to many implementing types, a process that can be quite error prone. If only there were a way to combine the simplicity of schema-first development, with the maintainability of the traditional approach. GraphQLiteral aims to fill that voide, keeping the process as simple as possible while leveraging the runtime to introduce powerful ways of [mixing types](), introducing [type]() or [schema]() wide changes, and much more.

The core idea of GraphQLiteral draws from basing the schema off the IDL - it uses the type names as string literals rather than as imported to reference types! How can that be type safe, you might ask? By combining automatic type generation with some of the more powerful features of TypeScript - type merging, conditional types, and type inference, we can know exactly which type names we are able to use in which position. We can know both the parameters and the return type of resolvers without providing any type annotation.

Because some features of Python do not exist or do not translate well in JavaScript, namely multiple-inheritance and class metaprogramming, some parts of the API have been reimagined to work well with what the JavaScript does provide us: excellent support for first class functions!

## Project Goals

Developer experience.

## Non-Goals

The project stays intentionally unopinionated on resolvers or the shape of a context object. It should be a tool you can layer on top of with higher level abstractions or opinions. When you have more information about a database

## Further Reading

- [Getting Started]()
- [Simple Example API]()

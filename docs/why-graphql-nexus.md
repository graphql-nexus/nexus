---
id: why-graphql-nexus
title: Why Nexus?
sidebar_label: Why Nexus?
---

Nexus was born out of my experience building several production GraphQL APIs, in different languages and frameworks. The first with vanilla [graphql-js](https://github.com/graphql/graphql-js), another schema-first with [graph.ql](https://github.com/matthewmueller/graph.ql) and later [graphql-tools](https://github.com/apollographql/graphql-tools). Following that with [graphene-python](https://docs.graphene-python.org/en/latest/) and most recently with a bit of [graphql-ruby](http://graphql-ruby.org/).

After working with the toolkits in other scripting languages, it felt like there was a gap in the JavaScript approaches. Schema-first development starts out great, by simply expressing your schema in the GraphQL Schema Definition Language (SDL) and providing resolvers matching to the types as needed you are up and running fast! No need for tons of requires or "overhead" to get a GraphQL server running.

As your schema then grows to hundreds or thousands of types, manually curating these SDL fragments becomes tedious. Documentation changes can be tough. Modifying fields on interfaces can require manual changes to many implementing types, a process that can be quite error prone.

_If only there were a way to combine the simplicity of schema-first development, with the long-term maintainability of a definition-first approach._

GraphQL Nexus aims to fill that void, making the process as simple as possible while also making good use of the runtime to introduce powerful ways of composing types, introducing type or schema wide changes, and much more.

The core idea of GraphQL Nexus draws from basing the schema off the SDL - keeping things declarative and simple to understand. It allows you to reference the type names as string literals rather than always need to import to reference types (you can do that too if you prefer).

By combining automatic type generation with some of the more powerful features of TypeScript - type merging, conditional types, and type inference, we can know exactly which type names we are referring to and able to use throughout our code. We can know both the parameters and the return type of resolvers without providing any type annotation. It takes a little getting used to, but it ends up leading to a great feedback loop of the types annotating themselves.

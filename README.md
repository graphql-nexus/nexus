## GQLiteral

Simple, strongly typed GraphQL schema construction for TypeScript/JavaScript

Combines the best practices from building real-world GraphQL servers without the boilerplate or excessive imports. Compose types with [abstract types](#GQLiteralAbstractType) and [type mixing](#Type-combination).

Inspired by use of [graphql-tools](https://github.com/apollographql/graphql-tools), [graphene](https://docs.graphene-python.org/en/latest/), and [graphql-ruby](https://github.com/rmosolgo/graphql-ruby).

Provides full control of your schema, with added benefits like dynamic schemas based on user permissions. Check out the `/examples` for some sample uses.

### Installation

```
yarn install gqliteral
```

### Features:

##### Type combination

Ever have a situation where your input types look eerily simliar to your output types, yet you need to define them both by hand in the schema? Or maybe you have an interface shared by several types, and each time you add a field to the interface you need to remember to add it to the types.

##### No circular reference issues

One of the problems with GraphQL construction is the self-referential types and the

##### Awesome intellisense

Leverages type generation internally so you don't have to.

##### Great error messages

We want you to know where things went wrong, not spend time trying to figure out cryptic error messages.

### Non-goals:

Opinions on resolvers.

### Type combination

Ever notice that your input types and output types are usually fairly similar? Maybe the

### License

---
id: best-practices
title: Best Practices
sidebar_label: Best Practices
---

A few tips when using GraphQLiteral to build out a schema

## Consistent file structure for GraphQL type imports

When you have a large schema you'll usually want to break it up into smaller
code chunks. The most common approach is to break up types into files, either one type per file or one file containing multiple types related to an individual type. Here's an example file structure to illustrate this point.

```sh
/src
  /graphql
    user.js
    post.js
    comment.js
  schema.js
```

However you end up structuring your files, they ultimately all need to be imported and passed to the `makeSchema` function, and keeping a consistent approach to file naming makes it simpler

```
import * as userTypes from './graphql/user'
import * as postTypes from './graphql/post'
import * as commentTypes from './graphql/comment'
```

You could also consolidate this in an `index.js` or similar export file:

```
export * from './user'
export * from './post'
export * from './comment'
```

Using that file to build the schema:

```
import * as allTypes from './graphql'

export const schema = makeSchema({
  types: allTypes,
  output: { ... }
})
```

## Configuring built-in type generation, for better intellisense

```ts
const schema = makeSchema({
  types: allTypes,
});
```

## Using .mix to compose types

One of the main features

---
id: best-practices
title: Best Practices
sidebar_label: Best Practices
---

A few tips when using Nexus to build out a schema:

## Configure your development server to auto-restart

The development experience works best when you are using a tool like [Nodemon](https://github.com/remy/nodemon) to restart your application as the schema changes. The GraphQL schema artifact will automatically regenerate when the server restarts in development mode. Check the [/examples](https://github.com/prisma-labs/nexus/tree/develop/examples) to see how they are setup to auto-restart.

## VSCode: Configuring a keyboard shortcut for "Go to Type Definition"

Because the types are derived via conditional type expressions, command-click for the arguments in the resolve function don't quite work as you'd expect. There's another option, "Go To Type Expression" which you can find in the secondary click menu, but it's not bound to a keyboard shortcut by default. I've found it convenient to bind to `cmd+'`

```json
{
  "key": "cmd+'",
  "command": "editor.action.goToTypeDefinition"
}
```

## Consistent file structure for GraphQL type imports

When you have a large schema you'll usually want to break it up into smaller
code chunks. The most common approach is to break up types into files, either one type per file or one file containing multiple types related to an individual type. Here's an example file structure to illustrate this point.

```sh
/src
  /schema
    user.js
    post.js
    comment.js
  index.js
```

However you end up structuring your files, they ultimately all need to be imported and passed to the `makeSchema` function, and keeping a consistent approach to file naming makes it simpler

```ts
import * as userTypes from "./schema/user";
import * as postTypes from "./schema/post";
import * as commentTypes from "./schema/comment";
```

You could also consolidate this in an `index.js` or similar export file:

```ts
export * from "./user";
export * from "./post";
export * from "./comment";
```

Using that file to build the schema:

```ts
import * as allTypes from './schema'

const schema = makeSchema({
  types: allTypes,
  output: { ... }
})
```

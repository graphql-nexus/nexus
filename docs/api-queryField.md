---
id: api-queryField
title: queryField
sidebar_label: queryField
---

Often times you want to split up query fields into different domains of your application, and like [`mutationField`](api-mutationField.md) are another one of the most common use-cases for `extendType`. `queryField` exists as a shorthand for this common case:

```ts
import { stringArg } from "nexus";

export const usersQueryField = queryField("user", {
  type: SomeType,
  args: { id: stringArg({ required: true }) },
  resolve() {
    // ...
  },
});
```

as shorthand for:

```ts
export const createUser = extendType({
  type: "Query",
  definition(t) {
    t.field('user', {
      type: SomeType
      args: { id: stringArg({ required: true }) },
      resolve() {
        // ...
      }
    })
  }
})
```

You can also use it with a function as the first argument, which will pass the `t` provided to the defintion block, especially useful when using with the [connection plugin](plugin-connection.md):

```ts
export const usersQueryField = queryField((t) => {
  t.connectionField("users", {
    type: SomeType,
    resolve() {
      // ...
    },
  });
});
```

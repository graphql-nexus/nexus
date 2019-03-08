---
id: api-queryField
title: queryField
sidebar_label: queryField
---

Often times you want to split up query fields into different domains of your application, and like [`mutationField`](api-mutationField.md) are another one of the most common use-cases for `extendType`. `queryField` exists as a shorthand for this common case:

```ts
export const usersQueryField = queryField("users", {
  type: SomeType,
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
    t.field('users', {
      type: SomeType
      resolve() {
        // ...
      }
    })
  }
})
```

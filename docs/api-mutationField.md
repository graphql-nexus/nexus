---
id: api-mutationField
title: mutationField
sidebar_label: mutationField
---

Mutations are usually best split up, and are one of the most common use-cases for `extendType`. `mutationField` exists as a shorthand for this common case:

```ts
export const createUser = mutationField("createUser", {
  type: SomeType,
  resolve() {
    // ...
  },
});
```

as shorthand for:

```ts
export const createUser = extendType({
  type: "Mutation",
  definition(t) {
    t.field('createUser', {
      type: SomeType
      resolve() {
        // ...
      }
    })
  }
})
```

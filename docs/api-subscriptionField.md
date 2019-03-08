---
id: api-subscriptionField
title: subscriptionField
sidebar_label: subscriptionField
---

Subscriptions are usually best split up, and are one of the most common use-cases for `extendType`. `subscriptionField` exists as a shorthand for this common case:

```ts
export const posts = subscriptionField("posts", {
  type: Post,
  subscribe: (parent, args, context) => {
    //
  },
  resolve: (payload) => {
    //
  },
});
```

as shorthand for:

```ts
export const posts = extendType({
  type: "Subscription",
  definition(t) {
    t.field("posts", {
      type: Post,
      subscribe: (parent, args, context) => {
        //
      },
      resolve: (payload) => {
        //
      },
    });
  },
});
```

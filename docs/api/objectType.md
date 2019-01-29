---
id: objectType
title: objectType
sidebar_label: objectType
hide_title: true
---

# `objectType(typeName: string, fn: (t: ObjectTypeDef) => void)`

The most basic components of a GraphQL schema are object types, which just represent
a kind of object you can fetch from your service, and what fields it has.

```ts
const User = objectType({
  name: "User",
  definition: (t) => {
    t.int("id", { description: "Id of the user" });
    t.string("fullName", { description: "Full name of the user" });
    t.field("status", "StatusEnum");
    t.list.field("posts", {
      type: "Post",
      resolve(root, args, ctx) {
        return ctx.getUser(root.id).posts();
      },
    });
  },
});

const Post = objectType({
  name: "Post",
  definition(t) {
    t.int("id");
    t.string("title");
  },
});

const StatusEnum = enumType({
  name: "StatusEnum",
  members: {
    ACTIVE: 1,
    DISABLED: 2,
  },
});
```

@see https://graphql.github.io/learn/schema/#object-types-and-fields

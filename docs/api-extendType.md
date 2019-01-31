---
id: api-extendType
title: extendType
sidebar_label: extendType
---

Defines a way to incrementally build types, by "extending" a type
from multiple locations in a project

```ts
export const TypeName = extendType({
  type: "Query",
  definition: (t) => {
    t.string("id");
    t.field("user", {
      type: "User",
      args: { id: intArg("id of the user") },
      resolve: (root, args, ctx) => ctx.user.getById(args.id),
    });
  },
});
```

### Type Signature

```

```

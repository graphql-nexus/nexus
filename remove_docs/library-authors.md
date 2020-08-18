---
id: library-authors
title: Library Authors
sidebar_label: Library Authors
---

## Wrapping the API

If you are a library author building tools for GraphQL, it is recommended that you have `nexus` specified as a peer dependency rather than a direct dependency of your wrapping plugin, so duplicate copies of the library are not installed. The simplest way to build things for nexus is just to create higher-order functions which provide apis to abstract common functionality.

One example of this pattern would be for creating relay-style connections:

```ts
export const UserConnectionTypes = connectionType("User");
```

Where `connectionType` is really just a wrapper creating two `objectTypes`:

```ts
import { core, objectType } from "@nexus/schema";

export function connectionType(name: core.AllOutputTypes) {
  const Connection = objectType({
    name: `${name}Connection`,
    definition(t) {
      t.field("edges", { type: `${name}Edge` });
    },
  });
  const Edge = objectType({
    name: `${name}Edge`,
    definition(t) {
      t.id("cursor", (root) => `${name}:${root.id}`);
      t.field("node", { type: name });
    },
  });
  const PageInfo = objectType({
    name: `${name}PageInfo`,
    definition(t) {
      t.boolean("hasNextPage");
      t.boolean("hasPreviousPage");
    },
  });
  return { Connection, Edge, PageInfo };
}
```

All internal apis are also exposed under a `core` namespace for you to use. Note that these may be subject to minor change, though we'll try to be considerate about this. At least there are type-safety guarantees (assuming you're using TypeScript).

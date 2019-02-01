---
id: library-authors
title: Library Authors
sidebar_label: Library Authors
---

## Wrapping the API

If you are a library author building tools for GraphQL, we expose the core types It is recommended that you have `nexus` specified as a peer dependency rather than a direct dependency of your wrapping plugin, so duplicate copies of the library are not installed.

One example of this pattern would be for creating relay-style connections:

```ts
export const UserConnectionTypes = connectionType("User");
```

Where `connectionType` is really just a wrapper creating two `objectTypes`:

```ts
import { core } from './nexus';

export function connectionType(type: core.AllOutputTypes) {
  const Connection = objectType({
    name: `${name}Connection`,
    definition(t) {
      t.field(
        'edges',
        { type: `${name}Edge` }
      );
    });
  })
  const Edge = objectType({
    name: `${name}Edge`,
    definition(t) {
      t.id('cursor', root => `${name}:${root.id}`)
      t.field('node', { type: name });
    }
  });
  const PageInfo = objectType({
    type: `${type}PageInfo`,
    definition(t) {
      t.boolean('hasNextPage')
      t.boolean('hasPreviousPage')
    }
  });
  return { Connection, Edge, PageInfo }
}
```

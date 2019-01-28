---
id: library-authors
title: Library Authors
sidebar_label: Library Authors
---

## Wrapping the API

If you are a library author building tools for GraphQL, we expose the core types It is recommended that you have `nexus` specified as a peer dependency rather than a direct dependency of your wrapping plugin, so duplicate copies of the library are not installed.

One example of this pattern is in `nexus-contrib` where functions for creating relay-style connections are constructed:

```ts
export const UserConnectionTypes = connectionType("User");
```

Where `connectionType` is really just a wrapper creating two `objectType`:

```ts
import { Types } from './nexus';

interface ConnectionConfigFn {
  (
    connection(t: Types.GraphQLNexusObjectType): void,
    edge(t: Types.GraphQLNexusObjectType): void
  ) => void;
}

const PageInfo = objectType({
  type: 'PageInfo',
  definition(t) {
    t.boolean('hasNextPage')
    t.boolean('hasPreviousPage')
  }
})

export function connectionType(name: string, fn?: ConnectionConfigFn) {
  let connectionObj, edgeObj;
  const Connection = objectType({
    name: `${name}Connection`,
    definition(t) {
      t.field(
        'edges',
        // @ts-ignore ...we know the type name exists cause we define it below :)
        `${name}Edge`
      );
    });
  })
  const Edge = objectType(
    name: `${name}Edge`,
    definition(t) {
      t.id('cursor', {
        resolve(root) {
          return `${name}:${root.id}`
        }
      })
      t.field('node', { type: name });
    }
  });
  if (typeof fn === 'function') {
    fn(connectionObj, edgeObj)
  }
  return { Connection, Edge, PageInfo }
}
```

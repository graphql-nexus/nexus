---
id: plugin-connection
title: Connection Plugin
sidebar_label: Connections
---

The connection plugin provides a new method on the object definition builder, enabling paginated associations between types, following the [Relay Connection Specification](https://facebook.github.io/relay/graphql/connections.htm#sec-Node). It provides simple ways to customize fields available on the `Connection`, `Edges`, or `PageInfo` types.

To install, add the `connectionPlugin` to the `makeSchema.plugins` array, along with any other plugins
you'd like to include:

```ts
import { makeSchema, connectionPlugin } from "nexus";

const schema = makeSchema({
  // ... types, etc,
  plugins: [
    // ... other plugins
    connectionPlugin(),
  ],
});
```

By default, the plugin will install a `t.connectionField` method available on the object definition builder:

```ts
export const User = objectType({
  name: "User",
  definition(t) {
    t.connectionField(...);
  },
});
```

## Usage:

There are two main ways to use the connection field, by providing a `nodes` property or providing a `resolve` property:

### With `nodes`:

When providing a `nodes` property, we make some assumptions about the structure of the connection. We only
require you return a list of rows to resolve based on the connection, and then we will automatically infer the `hasNextPage`, `hasPreviousPage`, and `cursor` values for you.

```ts
t.connectionField("users", {
  type: User,
  nodes(root, args, ctx, info) {
    // [{ id: 1,  ... }, ..., { id: 10, ... }]
    return ctx.resolveUsersConnection(root, args, ctx, info);
  },
});
```

There are properties on the plugin to help configure this including, `cursorFromNode`, which allows you to customize how the cursor is created, or `pageInfoFromNodes` to customize how `hasNextPage` or `hasPreviousPage` are set.

### With `resolve`:

If you have custom logic you'd like to provide in resolving the connection, we allow you to instead specify a `resolve` field, which will make not assumptions about how the `edges`, `cursor`, or `pageInfo` are defined. For instance, you can use this with the helpers provided via [graphql-relay-js](https://github.com/graphql/graphql-relay-js).

```ts
export const usersQueryField = queryField((t) => {
  t.connectionField("users", {
    type: User,
    resolve(root, args, ctx, info) {
      return;
    },
  });
});
```

## Pagination Arguments

### Configuring: `disableBackwardPagination` / `disableForwardPagination`

By default we assume that the cursor can paginate in both directions. This is not always something every
API needs or supports, so to turn them off, you can set `disableForwardPagination`, or `disableBackwardPagination` to
true on either the `paginationConfig`, or on the `fieldConfig`.

### Validation

The connection field validates that a `first` or a `last` must be provided, and not both. If you wish to
provide your own validation, supply a `validateArgs` property to either the `connectionPlugin` config, or
to the field configuration directly.

## Multiple Connection Types:

Though you can also configure this, or create multiple connection types with varying defaults, available
under different connections.

Custom Usage:

```ts
import { makeSchema, connectionPlugin } from "nexus";

const schema = makeSchema({
  // ... types, etc,
  plugins: [
    connectionPlugin({
      nexusFieldName: "analyticsConnection",
      extendConnection: {
        totalCount: { type: "Int" },
      },
    }),
    connectionPlugin({}),
  ],
});
```

If you want to include a `nodes` field, which includes the nodes of the connection flattened into an array similar to how GitHub does in their [GraphQL API](https://developer.github.com/v4/), set `includeNodesField` to `true`

```ts
connectionPlugin({
  includeNodesField: true,
});
```

```graphql
query IncludeNodesFieldExample {
  users(first: 10) {
    nodes {
      id
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}
```

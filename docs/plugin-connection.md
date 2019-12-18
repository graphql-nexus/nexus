---
id: plugin-connection
title: Connection Plugin
sidebar_label: Connections
---

The connection plugin provides a new method on the object definition builder, which allows us to
create paginated associations between types, using the [Relay Connection Specification](https://facebook.github.io/relay/graphql/connections.htm#sec-Node).

To install, add the connectionPlugin to the `makeSchema.plugins` array, along with any other plugins
you'd like to include:

```ts
import { makeSchema, connectionPlugin } from "nexus";

const schema = makeSchema({
  // ... types, etc,
  plugins: [connectionPlugin()],
});
```

By default, the plugin will make a `t.connectionField` method available on the object definition builder:

```ts
export const User = objectType({
  name: "User",
  definition(t) {
    t.connectionField(...);
  },
});
```

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
      extendConnection: {},
    }),
    connectionPlugin({}),
  ],
});
```

If you want to include a `nodes` field, which includes the nodes of the connection flattened into an array similar to how
GitHub does in their [GraphQL API](https://developer.github.com/v4/), set

```ts
connectionPlugin({
  includeNodesField: true,
});
```

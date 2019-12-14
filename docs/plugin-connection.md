---
id: plugin-connection
title: Connection Plugin
sidebar_label: Connections
---

Default Usage:

```ts
makeSchema({
  // ... types, etc,
  plugins: [connectionPlugin()],
});
```

```ts
export const User = objectType({
  name: "User",
  definition(t) {
    t.connectionField("friends", {
      type: User,
      // A list of nodes which will be turned into edges with cursors
      nodes(root, args, ctx, info) {
        return ctx.user.getFriends(args);
      },
    });
  },
});
```

Custom Usage:

```ts
```

Plugin Configuration Options:

```ts
type ConnectionPlugin =
  | "spec"
  | {
      /**
       * @default 'connectionField'
       */
      name?: string;
      /**
       * Field description
       */
      description?: string;
      /**
       * Deprecation reason
       */
      deprecated?: string;
      /**
       * Whether we want the inputs to follow the spec, or if we
       * want something different across the board
       * for instance - { input: { pageSize: intArg(), page: intArg() } }
       */
      inputs?: "spec" | Args;
      /**
       * How we want the connection name to be named.
       * Provide this option to override.
       *
       * @default
       *
       * type Organization {
       *   members(...): UserConnection
       * }
       *
       * unless either the `inputs`, `extendEdge`, or `extendConnection`
       * are provided on the field definition - in which case:
       *
       * type Organization {
       *   members(...): OrganizationMembersUserConnection
       * }
       */
      name?: (fieldConfig) => string;
      /**
       * The edge type we want to return
       */
      edgeType?: (fieldConfig) => string;
      /**
       * Whether we want the "edges" field on the connection / need to
       * implement this in the contract.
       *
       * @default true
       */
      edges?: boolean;
      /**
       * Whether we want "pageInfo" field on the connection / need to
       * implement this in the contract.
       *
       * @default true
       */
      pageInfo?: boolean;
      /**
       * Extend *all* edges to include additional fields, beyond cursor.
       */
      extendEdge?: Record<string, { type: resolve }>;
      /**
       * Any additional fields we want to make available to the connection type,
       * beyond what is in the spec / configured above.
       */
      extendConnection?: Record<string, { type: resolve }>;
    };
```

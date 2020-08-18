---
id: nexus-prisma
title: Nexus Prisma
sidebar_label: nexus-prisma
---

## Nexus Prisma

[Docs](https://github.com/prisma-labs/nexus-prisma)

`nexus-prisma` is for bridging [Prisma](https://www.prisma.io) and [Nexus](https://nexus.js.org). It extends the Nexus DSL `t` with `.model` and `.crud` making it easy to project Prisma models and expose operations against them in your GraphQL API. Resolvers are dynamically created for you removing the need for traditional ORMs/query builders like TypeORM, Sequelize, or Knex. Out-of-box features include pagination, filtering, and ordering. When you do need to drop down into custom resolvers a [`Photon`](https://photonjs.prisma.io) instance on `ctx` will be ready to serve you, the same great tool `nexus-prisma` itself bulids upon.

```ts
import { nexusPrismaPlugin } from "nexus-prisma";

makeSchema({
  // ...
  plugin: [nexusPrismaPlugin()],
});
```

If you are still using `nexus-prisma@0.3` / Prisma 1 you can find the old docs [here](https://github.com/prisma-labs/nexus/blob/8cf2d6b3e22a9dec1f7c23f384bf33b7be5a25cc/docs/database-access-with-prisma-v2.md).

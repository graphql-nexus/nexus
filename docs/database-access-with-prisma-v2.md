---
id: database-access-with-prisma-v2
title: Database Access with Prisma 2 (Preview)
sidebar_label: Prisma 2 (Preview)
---

This page explains how to use [Prisma](https://github.com/prisma/prisma) and the [`nexus-prisma`](https://github.com/prisma/nexus-prisma) plugin to connect your GraphQL Nexus resolvers to a database.

## Overview

## What is Prisma?

Prisma is a toolchain replacing traditional ORMs. Developers leverage it to drive their database schemas, migrations, type-safe client access, and more.

Developers use the Prisma Definition Language (PDL) to define their database schema. They use [Photon](https://photonjs.prisma.io/) to derive (generate) type-safe database clients that access that databse. As they invariably evolve their database schema, [Lift](https://lift.prisma.io/) is there to carry out complex migrations as needed.

Developers can start on brand new projects or integrate with existing ones by importing an existing database schema. When paired with GraphQL Nexus, implementing database access in GraphQL resolvers becomes easy and reliable.

More information can be found in the [Prisma docs](https://github.com/prisma/prisma2).

## What is `nexus-prisma`?

[`nexus-prisma`](https://github.com/prisma/nexus-prisma) is a plugin for Nexus. It extends the Nexus DSL making it easy to expose Prisma models and operations against them in your GraphQL schema. Specifically the Nexus `t` is extended with `.model` and `.crud`. The former assists with exposing your Prisma Models as GraphQL Objects. The latter is valid within `Mutation` and `Query` Nexus type blocks and helps you expose operations over your Prisma Models including rich input types to express pagination, ordering, filtering and so forth.

## Examples

You can find a runnable `nexus-prisma` example in the [`nexus-prisma repo`](https://github.com/prisma/nexus-prisma/tree/next/example). The following are isolated snippets to give you a sense for the DSL.

### Exposed Prisma Model

Exposing one of your Prisma models in your GraphQL API

```ts
objectType({
  name: "Post",
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.content();
  },
});
```

### Simple Computed Fields

You can add (computed) fields to a Prisma model using the standard GraphQL Nexus API.

```ts
objectType({
  name: "Post",
  definition(t) {
    t.model.id()
    t.model.title()
    t.model.content()
    t.string("uppercaseTitle", {
      resolve({ title }, args, ctx) {
        return title.toUpperCase(),
      }
    })
  },
})
```

### Complex Computed Fields

If you need more complicated logic for your computed field (e.g. have access to some information from the database), you can use the `photon` instance that's attached to the context and implement your resolver based on that.

```ts
objectType({
  name: 'Post',
  definition(t) {
    t.model.id()
    t.model.content()
    t.string('anotherComputedField', {
      async resolve({ title }, args, ctx) {
        const databaseInfo = await ctx.photon.someModel.someOperation(...)
        const result = doSomething(databaseInfo)
        return result
      }
    })
  }
})
```

### Renamed Prisma Model Fields

```ts
objectType({
  name: "Post",
  definition(t) {
    t.model.id();
    t.model.content({ alias: "body" });
  },
});
```

### Exposed Reads on Model

By default we expose only pagination. Ordering and filtering must be explicitely enabled because of the performance overhead that they might cause.

```ts
queryType({
  definition(t) {
    t.crud.post();
    t.crud.posts({ ordering: true, filtering: true });
  },
});
```

### Exposed Writes on Model

```ts
queryType({
  definition(t) {
    t.crud.createPost();
    t.crud.updatePost();
    t.crud.deletePost();
  },
});
```

### Exposed Customized Reads on Model

If you wish to only expose some filters or orders, you can specify so on the model.

```ts
queryType({
  definition(t) {
    t.model.posts({
      filtering: { id: true, title: true },
      ordering: { title: true },
    });
  },
});
```

### Exposed Model Writes Along Side Photon-Resolved Fields

```ts
mutationType({
  definition(t) {
    t.crud.createUser();
    t.crud.updateUser();
    t.crud.deleteUser();
    t.crud.deletePost();

    t.field("createDraft", {
      type: "Post",
      args: {
        title: stringArg(),
        content: stringArg({ nullable: true }),
      },
      resolve: (parent, { title, content }, ctx) => {
        return ctx.photon.posts.createPost({ title, content });
      },
    });

    t.field("publish", {
      type: "Post",
      nullable: true,
      args: {
        id: idArg(),
      },
      resolve(parent, { id }, ctx) {
        return ctx.photon.posts.updatePost({
          where: { id },
          data: { published: true },
        });
      },
    });
  },
});
```

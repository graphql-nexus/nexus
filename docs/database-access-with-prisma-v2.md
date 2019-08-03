---
id: database-access-with-prisma-v2
title: Database Access with Prisma 2 (Preview)
sidebar_label: Prisma 2 (Preview)
---

This page explains how to use [Prisma](https://github.com/prisma/prisma) and the [`nexus-prisma`](https://github.com/prisma/nexus-prisma) plugin to connect your GraphQL Nexus resolvers to a database.

## Overview

### What is Prisma?

Prisma is a toolchain replacing traditional ORMs. Developers leverage it to drive their database schemas, migrations, type-safe client access, and more.

Developers use the Prisma Definition Language (PDL) to define their database schema. They use [Photon](https://photonjs.prisma.io/) to derive (generate) type-safe database clients that access that databse. As they invariably evolve their database schema, [Lift](https://lift.prisma.io/) is there to carry out complex migrations as needed.

Developers can start on brand new projects or integrate with existing ones by importing an existing database schema. When paired with GraphQL Nexus, implementing database access in GraphQL resolvers becomes easy and reliable.

More information can be found in the [Prisma docs](https://github.com/prisma/prisma2).

### What is the `nexus-prisma` plugin?

[`nexus-prisma`](https://github.com/prisma/nexus-prisma) is a plugin for Nexus that extends its DSL such that you can expose Prisma models when constructing your GraphQL schema. Included in the DSL extension are CRUD functions over each prisma model which are ideal for implementing database access in your resolvers.

![](https://imgur.com/dbEMHd5.png)

### Generated CRUD Functions aka Photon

Before diving into mechanics of the plugin, lets get a sense for what a Photon client API looks like.

Assume you have a `User` type in your Prisma schema:

```groovy
model User {
  id    Int @id
  name  String
}
```

Add the following generators to the schema:

```groovy
generator nexus_prisma {
  provider = "nexus-prisma"
}

generator photon {
  provider = "photonjs"
}

model User {
  id    Int @id
  name  String
}
```

Now, the following functions could be generated as a ready-to-import package:

- **Queries**

  - **`findOneUser(...): User!`**: Returns a single record
  - **`findManyUser(...): [User!]!`**: Returns a list of records

- **Mutations**

  - **`createUser(...): User!`**: Creates a new record
  - **`updateUser(...): User`**: Updates a record
  - **`deleteUser(...): User`**: Deletes a record
  - **`updatesManyUsers(...): BatchPayload!`**: Updates many records in bulk
  - **`deleteManyUsers(...): BatchPayload!`**: Deletes many records in bulk

- [**GraphQL input types**](https://graphql.org/graphql-js/mutations-and-input-types/)
  - **`UserCreateInput`**: Wraps all fields of the record
  - **`UserUpdateInput`**: Wraps all fields of the record
  - **`<Type>UserWhereInput`**: Provides filters for all fields of the record
  - **`UserWhereUniqueInput`**: Provides filters for unique fields of the record
  - **`UserUpdateManyMutationInput`**: Wraps fields that can be updated in bulk
  - **`<Type>UserOrderByInput`**: Specifies ascending or descending orders by field

> `UserCreateInput` and `UserUpdateInput` differ in the way relation fields are treated.

## Examples

You can find runnable `nexus-prisma`-based example projects in the [`photonjs repository`](https://github.com/prisma/photonjs/tree/master/examples):

- [GraphQL](https://github.com/prisma/photonjs/tree/master/examples/typescript/graphql): Simple setup keeping the entire schema in a single file.
- [GraphQL + Auth](https://github.com/prisma/photonjs/tree/master/examples/typescript/graphql-auth): Advanced setup including authentication, authorization, and a modularized schema.


Here's a minimal taster:

**Prisma schema**

```groovy
model Todo {
  id    Int     @id
  title String
  done  Boolean @default(false)
}
```

**GraphQL server code**

```ts
import { nexusPrismaPlugin } from "@generated/nexus-prisma";
import { Photon } from "@generated/photon";
import { objectType, makeSchema, idArg } from "@prisma/nexus";
import { GraphQLServer } from "graphql-yoga";

// Expose the full "Query" building block
const Query = objectType({
  name: "Query",
  definition(t) {
    t.crud.findOneTodo();
    t.crud.findManyTodo();
  },
});

// Customize the "Mutation" building block
const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    // Expose only the `createTodo` mutation (`updateTodo` and `deleteTodo` not exposed)
    t.crud.createTodo();

    // Add a custom `markAsDone` mutation
    t.field("markAsDone", {
      type: "Todo",
      args: { id: idArg() },
      nullable: true,
      resolve: (_, { id }, ctx) => {
        return ctx.photon.todos.updateTodo({
          where: { id },
          data: { done: true },
        });
      },
    });
  },
});

const Todo = objectType({
  name: "Todo",
  definition(t) {
    t.model.id();
    t.model.title();
    t.model.done();
  },
});

const photon = new Photon();

const nexusPrisma = nexusPrismaPlugin({
  photon: (ctx) => photon,
});

const schema = makeSchema({
  types: [Query, Mutation, nexusPrisma],
  outputs: {
    schema: "./generated/schema.graphql",
    typegen: "./generated/nexus",
  },
});

const server = new GraphQLServer({
  schema,
  context: { photon },
});

server.start(() => console.log("Server is running on http://localhost:4000"));
```

<Details><Summary>Expand to see the generated GraphQL API schema (aka. SDL)</Summary>

```graphql
# The fully exposed "Query" building block
type Query {
  todo(where: TodoWhereUniqueInput!): Todo
  todoes(
    after: String
    before: String
    first: Int
    last: Int
    skip: Int
  ): [Todo!]!
}

# The customized "Mutation" building block
type Mutation {
  createTodo(data: TodoCreateInput!): Todo!
  markAsDone(id: ID): Todo
}

# The Prisma model
type Todo {
  done: Boolean!
  id: ID!
  title: String!
}

# More of the generated building blocks:
# e.g. `TodoWhereUniqueInput`, `TodoCreateInput`, ...
```

</Details>
<br />


## Getting started

Now let's build an example blogging app to see `nexus-prisma` in action.

### 1. Setup

#### 1.1 Install Prisma

```bash
npm install -g prisma2
```

#### 1.2 Create Project

```bash
prisma2 init myblog
cd myblog
```

Navigate through the subsequent prompts like so:

1. database: **SQLite**
2. addons: **Photon** & **Lift**
3. language: **TypeScript** (JavaScript if you prefer)
4. template: **From scratch**

#### 1.3 Install dependencies

```bash
npm install --save @prisma/nexus graphql nexus-prisma apollo-server
npm install --save-dev typescript ts-node-dev
```

About the dependencies:

- `@prisma/nexus` & `graphql`: For Nexus
- `apollo-server`: Your GraphQL server
- `ts-node-dev`:  Runs your development server

#### 1.4. Add a `dev` npm script

Tweak the generated project with a handy development command in the `package.json` `scripts` section

```json
"dev": "ts-node-dev --no-notify --respawn --transpileOnly src/script.ts"
```

#### 1.5. Add a `nexus-prisma` generator

The following goes into your `prisma/schema.prisma`

```groovy
generator nexus_prisma {
  provider = "nexus-prisma"
}
```

#### 1.6. Initialize Database

An initializaton migration plan was generated during scaffolding, you just need to apply it:

```bash
prisma2 lift up
```

#### 1.7. Generate Clients

```bash
prisma2 generate
```

This will generate both `photon` and `nexus-prisma` in the `node_modules/@generated`. This makes it easy to import them.

### 2. Expose full CRUD GraphQL API

We'll start by exposing all CRUD operations for the Prisma models that were generated by the `nexus-prisma` generator. Create a new file called `index.ts` and add the following code to it:

```ts
import * as path from "path";
import { GraphQLServer } from "graphql-yoga";
import { nexusPrismaPlugin } from "@generated/nexus-prisma";
import { Photon } from "@generated/photon";

const Query = objectType({
  name: "Query",
  definition(t) {
    t.crud.findOneUser();
    t.crud.findManyUser();
    t.crud.findOnePost();
    t.crud.findManyPost();
  },
});
const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.crud.createUser();
    t.crud.updateUser();
    t.crud.deleteUser();
    t.crud.upsertUser();

    t.crud.createPost();
    t.crud.updatePost();
    t.crud.deletePost();
    t.crud.upsertPost();
  },
});

const User = objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.email();
    t.model.name();
    t.model.posts();
  },
});

const Post = objectType({
  name: "Post",
  definition(t) {
    t.model.id();
    t.model.createdAt();
    t.model.updatedAt();
    t.model.published();
    t.model.title();
    t.model.content();
    t.model.author();
  },
});

const photon = new Photon();

const nexusPrisma = nexusPrismaPlugin({
  photon: (ctx) => ctx.photon,
});

const schema = makePrismaSchema({
  types: [Query, Mutation, User, Post, nexusPrisma],

  outputs: {
    schema: path.join(__dirname, "./generated/schema.graphql"),
    typegen: path.join(__dirname, "./generated/nexus.ts"),
  },
});

const server = new GraphQLServer({
  schema,
  context: { photon },
});
server.start(() => console.log(`Server is running on http://localhost:4000`));
```

Start your development `ts-node-dev`-based development server with:

```bash
npm run start
```

You can see the generated SDL for the GraphQL API in `./generated/schema.graphql`. These are the queries and mutations you have now available:

```graphql
type Query {
  findOnePost(where: PostWhereUniqueInput!): Post
  findManyPost(
    after: String
    before: String
    first: Int
    last: Int
    skip: Int
  ): [Post!]!
  findOneUser(where: UserWhereUniqueInput!): User
  findManyUser(
    after: String
    before: String
    first: Int
    last: Int
    skip: Int
  ): [User!]!
}

type Mutation {
  createPost(data: PostCreateInput!): Post!
  createUser(data: UserCreateInput!): User!
  deletePost(where: PostWhereUniqueInput!): Post
  deleteUser(where: UserWhereUniqueInput!): User
  updatePost(data: PostUpdateInput!, where: PostWhereUniqueInput!): Post
  updateUser(data: UserUpdateInput!, where: UserWhereUniqueInput!): User
  upsertPost(
    create: PostCreateInput!
    update: PostUpdateInput!
    where: PostWhereUniqueInput!
  ): Post!
  upsertUser(
    create: UserCreateInput!
    update: UserUpdateInput!
    where: UserWhereUniqueInput!
  ): User!
}

# ... more generated types
```

The following illustration shows the connection between the Prisma schema, the generated CRUD building blocks and the final GraphQL server code:

![](https://imgur.com/RLsS1lm.png)

### 3. `t.crud` vs `t.model`

You might have noticed that there's two ways to expose fields on your GraphQL API

- `t.model` is used to expose fields from your **prisma models**
- `t.crud` is used to expose generated **crud operations**. It's therefore only exposed on the `Query` and `Mutation` type.

### 4. Add computed fields to a model

You can add (computed) fields to a Prisma model using the standard GraphQL Nexus API:

- `t.field(...)`
- `t.string(...)`
- `t.int(...)`
- `t.boolean(...)`
- ...

Let's add a computed field to `Post` that returns the `title` spelled all-uppercase:

```ts
const Post = objectType({
  name: "Post",
  definition(t) {
    t.model.id();
    t.model.content();
    t.string("uppercaseTitle", {
      resolve: ({ title }, args, ctx) => title.toUpperCase(),
    });
  },
});
```

Again, don't forget to pass the customized model to `makeSchema`:

```ts
const schema = makeSchema({
  types: [Query, Mutation, User, Post],

  // ...
}
```

### 5. Renaming fields on a model

`t.model` & `t.crud` also lets us rename certain fields of our models/crud operations. Let's rename the `content` field on the `Post` model to `body` in the exposed GraphQL API:

```ts
const Post = objectType({
  name: "Post",
  definition(t) {
    t.model.id();
    t.model.content({ alias: "body" });
    t.string("uppercaseTitle", {
      resolve: ({ title }) => title.toUpperCase(),
    });
  },
});
```

If you need more complicated logic for your computed field (e.g. have access to some information from the database), you can use the `photon` instance that's attached to the context and implement your resolver based on that, e.g.:

```ts
const Post = objectType({
  name: 'Post',
  definition(t) {
    t.model.id()
    t.model.content({ alias: "body" })

    t.string('anotherComputedField', {
      resolve: async ({ title }, args, ctx) => {
        const databaseInfo = await ctx.photon.someModel.someOperation(...)
        const result = doSomething(databaseInfo)
        return result
      }
    })
  }
})
```

In this case, we're using the `alias` property to rename the `content` field from the Prisma schema to `body` in our GraphQL API.

### 6. Customize arguments on fields

By default, we expose only pagination for security reasons. Ordering and filtering must be explicitely enabled because of the performance overhead that they might cause.

Using the same technique as for renaming, we can also customize the arguments for certain fields. For example, the `posts` field on the `User` model in our GraphQL API looks as follow by default:

```graphql
type User {
  id: ID!
  name: String
  posts(
    after: String
    before: String
    first: Int
    last: Int
    skip: Int
  ): [Post!]
}
```

To customize the arguments, we can enable them using the `filtering` and `ordering` properties. By using `true`, `nexus-prisma` will expose **all** filtering and ordering properties for every field of your model.

```ts
const User = objectType({
  name: "User",
  definition(t) {
    t.model.posts({ filtering: true, ordering: true });
  },
});
```

If you wish to only expose some filters or orders, you can also use the following syntax:

```ts
const User = objectType({
  name: "User",
  definition(t) {
    t.model.posts({
      filtering: { id: true, title: true },
      ordering: { title: true },
    });
  },
});
```

Finally, you can also disable pagination

```ts
const User = objectType({
  name: "User",
  definition(t) {
    t.model.posts({ pagination: false });

    // or t.model.posts({ pagination: { first: true, last: true } })
  },
});
```

### 7. Add more API operations

Let's add more API operations that can't be directly resolved by the generated CRUD building block. Our two new mutations have the following SDL representation:

```graphql
type Mutation {
  createDraft(title: String!, content: String): Post!
  publish(id: ID!): Post
}
```

Here's how to implement them in your GraphQL server code:

```ts
const Mutation = objectType({
  name: "Mutation",
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
      resolve: (parent, { id }, ctx) => {
        return ctx.photon.posts.updatePost({
          where: { id },
          data: { published: true },
        });
      },
    });
  },
});
```

## Usage

### Prerequisites

You need to have a running Prisma project in order to use `nexus-prisma`. Learn how to get started with Prisma 2 [here](https://github.com/prisma/prisma2-docs/).

### Add nexus-prisma generator

Add the following to your `project.prisma` file

```groovy
generator nexus_prisma {
  provider = "nexus-prisma"
}

generator photon {
  provider = "photonjs"
}
```

### Generate CRUD building blocks

The CRUD building blocks are generated using the `prisma2` CLI:

```bash
prisma2 generate
```

As an example, assume you have a `User` type in your Prisma schema. `nexus-prisma` will generate the following building blocks for it:

- Queries

  - `findOneUser(...): User!`: Returns a single record
  - `findManyUser(...): [User!]!`: Returns a list of records

- Mutations

  - `createUser(...): User!`: Creates a new record
  - `updateUser(...): User`: Updates a record
  - `deleteUser(...): User`: Deletes a record
  - `updatesManyUsers(...): BatchPayload!`: Updates many records in bulk
  - `deleteManyUsers(...): BatchPayload!`: Deletes many records in bulk

- [GraphQL input types](https://graphql.org/graphql-js/mutations-and-input-types/)
  - `UserCreateInput`: Wraps all fields of the record
  - `UserUpdateInput`: Wraps all fields of the record
  - `<Type>UserWhereInput`: Provides filters for all fields of the record
  - `UserWhereUniqueInput`: Provides filters for unique fields of the record
  - `UserUpdateManyMutationInput`: Wraps fields that can be updated in bulk
  - `<Type>UserOrderByInput`: Specifies ascending or descending orders by field

> `UserCreateInput` and `UserUpdateInput` differ in the way relation fields are treated.

## Reference

`nexus-prisma` is a generated library. Once generated, you can import it by default from the node_modules at `@generated/nexus-prisma`.

### `nexusPrismaPlugin`

The `nexusPrismaPlugin` is used to augment the `t` argument of the `definition` function of your graphql output types defined with GraphQL Nexus.

It adds two properties:

- `t.model` is used to expose fields from your **prisma models**
- `t.crud` is used to expose generated **crud operations**. It's therefore only exposed on the `Query` and `Mutation` type.

The result of `nexusPrismaPlugin` needs to be passed to the `types` property of `makeSchema`.

`nexus-prisma` only works in combination with photon, so make sure to have that defined as a generator as well.

For now, the only parameter that `nexusPrismaPlugin` takes is `{ photon }`.

The `photon` property needs to be a function, that'll retrieve the photon instance passed to your GraphQL server context

```ts
import { nexusPrismaPlugin } from "@generated/nexus-prisma";
import { Photon } from "@generated/photon";
import { GraphQLServer } from "graphql-yoga";
import { makeSchema } from "@prisma/nexus";

const photon = new Photon();

const nexusPrisma = nexusPrismaPlugin({
  photon: (ctx) => ctx.photon,
});

const schema = makeSchema({
  types: [nexusPrisma],
  outputs: {
    schema: "./generated/schema.graphql",
    typegen: "./generated/nexus",
  },
});

const server = new GraphQLServer({
  schema,
  context: { photon },
});
```

### `t.model()`

`t.model` is used to expose fields from your prisma model onto your GraphQL API.

#### Exposing fields

If the name of your GraphQL ObjectType matches a model name from your Prisma schema, you can use `t.model.<name_of_your_field>()`.

```ts
objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.name();
  },
});
```

#### Exposing fields from a renamed model

However, if your GraphQL ObjectType does not match any name from your Prisma schema, `t.model` becomes a function and need to be used like so:

```ts
objectType({
  name: "CustomUser",
  definition(t) {
    t.model("User").id();
    t.model("User").name();
  },
});
```

#### Exposing fields that points to a renamed model

If you try to expose a relation which type points to an unknown GraphQL ObjectType, your field method will require a `{ type }` parameter to explicitely define the type of your field.

Given the following Prisma schema:

```groovy
model User {
  id    Int @id
  name  String
  posts Post[]
}

model Post {
  id  Int @id
}
```

If we try the `posts` relation of `User`, but we renamed the `Post` model to `CustomPost`, we'll need to explicitely define the type of the `posts` field to be `CustomPost` instead of `Post`.

```ts
objectType({
  name: "CustomUser",
  definition(t) {
    t.model("User").id();
    t.model("User").name();
    t.model("User").posts({ type: "CustomPost" }); // Explicit type required
  },
});

objectType({
  name: "CustomPost",
  definition(t) {
    t.model("Post").id();
  },
});
```

#### Available field method options

- `alias` (optional): The alias name of a field
- `type` (optional/required): The type of your field. Optional if there's an object type defined that has the same name of one of your prisma model. Otherwise, requried.
- `filtering` (optional): Enable or disable filtering.
- `ordering` (optional): Enable or disable ordering.
- `pagination` (optional): Enable or disable pagination.

`filtering`, `ordering` and `pagination` can all either be of type `boolean` to enable/disable them, or be of type `Record<string, true>` to customise which input fields you want to expose.

**By default, filtering and ordering are disabled. They need to explicitely be enabled**

```ts
objectType({
  name: "User",
  definition(t) {
    t.model.id();
    // Expose filtering and ordering for all fields
    t.model.posts({ filtering: true, ordering: true });

    // Expose filtering for fields `id` and `title`
    t.model.posts({
      filtering: { id: true, title: true },
    });
  },
});
```

### `t.crud()`

`t.crud` is used to expose CRUD operations. It's only accessible from the `Query` and `Mutation` type.

Given a prisma model name `User`, `t.crud` will expose the following field methods:

**On the `Mutation` type**

- `t.crud.createUser()`
- `t.crud.deleteUser()`
- `t.crud.updateUser()`
- `t.crud.upsertUser()`
- `t.crud.updateManyUser()`
- `t.crud.deleteManyUser()`

**On the `Query` type**

- `t.crud.findOneUser()`
- `t.crud.findManyUser()`

`t.crud` works very much in the same way as `t.model` does. Please read the `t.model` section for more information.

## Typings

By default, `nexus` will infer the `root` types from your schema. In some cases, you might need the `root`s to be the actual types returned by `photon`, e.g. when you want to use a hidden field from your Prisma schema to expose a computed one.

In that case, you need to add the `photon` types to the `typegenAutoConfig.sources` config:

```ts
import { join } from "path";
import { makePrismaSchema } from "nexus-prisma";

const schema = makePrismaSchema({
  // ... other configs,
  typegenAutoConfig: {
    sources: [
      {
        source: "@generated/photon"
        alias: "prisma",
      },
    ],
  },
});
```

`nexus` will match the types name of your schema with the TS interfaces contained in the `photon` file, and use these types instead of the inferred one from your schema. If needed, you can also input your own types.

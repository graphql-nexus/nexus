---
id: database-access-with-prisma
title: Database Access with Prisma
sidebar_label: Database Access w/ Prisma
---

This page explains how to use [Prisma](<(https://github.com/prisma/prisma)>) and the [`nexus-prisma`](https://github.com/prisma/nexus-prisma) plugin to connect your GraphQL Nexus resolvers to a database. Read more about it in the [announcement article](https://www.prisma.io/blog/using-graphql-nexus-with-a-database-pmyl3660ncst/).

## Overview

### What is Prisma?

Prisma is a replacement for traditional ORMs. It enables simplified and type-safe database access through the [Prisma client](https://www.prisma.io/client/client-typescript). The Prisma client is an auto-generated and type-safe database client. Combined with GraphQL Nexus, it provides a powerful solution for implementing GraphQL database access in GraphQL resolvers.

Prisma currently supports the following databases:

- PostgreSQL
- MySQL
- MongoDB

You can use Prisma to start out from scratch or connect it to your existing database.

With Prisma, you can use a subset of GraphQL SDL (or the soon upcoming [migrations API](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md)) to define database models. Prisma optionally handles database migrations for you using the [Prisma CLI](https://www.prisma.io/docs/-alx4/). If you're starting with an existing database, the Prisma CLI performs an introspection against your database and generates a datamodel for you.

Learn how to get started with Prisma [here](https://www.prisma.io/docs/-t002/).

### What is the `nexus-prisma` plugin?

The `nexus-prisma` plugin is the glue between the Prisma client and GraphQL Nexus. It generates CRUD building blocks based for your Prisma models.

When constructing your GraphQL schema with GraphQL Nexus, you build upon these building blocks and expose/customize them to your own API needs.

### Generated CRUD building blocks

Assume you have a `User` type in your Prisma datamodel. `nexus-prisma-generate` will generate the following building blocks for it:

- **Queries**

  - **`user(...): User!`**: Fetches a single record
  - **`users(...): [User!]!`**: Fetches a list of records
  - **`usersConnection(...): UserConnection!`**: [Relay connections](https://graphql.org/learn/pagination/#complete-connection-model) & aggregations

- **Mutations**

  - **`createUser(...): User!`**: Creates a new record
  - **`updateUser(...): User`**: Updates a record
  - **`deleteUser(...): User`**: Deletes a record
  - **`updatesManyUsers(...): BatchPayload!`**: Updates many records in bulk
  - **`deleteManyUsers(...): BatchPayload!`**: Deletes many records in bulk

- [**GraphQL input types**](https://graphql.org/graphql-js/mutations-and-input-types/)
  - **`UserCreateInput`**: Wraps all fields of the record
  - **`UserUpdateInput`**: Wraps all fields of the record
  - **`UserWhereInput`**: Provides filters for all fields of the record
  - **`UserWhereUniqueInput`**: Provides filters for unique fields of the record
  - **`UserUpdateManyMutationInput`**: Wraps fields that can be updated in bulk
  - **`UserOrderByInput`**: Specifies ascending or descending orders by field

> `UserCreateInput` and `UserUpdateInput` differ in the way relation fields are treated.

## Examples

Here's a minimal example for using `nexus-prisma`:

**Prisma datamodel**:

```graphql
type Todo {
  id: ID! @unique
  title: String!
  done: Boolean! @default(value: "false")
}
```

**GraphQL server code**::

```ts
import { prismaObjectType } from 'nexus-prisma'
import { idArg } from 'nexus'

// Expose the full "Query" building block
const Query = prismaObjectType({ 
  name: 'Query',
  definition: t => t.prismaFields(['*'])
})

// Customize the "Mutation" building block
const Mutation = prismaObjectType({
  name: 'Mutation',
  definition(t) {
    // Keep only the `createTodo` mutation
    t.prismaFields(['createTodo'])

    // Add a custom `markAsDone` mutation
    t.field('markAsDone', {
      args: { id: idArg() },
      nullable: true,
      resolve: (_, { id }, ctx) {
        return ctx.prisma.updateTodo({
          where: { id },
          data: { done: true }
        })
      }
    })
  }
})

const schema = makePrismaSchema({
  types: [Query, Mutation],

  // More config stuff, e.g. where to put the generated SDL
})

// Feed the `schema` into your GraphQL server, e.g. `apollo-server, `graphql-yoga`
```

<Details><Summary>Expand to view the generated SDL for the final GraphQL API</Summary>

```graphql
# The fully exposed "Query" building block
type Query {
  todo(where: TodoWhereUniqueInput!): Todo
  todoes(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: TodoOrderByInput
    skip: Int
    where: TodoWhereInput
  ): [Todo!]!
  todoesConnection(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: TodoOrderByInput
    skip: Int
    where: TodoWhereInput
  ): TodoConnection!
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
# e.g. `TodoWhereUniqueInput`, `TodoCreateInput`, `TodoConnection`, ...
```

</Details>

You can find some easy-to-run example projects based on `nexus-prisma` in the [`prisma-examples`](https://github.com/prisma/prisma-examples/):

- [GraphQL](https://github.com/prisma/prisma-examples/tree/master/typescript/graphql): Simple setup keeping the entire schema in a single file.
- [GraphQL + Auth](https://github.com/prisma/prisma-examples/tree/master/typescript/graphql-auth): Advanced setup including authentication and authorization and a modularized schema.

## Getting started

Let's walk through a practical example of using the `nexus-prisma` plugin to build a GraphQL API for a blogging application.

### Setup

#### Installation

```bash
npm install -g prisma
```

#### Create Prisma project

```bash
prisma init myblog
```

In the interactive prompt, select the following options:

1. Select **Demo server** (includes a free & hosted demo database in Prisma Cloud)
1. **Authenticate** with Prisma Cloud in your browser (if necessary)
1. Back in your terminal, **confirm all suggested values**

<details>
 <summary>Alternative: Run Prisma locally via Docker</summary>

1. Ensure you have Docker installed on your machine. If not, you can get it from [here](https://store.docker.com/search?offering=community&type=edition).
1. Create `docker-compose.yml` for MySQL (see [here](https://www.prisma.io/docs/prisma-server/database-connector-POSTGRES-jgfr/) for Postgres):
   ```yml
   version: "3"
   services:
     prisma:
       image: prismagraphql/prisma:1.26
       restart: always
       ports:
         - "4466:4466"
       environment:
         PRISMA_CONFIG: |
           port: 4466
           databases:
             default:
               connector: mysql
               host: mysql
               port: 3306
               user: root
               password: prisma
               migrations: true
     mysql:
       image: mysql:5.7
       restart: always
       environment:
         MYSQL_ROOT_PASSWORD: prisma
       volumes:
         - mysql:/var/lib/mysql
   volumes: mysql:
   ```
1. Run `docker-compose up -d`
1. Set the `endpoint` in `prisma.yml` to `http://localhost:4466`
1. Run `prisma deploy`

</details>

#### Add dependencies

```bash
npm init -y
npm install --save nexus graphql nexus-prisma prisma-client-lib graphql-yoga
npm install --save-dev typescript ts-node-dev
```

Here's an overview of the installed dependencies:

- `nexus` & `graphql`: Required to use GraphQL Nexus
- `prisma-client-lib`: Required to use the Prisma client
- `graphql-yoga`: Your GraphQL server (note that you might as well use `apollo-server`)
- `ts-node-dev`: Runs our development server in the background

#### Configure `prisma.yml`

Add the following two lines to the end of your `prisma.yml`:

```yml
hooks:
  post-deploy:
    - prisma generate
    - npx nexus-prisma-generate --client ./generated/prisma-client --output ./generated/nexus-prisma
```

#### Add `tsconfig.json`

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "dist",
    "strict": true,
    "lib": ["esnext", "dom"]
  }
}
```

#### Configure `start` script in `package.json`

```json
"scripts": {
  "start": "ts-node-dev --no-notify --respawn --transpileOnly ./"
},
```

### Define models

Adjust `datamodel.prisma`:

Let's assume we're building a blogging application, here's how we can represent our application domain by adjusting the Prisma models:

```graphql
type User {
  id: ID! @unique
  email: String! @unique
  name: String
  posts: [Post!]!
}

type Post {
  id: ID! @unique
  createdAt: DateTime!
  updatedAt: DateTime!
  published: Boolean! @default(value: "false")
  title: String!
  content: String
  author: User!
}
```

### Migrate database

In your terminal, run:

```bash
prisma deploy
```

> Note that Prisma will soon have a more powerful migration system. [Learn more](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md).

Because you configured the `post-deploy` hook in `prisma.yml` earlier, your Prisma client and the CRUD building blocks from `nexus-prisma` are automatically updated.

### Expose full CRUD GraphQL API

We'll start by exposing all CRUD operations for the Prisma models that were generated by `nexus-prisma-generate`. Create a new file called `index.ts` and add the following code to it:

```ts
import * as path from 'path'
import { GraphQLServer } from 'graphql-yoga'
import { makePrismaSchema, prismaObjectType } from 'nexus-prisma'
import { prisma } from './generated/prisma-client'
import datamodelInfo from './generated/nexus-prisma'

const Query = prismaObjectType({
  name: 'Query',
  definition: (t) => t.prismaFields(['*'])
})
const Mutation = prismaObjectType({
  name: 'Mutation',
  definition: (t) => t.prismaFields(['*'])
})

const schema = makePrismaSchema({
  types: [Query, Mutation],

  prisma: {
    datamodelInfo,
    client: prisma
  },

  outputs: {
    schema: path.join(__dirname, './generated/schema.graphql'),
    typegen: path.join(__dirname, './generated/nexus.ts'),
  },
})

const server = new GraphQLServer({
  schema,
  context: { prisma }
})
server.start(() => console.log(`Server is running on http://localhost:4000`))
```

Start your development `ts-node-dev`-based development server with:

```bash
npm run start
```

You can see the generated SDL for the GraphQL API in `./generated/schema.graphql`. These are the queries and mutations you have now available:

```graphql
type Query {
  node(id: ID!): Node
  post(where: PostWhereUniqueInput!): Post
  posts(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: PostOrderByInput
    skip: Int
    where: PostWhereInput
  ): [Post!]!
  postsConnection(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: PostOrderByInput
    skip: Int
    where: PostWhereInput
  ): PostConnection!
  user(where: UserWhereUniqueInput!): User
  users(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: UserOrderByInput
    skip: Int
    where: UserWhereInput
  ): [User!]!
  usersConnection(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: UserOrderByInput
    skip: Int
    where: UserWhereInput
  ): UserConnection!
}

type Mutation {
  createPost(data: PostCreateInput!): Post!
  createUser(data: UserCreateInput!): User!
  deleteManyPosts(where: PostWhereInput): BatchPayload!
  deleteManyUsers(where: UserWhereInput): BatchPayload!
  deletePost(where: PostWhereUniqueInput!): Post
  deleteUser(where: UserWhereUniqueInput!): User
  updateManyPosts(
    data: PostUpdateManyMutationInput!
    where: PostWhereInput
  ): BatchPayload!
  updateManyUsers(
    data: UserUpdateManyMutationInput!
    where: UserWhereInput
  ): BatchPayload!
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

The following illustration shows the connection between the Prisma datamodel, the generated CRUD building blocks and the final GraphQL server code:

![](https://imgur.com/RLsS1lm.png)

### Hide fields of a model

To hide fields of a model, you need to apply `prismaObjectType` to the model and then call `prismaFields` on it. `prismaFields` takes an array with all fields of that model you want to expose. Let's hide the `email` field of our `User` model:

```ts
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields(["id", "name", "posts"]);
  },
});
```

By leaving out the `email` field in the array that's passed to `prismaFields`, we can remove it from the client-facing GraphQL API.

When customizing models or other types from the generated building blocks, be sure to include them in the `types` array that's passed to the `makePrismaSchema` function:

```ts
const schema = makePrismaSchema({
  types: [Query, Mutation, User],

  // ...
}
```

### Add computed fields to a model

You can add (computed) fields to a Prisma model using the standard GraphQL Nexus API:

- `t.field(...)`
- `t.string(...)`
- `t.int(...)`
- `t.boolean(...)`
- ...

Let's add a computed field to `Post` that returns the `title` spelled all-uppercase:

```ts
const Post = prismaObjectType({
  name: "Post",
  definition(t) {
    t.string("uppercaseTitle", {
      resolve: ({ title }, args, ctx) => title.toUpperCase(),
    });
  },
});
```

Again, don't forget to pass the customized model to `makePrismaSchema`:

```ts
const schema = makePrismaSchema({
  types: [Query, Mutation, User, Post],

  // ...
}
```

### Renaming fields on a model

`prismaFields` also lets us rename certain fields of our models. Let's rename the `content` field on the `Post` model to `body` in the exposed GraphQL API:

```ts
const Post = prismaObjectType({
  name: "Post",
  definition(t) {
    t.prismaFields([
      "*",
      {
        name: "content",
        alias: "body",
      },
    ]);
    t.string("uppercaseTitle", {
      resolve: ({ title }) => title.toUpperCase(),
    });
  },
});
```

If you need more complicated logic for your computed field (e.g. have access to some information from the database), you can use the `prisma` instance that's attached to the context and implement your resolver based on that, e.g.:

```ts
const Post = prismaObjectType({
  name: 'Post',
  definition(t) {
    t.prismaFields([
      '*',
      {
        name: 'content',
        alias: 'body'
      }
    ])
    t.string('anotherComputedField', {
      resolve: async ({ title }, args, ctx) => {
        const databaseInfo = await ctx.prisma.someOperation(...)
        const result = doSomething(databaseInfo)
        return result
      }
    })
  }
})
```

Instead of providing just the name of the field you want to include in the array passed to `prismaFields` as a string, you can pass an object to further configure how a certain field should be exposed. In this case, we're using the `alias` property to rename the `content` field from the Prisma datamodel to `body` in our GraphQL API.

### Customize arguments on fields

Using the same technique as for renaming, we can also customize the arguments for certain fields. For example, the `posts` field on the `User` model in our GraphQL API looks as follows:

```graphql
type User {
  id: ID!
  name: String
  posts(
    after: String
    before: String
    first: Int
    last: Int
    orderBy: PostOrderByInput
    skip: Int
    where: PostWhereInput
  ): [Post!]
}
```

To remove customize the arguments, we need to provide the `args` option to the configuration object for that field. For example, if we wanted to remove all pagination arguments:

```graphql
const User = prismaObjectType({
  name: 'User',
  definition(t) {
    t.prismaFields([
      'id',
      'name',
      {
        name: 'posts',
        args: ['where', 'orderBy']
      }
    ])
  }
})
```

### Hide certain CRUD operations

Similar to how you can hide fields from the Prisma models, you can also hide fields of the generated `Query` and `Mutation` building blocks. The following code removes all generated mutations except for the ones that are explicitly provided in `t.prismaFields(...)`:

```ts
const Mutation = prismaObjectType({
  name: "Mutation",
  definition(t) {
    t.prismaFields(["createUser", "updateUser", "deleteUser", "deletePost"]);
  },
});
```

### Add more API operations

Let's add more API operations that can't be directly resolved by the generated CRUD building block. Our two new mutations have the following SDL representation:

```graphql
type Mutation {
  createDraft(title: String!, content: String): Post!
  publish(id: ID!): Post
}
```

Here's how to implement them in your GraphQL server code:

```ts
const Mutation = prismaObjectType({
  name: "Mutation",
  definition(t) {
    t.prismaFields(["createUser", "updateUser", "deleteUser", "deletePost"]);
    t.field("createDraft", {
      type: "Post",
      args: {
        title: stringArg(),
        content: stringArg({ nullable: true }),
      },
      resolve: (parent, { title, content }, ctx) => {
        return ctx.prisma.createPost({ title, content });
      },
    });
    t.field("publish", {
      type: "Post",
      nullable: true,
      args: {
        id: idArg(),
      },
      resolve: (parent, { id }, ctx) => {
        return ctx.prisma.updatePost({
          where: { id },
          data: { published: true },
        });
      },
    });
  },
});
```

## Reference

### `prismaObjectType()`

`prismaObjectType` is a wrapper around Nexus' `objectType`. It expects an object with the following properties:

#### Required

- `name` (string): The name of the Prisma model or generated CRUD GraphQL type you want to expose in your API, e.g. `Query`, `Mutation`, `User`, `Todo`, `UserWhereUniqueInput`, `TodoConnection`, ...
- `definition(t)` (function): A function to customize the Prisma model or generated CRUD GraphQL type `t`. To expose the entire type, call: `t.prismaFields(['*'])`. See the documentation of `prismaFields()` below for more info.

#### Optional

- `nonNullDefaults` (boolean or object): Specifies whether the [nullability](https://graphql.org/learn/schema/#lists-and-non-null) behaviour for field arguments and field types. **All input arguments and return types of fields are non-null by default**. If you want the behaviour to differ for input arguments and field (output) types, you can pass an object with these properties:
  - `input` (boolean): Specifies whether input arguments should be required. Default: `true`.
  - `output` (boolean): Specifies whether return values of fields should be required. Default: `true`.
- `description`: A string that shows up in the generated SDL schema definition to describe the type. It is also picked up by tools like the GraphQL Playground or graphiql.
- `defaultResolver`

### `prismaFields()`

`prismaFields()` is called on the type `t` that's passed into the `definition` function. All the fields exposed using `prismaFields()` are automatically resolved. The `prismaFields()` function expects an array of Prisma fields where each field can either be provided:

- as a simple string to indicate that it should be exposed in the same way it was defined in the datamodel
- as a configuration object in case you want to rename the field or adjust its arguments

#### Signature

```ts
/**
 * Pick, or customize the fields of the underlying object type
 */
t.prismaFields(fieldsToExpose: string[] | Field[])
/**
 * Pick, or customize the fields of the underlying object type
 * (Equivalent to the above)
 */
t.prismaFields({ pick: string[] | Field[] })
/**
 * Filter or customize the fields of the underlying object type
 */
t.prismaFields({ filter: (string[] | Field[]) | (fields: string[]) => string[] })

interface Field {
  name: string    // Name of the field you want to expose
  alias: string   // Name of the alias of you want to give the field
  args: string[]  // Arguments of the field you want to expose
}
```

#### Examples

**Expose all fields**

```ts
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields(["*"]);
  },
});
```

**Expose only the `id` and `name` field**

```ts
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields(["id", "name"]);
  },
});
```

or

```ts
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields({ pick: ["id", "name"] });
  },
});
```

**Expose all fields but the `id` and `name`**

```ts
const User = prismaObjectType({
  name: "User",
  definition(t) {
    t.prismaFields({ filter: ["id", "name"] });
  },
});
```

**Expose only the `users` field, and renames it to `customers`**

```ts
const Query = prismaObjectType({
  name: "Query",
  definition(t) {
    t.prismaFields([{ name: "users", alias: "customers" }]);
  },
});
```

**Expose only the `users` field, and only the `first` and `last` args**

```ts
const Query = prismaObjectType({
  name: "Query",
  definition(t) {
    t.prismaFields([{ name: "users", args: ["first", "last"] }]);
  },
});
```

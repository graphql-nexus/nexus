---
title: Abstract Types
---

## Overview

This guide covers the topic of GraphQL Union types and Interface types. You will learn how Nexus makes these features of the GraphQL specification easy and safe to work with.

## Union Types

### Union Types in Theory

#### Introduction

A GraphQL Union type is a polymorphic type. That is, it permits multiple disparate types to be gathered under a single field. Take for example this schema:

```graphql
type Photo {
  width: Int
  height: Int
  url: String
}

enum MovieRating {
  g
  pg
  pg13
  r
}

type Movie {
  rating: MovieRating
  url: String
}

type Song {
  album: String
  url: String
}

union SearchResult = Photo | Movie | Song

type Query {
  search(pattern: String): SearchResult
}
```

`SearchResult` is a union type and with it we can model search results which may be of various types.

References:

- [GraphQL.org Union Types](https://graphql.org/learn/schema/#union-types)

#### Union Types Over the Wire

When it comes time to implementing union types in your GraphQL schema it is necessary to annotate the data so that clients can send operations to the GraphQL API in a type safe way. Take for example this query against the schema we've seen above:

```graphql
query {
  search(pattern: "Strawberry") {
    ... on Photo {
      width
      height
      url
    }
    ... on Movie {
      rating
      url
    }
    ... on Song {
      album
      url
    }
  }
}
```

In order for this builtin polymorphic system to work, your GraphQL API must ultimately annotate the outgoing data with a property to discriminate results by on the client side. The spec states that this discriminant property is `__typename`.

### Union Types in Practice

We can represent the above schema in Nexus as follows:

```ts
const Movie = objectType({
  name: 'Movie',
  definition(t) {
    t.string('url')
    t.field('rating', {
      type: 'MovieRating',
    })
  },
})

const MovieRating = enumType({
  name: 'MovieRating',
  members: ['g', 'pg', 'pg13', 'r'],
})

const Photo = objectType({
  name: 'Photo',
  definition(t) {
    t.string('url')
    t.int('width')
    t.int('height')
  },
})

const Song = objectType({
  name: 'Song',
  definition(t) {
    t.string('url')
    t.string('album')
  },
})

const SearchResult = unionType({
  name: 'SearchResult',
  definition(t) {
    t.members('Photo', 'Movie', 'Song')
  },
})

const Query = queryType({
  definition(t) {
    t.field('search', {
      type: 'SearchResult',
      args: {
        pattern: stringArg(),
      },
    })
  },
})
```

But what is missing here is the implementation of the discriminant property. In Nexus there are three possible implementations to choose from, depending on your preferences or requirements (e.g. team standards).

1. ResolveType Strategy: Implement `resolveType` on the union type itself
2. IsTypeOf Strategy: Implement `isTypeOf` on each member of the union
3. Discriminant Model Property (DMP) Strategy: Return a `__typename` discriminant property in the model data.

Let's explore each of these strategies.

#### ResolveType Strategy

The `resolveType` strategy allows to discriminate your union member types in a centralized (to the union type) way. For example:

```ts
const SearchResult = unionType({
  name: 'SearchResult',
  resolveType(data) {
    const __typename = data.album ? 'Song' : data.rating ? 'Movie' : data.width ? 'Photo' : null

    if (!__typename) {
      throw new Error(`Could not resolve the type of data passed to union type "SearchResult"`)
    }

    return __typename
  },
  definition(t) {
    t.members('Photo', 'Movie', 'Song')
  },
})
```

Each time you add a new member to the union type you will need to update your implementation of `resolveType`.

Nexus leverages TypeScript to statically ensure that your implementation is correct. Specifically:

1. `resolveType` field will be required, unless one of:
   - Each member type has had `isTypeOf` implemented
   - Each member type has had its model type (backing type) specified to include `__typename`
   - The ResolveType strategy is disabled globally
2. `resolveType` `data` param will be typed as a union of all the member types' model types (backing types).
3. `resolveType` return type will be typed as a union of string literals matching the GraphQL object type names of all members in the GraphQL union type.

#### Discriminant Model Property (DMP) Strategy

The DMP strategy allows you to discriminate your union member types in a modular way like IsTypeOf strategy. Unlike the IsTypeOf strategy however DMP strategy is based on the shape of the underlying model data. Here is an example:

```ts
const Query = queryType({
  definition(t) {
    t.field('search', {
      type: 'SearchResult',
      args: {
        pattern: stringArg(),
      },
      resolve(root, args, ctx) {
        return ctx.db.search(args.pattern).map((result) => {
          const __typename = result.album
            ? 'Song'
            : result.rating
            ? 'Movie'
            : result.width
            ? 'Photo'
            : null

          if (!__typename) {
            throw new Error(
              `Could not resolve the type of data passed to union type "SearchResult"`
            )
          }

          return {
            ...result,
            __typename,
          }
        })
      },
    })
  },
})
```

As you can see the technique looks quite similar at face value to the previous `resolveType` one. However your implementation might not look like this at all. For example maybe your data models already contain a discriminant property `typeName`. For example:

```ts
const Query = queryType({
  definition(t) {
    t.field('search', {
      type: 'SearchResult',
      args: {
        pattern: stringArg(),
      },
      resolve(root, args, ctx) {
        return ctx.db.search(args.pattern).map((result) => {
          return {
            ...result,
            __typename: result.typeName,
          }
        })
      },
    })
  },
})
```

In a serious/large application with a model layer in the codebase its likely this kind of logic would not live in your resolvers at all.

Like with ResolveType strategy Nexus leverages TypeScript to ensure your implementation is correct.

1. The resolver return type for fields whose type is a union will ensure all returned data includes a `__typename` field.
2. For a given union type, if all fields that are typed as it have their resolvers returning data with `__typename` then back on the union type `resolveType` will be optional.
3. Nexus is smart about what it needs to be satisfied by `__typename` presence. Rather than being a requirement of the model type, it is a requirement of the model type in resolver cases under the union type. For example note below how the `Photo` model type is not required to include `__typename` under the `photos` Query type field:

   ```ts
   const Query = queryType({
     definition(t) {
       t.list.field('photos', {
         type: 'Photo',
         resolve(root, args, ctx) {
           // Nexus does not require __typename here
           return ctx.db.get.photos()
         },
       })
       t.field('search', {
         type: 'SearchResult',
         args: {
           pattern: stringArg(),
         },
         resolve(root, args, ctx) {
           // Nexus requires __typename here
           return ctx.db.search(args.pattern).map((result) => {
             return {
               ...result,
               __typename: result.typeName,
             }
           })
         },
       })
     },
   })
   ```

#### IsTypeOf Strategy

The IsTypeOf strategy allows you to discriminate your union member types in a modular way like the DMP strategy. Unlike the DMP strategy however it is not based on the shape of your underlying model data. Instead the IsTypeOf strategy uses a predicate function that you implement that allows Nexus (actually GraphQL.js under the hood) to know at runtime if data being sent to the client is of the respective type or not. Here is an example:

```ts
const Movie = objectType({
  name: 'Movie',
  isTypeOf(data) {
    return Boolean(data.rating)
  },
  definition(t) {
    t.string('url')
    t.field('rating', {
      type: 'MovieRating',
    })
  },
})

const Photo = objectType({
  name: 'Photo',
  isTypeOf(data) {
    return Boolean(data.width)
  },
  definition(t) {
    t.string('url')
    t.int('width')
    t.int('height')
  },
})

const Song = objectType({
  name: 'Song',
  isTypeOf(data) {
    return Boolean(data.album)
  },
  definition(t) {
    t.string('url')
    t.string('album')
  },
})
```

Like with the ResolveType and DMP strategies Nexus leverages TypeScript to ensure your implementation is correct in the following ways:

1. If an object is a member of a union type then that object's `isTypeOf` field will be required, unless:
   - The union type has defined `resolveType`
   - The model type includes `__typename` property whose type is a string literal matching the GraphQL object name (case sensitive).
   - The fields where the union type is used include `__typename` in the returned model data
   - The IsTypeOf strategy is disabled globally

### Picking Your Strategy (Or Strategies)

#### Configuration

Nexus enables you to pick the strategy you want to use. By default only the `isTypeOf` strategy is enabled. You can pick your strategies in the `makeSchema` configuration.

```ts
import { makeSchema } from '@nexus/schema'

makeSchema({
  features: {
    abstractTypes: {
      isTypeOf: true, // default
      resolveType: false, // default
      __typename: false, // default
    },
  },
  //...
})
```

Nexus enables enabling/disabling strategies because having them all enabled at can lead to a confusing excess of type errors when there is an invalid implementation of an abstract type. Nexus doesn't force you to pick only one strategy however it does consider using multiple strategies sightly more advanced. Refer to the [Multiple Strategies](#multiple-strategies) section for details.

When you customize the strategy settings all strategies become disabled except for those that you opt into. For example in the following:

```ts
import { makeSchema } from '@nexus/schema'

makeSchema({
  features: {
    abstractTypes: {
      resolveType: true,
    },
  },
  //...
})
```

The resolved settings would be:

```ts
{
  abstractTypes: {
    resolveType: true,
    isTypeOf: false, // The `true` default when no config is given is NOT inherited here
    __typename: false,
  }
}
```

_Not_:

```ts
{
  abstractTypes: {
    resolveType: true,
    isTypeOf: true, // <-- NOT what actually happens
    __typename: false,
  }
}
```

#### One Strategy

There is no right or wrong strategy to use. Use the one that you and/or your team agree upon. These are some questions you can ask yourself:

| Questions                                                                             | If affirmative, then maybe                                                                                                 |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Is my schema large? Do I have many collaborators?                                     | Modular (DMP, IsTypeOf)                                                                                                    |
| Is my schema simple? Do I develop alone?                                              | Centralized (ResolveType)                                                                                                  |
| Do I keep a discriminant property in the databse already?                             | DMP: implement `__typename` in your model layer if you have one                                                            |
| Do I have objects that are part of multiple unions types and/or implement interfaces? | DMP or IsTypeOf to avoid repeated logic across multiple `resolveType` implementations required by the ResolveType strategy |

#### Multiple Strategies

It is possible to enable multiple strategies at once. The following discusses the build and runtime ramifications of this.

_At Buildtime_

Nexus leverages TypeScript statically encode all the rules discussed in this guide. When you have enabled multiple strategies it means that when Nexus detects a faulty implementation, then static type errors will be raised in _all_ places where a fix _could_ be made, but _might not_ be made.

In practice this means that some of the errors you'll see will be noise since only a subset are pointing toward the strategy you will ultimately want to use. This is one reason why Nexus considers having multiple strategies an advanced pattern. The static errors produced are likely to confuse newcomers, who cannot tell which ones stem from which strategy (or that there even are multiple strategies!).

_At Runtime_

In that case the following runtime precedence rules apply. Using a strategy here means the implementations of others of lower priority are discarded.

1. ResolveType
2. Discriminant Model Property
3. IsTypeOf

> The default `resolveType` implementation is actually to apply the other strategies. If you're curious how that looks internally you can see the code [here](https://github.com/graphql/graphql-js/blob/cadcef85a21e35ec6df7229b88182a4a4ad5b23a/src/execution/execute.js#L1132-L1170).

## Interface Types

### Interface Types in Theory

Interfaces allow you to define a set of fields that you can then use across objects in your schema to enforce that they all have the fields defined in the interface. Interfaces also act as a form of polymorphism at runtime. You can make a field's type be an interface and may thus then return any type that implements the interface. To illustrate the point we'll appropiate the schema that we used to show off union types.

```graphql
interface Media {
  url: String
}

type Photo implements Media {
  width: Int
  height: Int
}

enum MovieRating {
  g
  pg
  pg13
  r
}

type Movie implements Media {
  rating: MovieRating
}

type Song implements Media {
  album: String
}

type Query {
  search(pattern: String): Media
}
```

When a client sends a `search` query they will be able to select common fields as specified by the interface. Note this is unlike unions in which GraphQL assumes zero overlap between members. In contrast in GraphQL interfaces signify an intersection of fields between implementors and thus can be selected unqualified.

```graphql
query {
  search(pattern: "Strawberry") {
    url
    ... on Photo {
      width
      height
    }
    ... on Movie {
      rating
    }
    ... on Song {
      album
    }
  }
}
```

The mechanisms by which type discrimination is communicated over the wire for interface types is identical to how it works for union types, the `__typename` field. Refer to the union type guide for details.

References:

- [GrpahQL.org Interface Types](https://graphql.org/learn/schema/#interfaces)

### Interface Types in Practice

We can represent the above schema in Nexus as follows:

```ts
const Media = interfaceType({
  name: 'Media',
  definition(t) {
    t.string('url')
  },
})

const Movie = objectType({
  name: 'Movie',
  definition(t) {
    t.implements('Media')
    t.field('rating', {
      type: 'MovieRating',
    })
  },
})

const MovieRating = enumType({
  name: 'MovieRating',
  members: ['g', 'pg', 'pg13', 'r'],
})

const Photo = objectType({
  name: 'Photo',
  definition(t) {
    t.implements('Media')
    t.int('width')
    t.int('height')
  },
})

const Song = objectType({
  name: 'Song',
  definition(t) {
    t.implements('Media')
    t.string('album')
  },
})

const Query = queryType({
  definition(t) {
    t.field('search', {
      type: 'Media',
      args: {
        pattern: stringArg(),
      },
    })
  },
})
```

What's missing here is the discriminant property implementation. Nexus supports the same system for interface types as it does for union types. So for details about the various strategies to do this please refer to the corresponding section for union types.

If you are already familiar with how the system works for union types, here are a few notes to reaffirm the sameness:

- `resolveType` on interface type configuration receives a param whose type is the union of all model types of implementing GraphQL objects in your schema. Akin to how for union types it is data of one of the GraphQL union's member types.
- `isTypeOf` and `__typename` work the same and in fact their presence can serve the needs of both interface types and union type use-cases at the same time.

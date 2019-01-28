---
id: enumType
title: enumType
sidebar_label: enumType
hide_title: true
---

## enumType(EnumDefinitionBlock)

An Enum is a special GraphQL type that represents a set of symbolic names (members)
bound to unique, constant values. There are three ways to create a GraphQLEnumType
with enumType:

As an array of enum values:

```ts
const Episode = enumType({
  name: "Episode",
  members: ["NEWHOPE", "EMPIRE", "JEDI"],
});
```

As an object, with a simple mapping of enum values to internal values:

```ts
const Episode = enumType({
  name: "Episode",
  members: {
    NEWHOPE: 4,
    EMPIRE: 5,
    JEDI: 6,
  },
});
```

As an array of full definitions, with comments, etc.

```ts
const Episode = enumType({
  name: "Episode",
  description: "All Movies in the Skywalker saga, or OTHER",
  definition: (t) => {
    t.mix("OneThroughThree");
    t.mix("FourThroughSix");
    t.mix("SevenThroughNine");
    t.members(["OTHER"]);
  },
});
```

```graphql
"""
All Movies in the Skywalker saga, or OTHER
"""
enum Episode {
  OTHER
}
```

@see https://graphql.github.io/learn/schema/#enumeration-types

###

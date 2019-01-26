---
id: scalarType
title: scalarType
sidebar_label: scalarType
hide_title: true
---

A GraphQL object type has a name and fields, but at some point those fields have
to resolve to some concrete data. That's where the scalar types come in:
they represent the leaves of the query.

```ts
const DateScalar = scalarType({
  name: "Date",
  description: "Date custom scalar type",
  parseValue(value) {
    return new Date(value);
  },
  serialize(value) {
    return value.getTime();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  },
});
```

@see https://graphql.github.io/learn/schema/#scalar-types

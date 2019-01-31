---
id: api-scalarType
title: scalarType
sidebar_label: scalarType
---

[GraphQL Docs for Scalar Types](https://graphql.github.io/learn/schema/#scalar-types)

Nexus allows you to provide an `asNexusMethod` property which will make the scalar available as a builtin on the definition block object. We automatically generate and merge the types so you get type-safety just like the scalar types specified in the spec:

```ts
const DateScalar = scalarType({
  name: "Date",
  asNexusMethod: 'date'
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

---
id: scalarType
title: scalarType
sidebar_label: scalarType
hide_title: true
---

Union types are very similar to interfaces, but they don't get to specify
any common fields between the types.

As a function, where other unions can be mixed in:

```ts
const CombinedResult = unionType("CombinedResult", (t) => {
  t.mix("SearchResult");
  t.members("AnotherType", "YetAnotherType");
  t.resolveType((item) => item.name);
});
```

@see https://graphql.org/learn/schema/#union-types

---
id: unionType
title: unionType
sidebar_label: unionType
hide_title: true
---

Union types are very similar to interfaces, but they don't get to specify
any common fields between the types.

As a function, where other unions can be mixed in:

```ts
const CombinedResult = unionType({
  name: "CombinedResult",
  resolveType: (item) => item.name,
  definition: (t) => {
    t.mix("SearchResult");
    t.members("AnotherType", "YetAnotherType");
  },
});
```

@see https://graphql.org/learn/schema/#union-types

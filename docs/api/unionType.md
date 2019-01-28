---
id: unionType
title: unionType
sidebar_label: unionType
hide_title: true
---

Union types are very similar to interfaces, but they don't get to specify
any common fields between the types.

```ts
const MediaType = unionType({
  name: "MediaType",
  description: "Any container type that can be rendered into the feed",
  members: ["Post", "Image", "Card"],
  resolveType: (item) => item.name,
});
```

@see https://graphql.org/learn/schema/#union-types

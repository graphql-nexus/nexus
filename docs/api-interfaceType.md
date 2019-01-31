---
id: api-interfaceType
title: interfaceType
sidebar_label: interfaceType
---

Like many type systems, GraphQL supports interfaces. An Interface is an
abstract type that includes a certain set of fields that a type must
include to implement the interface.

In Nexus, you do not need to redefine the interface fields on the
implementing object types, instead you may use `.implements(interfaceName)`
and all of the interface fields will be added to the type.

```ts
const Node = interfaceType({
  name: "Node",
  definition(t) {
    t.id("id", { description: "GUID for a resource" });
  },
});

const User = objectType({
  name: "User",
  definition(t) {
    t.implements("Node");
  },
});
```

@see https://graphql.github.io/learn/schema/#interfaces

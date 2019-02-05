---
id: api-args
title: Args
sidebar_label: "args: arg / *Arg"
---

[GraphQL Docs on Arguments](https://graphql.org/learn/schema/#arguments)

`arg`, `intArg`, `stringArg`, `floatArg`, `idArg`, `booleanArg`

Defines an argument that can be used in any object or interface type. Args can be reused in multiple locations, and it can be convenient to create your own wrappers around arguments.

```ts
import { intArg, core } from "nexus";

function requiredInt(opts: core.ScalarArgConfig<number>) {
  return intArg({ ...opts, required: true });
}
```

Check the type-definitions or [the examples](https://github.com/graphql-nexus/nexus/tree/develop/examples) for a full illustration of the various options for `arg`, or feel free to open a PR on the docs to help document!

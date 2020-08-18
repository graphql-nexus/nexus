---
id: api-core-concepts
title: API Core Concepts
sidebar_label: API Core Concepts
---

The API has been carefully designed with the following goals in mind:

1. Type-Safety [by default](type-generation.md)
1. Readability
1. Developer ergonomics
1. Playing nicely with Prettier formatting

The API has evolved over the last few months of early development and internal use, and outside of implementing [additional features](future-features.md) is unlikely to undergo major structural changes.

That is, before you open a GitHub issue or pull-request with a suggested change to the API, ensure that it meets all four of those criteria listed above and be able to explain why a change is necessary.

Each public API is documented below, feel free to open a PR with more examples/clarification:

- [objectType / queryType / mutationType](api-objectType.md)
- [unionType](api-unionType.md)
- [interfaceType](api-interfaceType.md)
- [inputObjectType](api-inputObjectType.md)
- [enumType](api-enumType.md)
- [scalarType](api-scalarType.md)
- [args](api-args.md)
- [makeSchema](api-makeSchema.md)
- [extendType / extendInputType](api-extendType.md)
- [mutationField](api-mutationField.md)
- [queryField](api-queryField.md)

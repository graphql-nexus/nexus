---
id: typescript-setup
title: TypeScript Configuration
sidebar_label: Use with TypeScript
---

GQLiteral was designed with TypeScript in mind. The goal is to have the best possible type coverage with the least possible manual type annotation. In order to do this, we have created a dedicated code generation template for graphql-code-generator.

```ts
const schema = buildSchema({
  types: [
    /* All types here */
  ],
});
```

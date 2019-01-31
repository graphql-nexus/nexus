---
id: testing
title: App Structure & Testing
sidebar_label: App Structure & Testing
---

Nexus encourages separating your domain logic from the actual resolvers, so you can easily test and reuse your application logic independent of their use in GraphQL.

### Structuring Context

```ts
class MyAppContext {
  constructor() {
    this.userSource = new UserDataSource(this);
    this.articleSource = new ArticleDataSource(this);
  }
}
```

```ts
class UserDataSource {
  constructor(protected context: AppContext) {}

  byId(id: number) {
    return this.byIdLoader.load(id);
  }

  createUser() {}

  updateUser() {}
}
```

```ts
```

```ts
```

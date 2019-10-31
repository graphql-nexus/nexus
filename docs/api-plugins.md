---
id: api-plugins
title: Nexus Plugins
sidebar_label: Plugins
---

Nexus ships with a plugin API which allows you to define your own abstractions when building out a GraphQL schema. The plugin layer allow you to:

- Define new options for types and fields in a type-safe manner
- Layer runtime execution before and after a resolver
- Modify schema configuration
- Customize the emit behavior of TypeScript type generation (coming soon)

We also ship with several plugins out of the box, and will have more in the near future:

- [Nullability Guard Plugin](plugin-nullabilityGuard.md)
- [Field Authorize Plugin](plugin-fieldAuthorize.md)

### Defining a sample plugin:

```ts
import { plugin } from "nexus";

export const myErrorGuardPlugin = plugin({
  name: "MyErrorGuardPlugin",
  description: "Catches errors and logs them to Sentry, ",
});
```

## Plugin Config:

### name

Every plugin is required to have a unique name identifying the plugin. This is used in error-messages
and warnings.

### description

A string describing the plugin. Currently not used for anything, but it could be used in the future to
automatically create documentation for the stack of plugins used in Nexus.

### onInstall(builder)

The "onInstall" hook is used as it sounds - it is invoked once before any of the types are processed for the schema. This hook is primarily useful in allowing a plugin to add "dynamics fields" to augment the API of the definition block.

```ts
plugin({
  name: "onInstallExample",
  onInstall(builder) {},
});
```

The `builder` option provided has several properties, which allow you to influence the schema via the plugin.

### onBeforeBuild(builder)

The "onBeforeBuild" is called after all `onInstall`, but just before the schema is constructed.

```ts
plugin({
  name: "onBeforeBuildExample",
  onBeforeBuild(builder) {},
});
```

### onAfterBuild(schema)

The "onAfterBuild" hook is provided the schema, and is usedful to validate contract of the schema
with the expectations of the plugin. The [nullabilityGuard](plugin-nullabilityGuard.md)

```ts
plugin({
  name: "onAfterBuildExample",
  onAfterBuild(schema) {},
});
```

### onCreateFieldResolver(config)

Every ObjectType, whether they are defined via Nexus' `objectType` api, or elsewhere is given a resolver.
The [defaultResolver](shouldExitAfterGenerateArtifacts)

```ts
plugin({
  name: "onCreateFieldResolverExample",
});
```

### onMissingType

The "onMissingType" hook occurs when a type is provided as a string, but was never explicitly defined.
This can be helpful in situations where you have boilerplate types which can be constructed
generically / programatically based on their name.

Here is an example of a plugin which creates a "ResourceResponse" type whenever you see a string:

```ts
/**
 * Creates a ____ResourceResponse type
 *
 * type OrganizationResourceResponse {
 *   ok: Boolean!
 *   resource: Organization!
 *   query: Query!
 * }
 *
 * @param resource
 */
export function resourceResponse(resource: string) {
  return objectType({
    name: `${resource}ResourceResponse`,
    definition(t) {
      t.boolean("ok", () => true);
      t.field("resource", { type: resource as any });
      t.field("query", { type: "Query", resolve: () => ({}) });
    },
  });
}

const ResourceTypePlugin = plugin({
  name: "onMissingTypeExample",
  onMissingType(typeName, builder) {
    if (/(.*?)ResourceResponse/.test(typeName)) {
      return resourceResponse(typeName.slice(0, -16));
    }
    return null;
  },
});
```

#### Builder Object

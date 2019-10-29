### Nullability Guard Plugin

This plugin helps us guard against non-null values crashing our queries in production.

#### Use:

```ts
import { nullabilityGuardPlugin } from "nexus";

const guardPlugin = nullabilityGuardPlugin({
  onNullGuarded(ctx, info) {
    // This could report to a service like Sentry, or log internally - up to you!
    console.error(
      `Error: Saw a null value for non-null field ${info.parentType.name}.${
        info.fieldName
      } ${root ? `(${root.id || root._id})` : ""}`
    );
  },
  // A map of `typeNames` to the values we want to replace with if a "null" value
  // is seen in a position it shouldn't be. These can also be provided as a config property
  // for the `objectType` / `enumType` definition, as seen below.
  fallbackValues: {
    Int: () => 0,
    String: () => "",
    ID: ({ info }) => `${info.parentType.name}:N/A`,
    Boolean: () => false,
    Float: () => 0,
  },
});
```

#### Object type config:

```ts
const User = objectType({
  name: "User",
  definition(t) {
    t.int("id");
    t.list.field("posts", {});
  },
  nullGuardFallback: {
    id: "1",
    name: "Unknown",
    posts: [],
  },
});
```

### Null Guard Algorithm

- If a field is nullable:
  - If the field is non-list, do not guard
  - If the field is a list, and none of the list members are nullable, do not guard
- If the field is non-nullable:
  - If the field is a list:
    - If the value is nullish, return an empty list `[]`
    - If the list is non-empty, iterate and complete with a valid non-null fallback
  - If the field is an object:
    - If the value is nullish
      - If there is a fallback defined on the object for that value, return with that
      - If there is a
      - Else return with an empty object
    - Return the value and push forward to the next resolvers

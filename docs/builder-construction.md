### Builder Construction

Nexus allows for extending the schema. To do this it follows a set of steps to ensure that all types are properly referenced internally:

1. All fields are collected via the `types` property on the schema.
   - This `types` property may also include "plugins", which may themselves add types in the "onInstall" or "onBeforeBuild" hooks
2. The provided types may be either sourced from nexus, via `objectType`, `scalarType`, etc. or from GraphQL via `GraphQLObjectType` and such.
   - When the type is from GraphQL, a "GraphQLNamedType", we walk any fields of the type to collect any additional types which may not have been provided at the root level of the schema.
   - When the type is sourced from Nexus, we similarly executed the `definition` blocks, to be able to add any fields which are added dynamically inside the blocks.
3. Once all types are known, we begin to construct the schema, executing the definition block and

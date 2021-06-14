## Ghost Nexus:

(WIP) Demo of wrapping a GraphQL api on top of the [ghost](https://github.com/TryGhost/Ghost) blogging platform.

Makes use of [schemats](https://github.com/SweetIQ/schemats) to auto-generate types, and uses nexus's configuration to automatically bind these types to our schema generated types.

To setup, create a mysql database called `ghost_nexus` and configure the values in [config.development.js](https://github.com/graphql-nexus/schema/blob/develop/examples/ghost/config.development.json) as necessary.

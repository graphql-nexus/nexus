export const messages = {
  /* istanbul ignore next */
  removedResolveType: (location: string) => `\
The .resolveType used in the ${location} has been removed in favor of a more robust approach to handling abstract types.

Visit https://nexusjs.org/docs/guides/abstract-types for an explanation and upgrade info.

Visit https://github.com/graphql-nexus/schema/issues/188 for the original motivation for the change.
`,
  /* istanbul ignore next */
  removedDeclarativeWrapping: (location: string) => `\
The list/nullable/required object properies used in the ${location} have been removed in favor of better chaining APIs 
and the list() / nonNull() type wrapping functions. If you would like to incrementally migrate, or prefer the 
existing API, it is now supported via the declarativeWrappingPlugin. Add this to your plugins array in your makeSchema config.

makeSchema({
  plugins: [declarativeWrappingPlugin(), ...]
})
`,
  /* istanbul ignore next */
  removedFunctionShorthand: (typeName: string, fieldName: string) =>
    `Since v0.18.0 Nexus no longer supports resolver shorthands like:\n\n    t.string("${fieldName}", () => ...).\n\nInstead please write:\n\n    t.string("${fieldName}", { resolve: () => ... })\n\nIn the next major version of Nexus this will be a runtime error (seen in type ${typeName}).`,
}

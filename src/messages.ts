export const messages = {
  /* istanbul ignore next */
  removedResolveType: (location: string) => `\
The .resolveType used in the ${location} has been moved to a property on the type definition object, 
as part of of a more robust approach to handling abstract types.

Visit https://nxs.li/guides/abstract-types for an explanation and upgrade info.

Visit https://github.com/graphql-nexus/schema/issues/188 for the original motivation for the change.
`,
  /* istanbul ignore next */
  removedDeclarativeWrapping: (location: string, used: string[]) => `\
[declarativeWrappingPlugin]: The ${used.join(' / ')} object prop${
    used.length > 1 ? 's' : ''
  } used in the ${location} has been
moved to a plugin, as improved chaining APIs and the list() / nonNull() helpers functions are preferred.

On Fields: 

t.string('someField', { nullable: false })   ->    t.nonNull.string('someField')

On args: 

stringArg({ required: true })    ->    nonNull(stringArg())

If you would like to incrementally migrate, or prefer the existing API, it is now supported via the declarativeWrappingPlugin. 
Add this to your plugins array in your makeSchema config:

makeSchema({
  plugins: [declarativeWrappingPlugin(), ...]
})
`,

  removedDeclarativeWrappingShort: (location: string, used: string[]) => `\
[declarativeWrappingPlugin]: Additional warning for ${used.join(
    ' / '
  )} at ${location}. Add the declarativeWrappingPlugin() to the plugins array to disable this message.
`,
  /* istanbul ignore next */
  removedFunctionShorthand: (typeName: string, fieldName: string) =>
    `Since v0.18.0 Nexus no longer supports resolver shorthands like:\n\n    t.string("${fieldName}", () => ...).\n\nInstead please write:\n\n    t.string("${fieldName}", { resolve: () => ... })\n\nIn the next major version of Nexus this will be a runtime error (seen in type ${typeName}).`,
}

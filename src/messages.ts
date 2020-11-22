export const messages = {
  removedFunctionShorthand: (typeName: string, fieldName: string) =>
    `Since v0.18.0 Nexus no longer supports resolver shorthands like:\n\n    t.string("${fieldName}", () => ...).\n\nInstead please write:\n\n    t.string("${fieldName}", { resolve: () => ... })\n\nIn the next major version of Nexus this will be a runtime error (seen in type ${typeName}).`,
}

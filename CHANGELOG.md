# Changelog

### 0.13.1

- fix: remove transition postinstall message

### 0.13.0

The first release of Nexus schema under the package name `@nexus/schema`

### 0.12.0

The last release of Nexus schema under the package name `nexus`

See previous release notes for details on what's new in `0.12.0`

### 0.12.0-rc.14

- improve: add post-install framework notice (#398)

### 0.12.0-rc.13

- improve: add post-install framework notice (#398)
- fix: typegen always use manifest for package import (#382)

### 0.12.0-rc.12

- feat: respect manifest name in typegen imports (#380)

### 0.12.0-rc.11

- fix: TypeScript error from missing `graphql-query-complexity` import (#376)

### 0.12.0-rc.10

- feat: add `queryComplexityPlugin` (#369)
- feat: expose `name` on `fieldConfig` (#368)

### 0.12.0-rc.9

- fix: iteration if # nodes requested > connection length

### 0.12.0-rc.8

- fix: typings for `connectionPlugin` node field (#364)

### 0.12.0-rc.7

- feat: Added `connectionPlugin` (#324)

### 0.12.0-rc.6

- fix: #329: Union members typing (#363)
- fix: #361, error when using interfaceType & implements (#362)

### 0.12.0-rc.5

- feat: Add `customPrintSchemaFn` to makeSchema config

### 0.12.0-rc.4

- refactor: Remove NEXUS_SHOULD_GENERATE_ARTIFACTS env var

- feat: Add `shouldExitAfterGenerateArtifacts`

- Warn on missing `outputs` in `makeSchema` config

- Type-level `defaultResolver` has been removed, similar functionality can be achieved with the `onCreateFieldResolver` plugin API

### 0.12.0-rc.2, rc.3

- fix: bug in nullability check plugin

### 0.12.0-rc

- feat(deps): Bumps the default minimum version of graphql-js to 14.5.0

  Nexus uses the new [`extensions` property](https://github.com/graphql/graphql-js/pull/2097) on types to store metadata provided to Nexus types, in order to make them usable by plugins.

- feat: Adds "Plugins" API, [see the docs](docs/api-plugins.md) for more info on what all these can help accomplish

- feat(plugin): Add `nullabilityGuardPlugin`. See [the docs](docs/plugin-nullabilityGuard.md) for more info

- feat(plugin): Add `fieldAuthorizePlugin`. See [the docs](docs/plugin-fieldAuthorize.md) for more info

  This is the same behavior as before, but implemented more flexibly as a plugin. This will be
  automatically added if no plugins are specified, otherwise it will need to be imported & added
  to `makeSchema`.

- feat(schema): Adds `shouldExitAfterGenerateArtifacts` option to `makeSchema`

  The `shouldExitAfterGenerateArtifacts` makes it possible to exit after the types are generated,
  useful if you do not check a schema artifact into source control, but wish to generate before the code runs.

- refactor: Removes `nexusWrappedType`

  This was an internal implementation detail which should not affect end users

- refactor: Removes `t.modifyType` API

  This may not have ever worked, it was only intended to modify fields on an `objectType` which were
  originally implemented by an interface. Please open an issue if this is a breaking change for you, so we
  can understand the use-case and design a better API.

- test: Improved code coverage, adds base threshold to new PRs

#### beta.14

- feat(plugins): onInstall hook (#236)
- feat(deps): add support for TypeScript 3.6 (#255)

#### beta.13

- fix(typegen): explicitly await removeFile before write (#254)

#### beta.12

- feat(config): <strike>env var for should-generate-artifacts (#244)

  You can now set the `shouldGenerateArtifacts` config option by env var
  `NEXUS_SHOULD_GENERATE_ARTIFACTS=true|false`.</strike> (removed, see 0.12 release notes)

- fix(typegen): delete prev file before writing next (#252)

  Before, sometimes, you would have to open the typegen file to make VSCode pick
  up its changed version. This change should reduce/remove the need for this
  workaround.

* feat: <strike>by default typegen as an @types package (#230)

  BREAKING CHANGE

  You should not have to configure typegen manually anymore. We
  generate by default into `node_modules/@types/nexus-typegen` which TypeScript
  will automatically pick up. If you use the `types` `tsc` compiler option
  however, make sure to include `nexus-typegen`.

  This is a breaking change because typegen is enabled even when config
  `outputs` have not been configured (before, they were required). The
  heuristics of `shouldGenerateArtifacts` remain unchanged.</strike> (removed, see 0.12 release notes)

### 0.11.7

- Types: Allow Promise return value for subscriptions

### 0.11.6

- More for #55, incorrect return types.

### 0.11.5

- Fix lists w/ configurable depth/nullability, #89

### 0.11.4

- Fix import path gen on windows, #84
- More improvements to `MaybePromiseDeep`

### 0.11.3

- Fix type for passing `NexusWrappedType` as arg type #81
- Fix types on `MaybePromiseDeep`

### 0.11.2

- Fix `mkdir` for versions of node without recursive option (< 10.15.1).

### 0.11.1

- Export `queryField` & `subscriptionField` on public API

### 0.11.0

- Fix allowing nested input types (#68), fixes default type definitions for input fields
- Add `queryField` abstraction to mirror `mutationField`
- Alpha release of `subscriptionField` (working, but undocumented) for GraphQL subscriptions

### 0.10.0

- Add an optional field level authorize #32, part of a more robust authorization story in #23
- Add mutationField abstraction, #46

### 0.9.17

- More for #55, type error on Promise/null resolve

### 0.9.16

- Fix #52, args being incorrectly imported as types
- Feature: extendInputType, #51

### 0.9.15

- Fix #55, type error for Promise numeric field return

### 0.9.14

- Fix #44, add correct typings for union type

### 0.9.13

- Fix #41, replace `path.sep` with '/' in `typegenAutoConfig`

### 0.9.12

- Fix #33, consistent `t.list` chaining output for inputs & scalars
- Fix #34, include used imports on SDL converter
- Fix #27, args output for SDL converter
- Other SDL converter cleanup: reference types rather than strings, default values

### 0.9.11

- Fix typing regression in 0.9.10

### 0.9.10

- Fix #26, incorrect typing on boolean return type

### 0.9.9

- `TypegenConfigSourceModule`: `sources.module` -> `sources.source`

### 0.9.8

- Fix `MaybePromiseDeep` typing for non-object values
- `NexusGenCustomScalarMethods` -> `NexusGenCustomDefinitionMethods` for when we allow non-scalars to be `asNexusMethod`

### 0.9.7

- Fix `MaybePromiseDeep` typing
- Add `asNexusMethod` to annotate GraphQLScalarType

### 0.9.6

- Fallback Query construction to `missingType` internally

### 0.9.5

- Fix `nonNullDefaults` on schema
- Finalize objects as they are constructed
- Changes to a few internal methods

### 0.9.4

- Internal: nexusWrappedFn -> nexusWrappedType

### 0.9.3

- Minor internal changes

### 0.9.2

- Fixes for conditional nullability check
- Fixes for return type of MaybePromiseDeep
- Docs cleanup

### 0.9.1:

- General deploy/package.json cleanup

### 0.9.0:

- Major API changes. See #16 for more info

### 0.7.0-alpha.1

Changed the type-signatures around so fields which are not defined in the backing types associated with the

### 0.6.2

Initial release

# Changelog

### 0.12.0 (next)

#### beta.13

- fix(typegen): explicitly await removeFile before write (#254)

#### beta.12

- feat(config): env var for should-generate-artifacts (#244)

  You can now set the `shouldGenerateArtifacts` config option by env var
  `NEXUS_SHOULD_GENERATE_ARTIFACTS=true|false`.

- fix(typegen): delete prev file before writing next (#252)

  Before, sometimes, you would have to open the typegen file to make VSCode pick
  up its changed version. This change should reduce/remove the need for this
  workaround.

* feat: by default typegen as an @types package (#230)

  BREAKING CHANGE

  You should not have to configure typegen manually anymore. We
  generate by default into `node_modules/@types/nexus-typegen` which TypeScript
  will automatically pick up. If you use the `types` `tsc` compiler option
  however, make sure to include `nexus-typegen`.

  This is a breaking change because typegen is enabled even when config
  `outputs` have not been configured (before, they were required). The
  heuristics of `shouldGenerateArtifacts` remain unchanged.

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

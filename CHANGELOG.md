# Changelog

### 0.18.0

### BREAKING CHANGES

#### Remove resolver shorthands

#592 → f609380

Resolver shorthand API is now removed. The following will now not typecheck:

```ts
t.string('foo', () => ... )
```

Instead use:

```ts
t.string('foo', { resolve: () => ... })
```

Runtime support is still intact but will result in a logged warning. Runtime support will be removed in the next Nexus release.

<br/>

#### Remove dynamic output builtins

9f01342 → #590

`ext` is no longer exported. The `relayConnectionField` and `collectionField` dynamic output methods have been removed. In their place try the `connection` plugin.

<br/>
<br/>

### Features

- b19e83e Allow specifying a node module for type imports (#604)

### Fixes

- 2e93338 deduplicate interfaces implementing interfaces (#608)
- 0064dc9 #588, #384 non-null list items & connection nullability (#598)

### Improvements

- f609380 (breaking) remove resolver shorthands (#592)
- 9f01342 (breaking) remove dynamic output builtins (#590)

### Docs

- ca74442 update zeit example
- 2de6f89 document subscription type (#593)

### Chores

- 6e06f8f Fixes broken windows tests (#607)

### 0.17.0

#### Features

- 9bfdf2c allow interfaces to implement other interfaces (#496)
- b4e0deb add onObjectDefinition / onInputObjectDefinition (#533)
- f8d164a error feedback if root typing path is invalid (#557)

  This may be a breaking change if you were relying on pointing root typing path to a non-file for some reason in the past. We think for almost all users this will not be a breaking change however.

#### Fixes

- 10c5f8b "union too complex to represent" for large union types (#571)
- cc12ec1 (connection plugin) add deprecated, description, nullable to connectionField (#578)
- de7cdfd (connection plugin) various fixes (#569)
  - Global connection field extensions were never executed
  - Typings of global connection field extension (root, args and the resolver return type was wrong)
  - Typings of local connection field extension (everything was any)
- 2edfcfa subscription type static typings (#564)
- 10208e3 input fields with default should not be typed as optional (#563)

#### Improvements

- 083c1ad test: capture union too large error
- 76e6eff test: improve connection plugin tests

#### Docs

- 489b5ab docs: Fix ts-node-dev flag in the docs (#529)
- fb1216e header media query (#554)
- 2aaaf5c fix nullabillity guard docs (#575)
- 980920a fix for outdated prisma-labs link in the documentation #518 (#572)
- 9960015 Update 06-chapter-5-persisting-data-via-prisma.mdx (#574)
- e65f6ef Remove references to nexus framework (#528)
- c68a94c fix typo in migration guide (#527)
- 69af932 fix typo in nexus framework migration guide (#526)
- 8cea40a Fix a prisma client call b/c latest Prisma Client (#535)
- 0a6db6a fix link to announcement (#544)
- e2cfcb0 fix typo in 02-chapter-1-setup-and-first-query docs (#547)
- ebdb55a Update docs content (#553)
- 00fb8a6 fix duplicate in 020-nexus-framework-users.mdx (#561)
- 04fe2f5 touch api/schema.ts (#562)
- ceeea8c fix typos
- d4d32f7 fix migration guide ts-node command
- 0dd8ea3 Fix a typo in 030-neuxs-framework-prisma-users.mdx (#537)
- d1bb819 Remove framework mention, update link (#525)

#### Chores

- 393de57 update test in trunk.yml
- a8df05c Use codecov/codecov-action GH action (#534)
- 85bf467 Restoring codecov (#532)
- 8f3189c Keep prettier config local to the project (#531)
- 2bceeb9 Bumping deps & adding scripts for running examples (#530)
- 27d5b82 update url in package.json (#524)

### 0.16.0

#### BREAKING CHANGES

- c7eff85 output types & list items are now nullable by default (#508)
- 0ee644b upgrade to graphql v15 (#486)

#### MIGRATION GUIDE

As Nexus Schema just made output types and list items nullable by default, there's a couple of changes you need to do to produce the same schema as before the update.

**Changing global defaults to revert to non-nullable output types**

```diff
import { makeSchema } from '@nexus/schema'

makeSchema({
+  nonNullDefaults: {
+    output: true
+  }
})
```

**Changing type-level configuration to revert to non-nullable output types**

```diff
import { objectType } from '@nexus/schema'

objectType({
  name: 'User',
  nonNullDefaults: {
+   output: true
  }
  definition(t) {
    /* ... */
  }
})
```

**Updating lists output types to be non-nullable**

```diff
import { objectType } from '@nexus/schema'

objectType({
  name: 'User',
  definition(t) {
    t.field('posts', {
-     list: true
+     list: [true]
    })
  }
})
```

#### Features

- c7eff85 (breaking) output types & list items are now nullable by default (#508)
- efa96cb new docs site (#500)
- 0ee644b (breaking) upgrade to graphql v15 (#486)

#### Fixes

- e4a68e5 config file fixed (#522)
- 646879d change netlify config (#519)
- 796add7 Github link
- b7ecbb0 Logo URL and Github link
- 2327a94 force release
- 3c38a65 message for missing resolveType in interfaces (#495)

#### Improvements

- 2fef488 tmp: tmp/index.html
- 99b34f6 temp: Temporary redirects for old nexus.js.org (#514)
- 5e156ac docs: update asNexusMethod example with the changes from #473 (#476)

#### Chores

- a44dbe4 fix link
- f8288b5 fix link
- 58c3ad9 release changes
- ddb1211 upgrade dripip

#### Unspecified Changes

- 4bd0ffc Update netlify.toml (#521)

### 0.15.0

#### BREAKING CHANGES

- 1d97b78 allow asNexusMethod to specify TS type (#473)

  The global TS type `NexusGenRootTypes` no longer contains scalars. All scalars now live under a new global TS type named `NexusGenScalars`.

  ```ts
  // before
  let foo: NexusGenRootTypes['String']
  ```

  ```ts
  // after
  let foo: NexusGenScalars['String']
  ```

- 122b0e1 base `hasNextPage` in connectionPlugin upon gt not gte (#458)

#### Features

- 1d97b78 (breaking) allow asNexusMethod to specify TS type (#473)

  - Create a new `NexusGenScalars` for all scalar types
  - Remove scalars from `NexusGenRootTypes` (might be a breaking change, need review)
  - Use the `NexusGenScalars` for all non specified (base GraphQL) scalars in `input` and `output` types
  - Add `rootTyping` parameter to `asNexusMethod` to allow the user to specify it, otherwise it will fallback to the `backingTypeMap`

- 903ceb8 add subscriptionType (#462)
- ee7c371 use prettier api to load config (#460)
- 9c8e776 support typescript 3.9 (#459)
- 122b0e1 (breaking) base hasNextPage in connectionPlugin upon gt not gte (#458)

#### Fixes

- 61eccca MaybePromiseDeep case of null with .then (#475)
- 5b900b1 connectionPlugin config: allow first and last to be zero (#436)

#### Improvements

- bf0df64 tests: add windows to os matrix (#405)

#### Chores

- f0c163a move renovate config into github dir
- 78af756 format with prisma-labs prettier config (#461)
- fe2553c Update repo name in examples readme (#443)
- b3abdb9 dripip managed version

### 0.14.0

#### Features

- 133c4a4 publish esm builds (#438)
- a6c29ba allow control over nexus schema import id (#408)

#### Fixes

- 8c7615e return types of queryField and mutationField (#415)
- 035e0a1 typegen stable path generation with Windows (#400)

#### Improvements

- 286bd66 improve: update warning to use new package name
- 358c33e refactor: add typegen utils module
- 72a13a9 refactor: update lang headers
- cd08bb2 refactor: update lang headers
- b9df04b refactor: getOwnPackage util (#409)
- 3156f9b refactor: sort imports

#### Chores

- 8c7b047 setup dripip for release scripts
- 7fce3dc fix links (#433)
- 57f1c7c update example lock file, fix tests
- 6e58acd Disable Renovate (#430)
- 0518101 fix typo on readme file (#420)
- 70d2abb fix link
- d74f997 examples update
- 17fad3a update snapshots
- 9deb327 setup renovate
- a10463e update lockfile entries (#404)
- ccae81a update changelog

#### Unspecified Changes

- d597086 v0.14.0-next.2
- 63e9ea0 v0.14.0-next.1

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

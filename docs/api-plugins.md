---
id: api-extendType
title: Nexus Plugins
sidebar_label: plugins
---

Nexus ships with a plugin API which allows you to define your own abstractions when building out a GraphQL schema. The plugins allow you to tap in and define custom types, layer runtime execution before and after a resolver, introspect the schema.

## Plugin Config:

### name

Every plugin is required to have a unique name identifying the plugin.

### description

### onInstall

The "onInstall" hook is used as it sounds - it is invoked once before any of the types are processed for the schema. This hook is primarily useful in allowing a plugin to add "dynamics fields" to augment the API of the definition block.

### onBeforeBuild

The "onBeforeBuild" occurs just before the schema is constructed,

### onAfterBuild

The "onAfterBuild" hook

### onCreateFieldResolver

Every ObjectType, whether they are defined via Nexus' `objectType` api, or

###

### onMissingType

The "onMissingType" hook occurs

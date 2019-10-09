import { forEach, isCollection } from "iterall";
import { isPromiseLike } from "../src/core";

describe("plugin", () => {
  it.skip("is applied to the resolver for every field in the schema", () => {});
  it.skip("warns when the plugin is included in the types but not the plugins array", () => {});
  it.skip("calls onInstall before walking the types, useful for adding dynamic fields", () => {});
  it.skip("calls onBeforeBuild before materializing the types, useful for checking for missing types not defined by the user", () => {});
  it.skip("has an onMissingType, which will be called in order when we encounter a missing type", () => {});
  it.skip("has an onCreateFieldResolver, which will be called in order when we encounter a missing type", () => {});
  it.skip("has an onCreateFieldSubscribe, which will be called in order when we encounter a missing type", () => {});
  it.skip("composes the onCreateFieldResolve fns", () => {});
  it.skip("has a plugin.completeValue fn which is used to efficiently complete a value which is possibly a promise", () => {});
});

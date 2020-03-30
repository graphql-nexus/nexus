import * as monaco from "monaco-editor";
import "./monaco-graphql";

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2016,
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.CommonJS,
  noEmit: true,
});

const allTypeDefs = [
  require("raw-loader!graphql/index.d.ts"),
  require("raw-loader!graphql/graphql.d.ts"),
  require("raw-loader!graphql/type/definition.d.ts"),
  require("raw-loader!graphql/type/directives.d.ts"),
  require("raw-loader!graphql/type/index.d.ts"),
  require("raw-loader!graphql/type/introspection.d.ts"),
  require("raw-loader!graphql/type/scalars.d.ts"),
  require("raw-loader!graphql/type/schema.d.ts"),
  require("raw-loader!graphql/type/validate.d.ts"),
  require("raw-loader!nexus/dist/blocks.d.ts"),
  require("raw-loader!nexus/dist/builder.d.ts"),
  require("raw-loader!nexus/dist/core.d.ts"),
  require("raw-loader!nexus/dist/dynamicMethod.d.ts"),
  require("raw-loader!nexus/dist/dynamicProperty.d.ts"),
  require("raw-loader!nexus/dist/extensions.d.ts"),
  require("raw-loader!nexus/dist/index.d.ts"),
  require("raw-loader!nexus/dist/lang.d.ts"),
  require("raw-loader!nexus/dist/plugin.d.ts"),
  require("raw-loader!nexus/dist/sdlConverter.d.ts"),
  require("raw-loader!nexus/dist/typegenAutoConfig.d.ts"),
  require("raw-loader!nexus/dist/typegenFormatPrettier.d.ts"),
  require("raw-loader!nexus/dist/typegenMetadata.d.ts"),
  require("raw-loader!nexus/dist/typegenPrinter.d.ts"),
  require("raw-loader!nexus/dist/typegenTypeHelpers.d.ts"),
  require("raw-loader!nexus/dist/utils.d.ts"),
  require("raw-loader!nexus/dist/definitions/_types.d.ts"),
  require("raw-loader!nexus/dist/definitions/args.d.ts"),
  require("raw-loader!nexus/dist/definitions/decorateType.d.ts"),
  require("raw-loader!nexus/dist/definitions/definitionBlocks.d.ts"),
  require("raw-loader!nexus/dist/definitions/enumType.d.ts"),
  require("raw-loader!nexus/dist/definitions/extendInputType.d.ts"),
  require("raw-loader!nexus/dist/definitions/extendType.d.ts"),
  require("raw-loader!nexus/dist/definitions/inputObjectType.d.ts"),
  require("raw-loader!nexus/dist/definitions/interfaceType.d.ts"),
  require("raw-loader!nexus/dist/definitions/mutationField.d.ts"),
  require("raw-loader!nexus/dist/definitions/objectType.d.ts"),
  require("raw-loader!nexus/dist/definitions/queryField.d.ts"),
  require("raw-loader!nexus/dist/definitions/scalarType.d.ts"),
  require("raw-loader!nexus/dist/definitions/subscriptionField.d.ts"),
  require("raw-loader!nexus/dist/definitions/unionType.d.ts"),
  require("raw-loader!nexus/dist/definitions/wrapping.d.ts"),
  require("raw-loader!nexus/dist/dynamicMethods/collection.d.ts"),
  require("raw-loader!nexus/dist/dynamicMethods/index.d.ts"),
  require("raw-loader!nexus/dist/dynamicMethods/relayConnection.d.ts"),
  require("raw-loader!nexus/dist/plugins/fieldAuthorizePlugin.d.ts"),
  require("raw-loader!nexus/dist/plugins/index.d.ts"),
  require("raw-loader!nexus/dist/plugins/nullabilityGuardPlugin.d.ts"),
];

const files = [
  "graphql/index.d.ts",
  "graphql/graphql.d.ts",
  "graphql/type/definition.d.ts",
  "graphql/type/directives.d.ts",
  "graphql/type/index.d.ts",
  "graphql/type/introspection.d.ts",
  "graphql/type/scalars.d.ts",
  "graphql/type/schema.d.ts",
  "graphql/type/validate.d.ts",
  "nexus/blocks.d.ts",
  "nexus/builder.d.ts",
  "nexus/core.d.ts",
  "nexus/dynamicMethod.d.ts",
  "nexus/dynamicProperty.d.ts",
  "nexus/extensions.d.ts",
  "nexus/index.d.ts",
  "nexus/lang.d.ts",
  "nexus/plugin.d.ts",
  "nexus/sdlConverter.d.ts",
  "nexus/typegenAutoConfig.d.ts",
  "nexus/typegenFormatPrettier.d.ts",
  "nexus/typegenMetadata.d.ts",
  "nexus/typegenPrinter.d.ts",
  "nexus/typegenTypeHelpers.d.ts",
  "nexus/utils.d.ts",
  "nexus/definitions/_types.d.ts",
  "nexus/definitions/args.d.ts",
  "nexus/definitions/decorateType.d.ts",
  "nexus/definitions/definitionBlocks.d.ts",
  "nexus/definitions/enumType.d.ts",
  "nexus/definitions/extendInputType.d.ts",
  "nexus/definitions/extendType.d.ts",
  "nexus/definitions/inputObjectType.d.ts",
  "nexus/definitions/interfaceType.d.ts",
  "nexus/definitions/mutationField.d.ts",
  "nexus/definitions/objectType.d.ts",
  "nexus/definitions/queryField.d.ts",
  "nexus/definitions/scalarType.d.ts",
  "nexus/definitions/subscriptionField.d.ts",
  "nexus/definitions/unionType.d.ts",
  "nexus/definitions/wrapping.d.ts",
  "nexus/dynamicMethods/collection.d.ts",
  "nexus/dynamicMethods/index.d.ts",
  "nexus/dynamicMethods/relayConnection.d.ts",
  "nexus/plugins/fieldAuthorizePlugin.d.ts",
  "nexus/plugins/index.d.ts",
  "nexus/plugins/nullabilityGuardPlugin.d.ts",
];

files.forEach((file, i) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    allTypeDefs[i],
    `file:///node_modules/${file}`
  );
});

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `
import * as nexus from 'nexus'

// Re-export these so we can use globally in the sandbox
// while still preserving the typegen
declare global {
  declare const core: typeof nexus.core;
  declare const arg: typeof nexus.arg;
  declare const intArg: typeof nexus.intArg;
  declare const stringArg: typeof nexus.stringArg;
  declare const floatArg: typeof nexus.floatArg;
  declare const idArg: typeof nexus.idArg;
  declare const booleanArg: typeof nexus.booleanArg;
  declare const enumType: typeof nexus.enumType;
  declare const unionType: typeof nexus.unionType;
  declare const scalarType: typeof nexus.scalarType;
  declare const directiveType: typeof nexus.directiveType;
  declare const objectType: typeof nexus.objectType;
  declare const interfaceType: typeof nexus.interfaceType;
  declare const inputObjectType: typeof nexus.inputObjectType;
}
`,
  "file:///sandbox-globals.ts"
);

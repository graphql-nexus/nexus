import * as monaco from "monaco-editor";

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2016,
  // lib: ["lib", "ScriptHost", "es5", "es6"],
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.CommonJS,
  noEmit: true,
});

const allTypeDefs = [
  require("raw-loader!@types/graphql/index.d.ts"),
  require("raw-loader!@types/graphql/graphql.d.ts"),
  require("raw-loader!@types/graphql/type/definition.d.ts"),
  require("raw-loader!@types/graphql/type/directives.d.ts"),
  require("raw-loader!@types/graphql/type/index.d.ts"),
  require("raw-loader!@types/graphql/type/introspection.d.ts"),
  require("raw-loader!@types/graphql/type/scalars.d.ts"),
  require("raw-loader!@types/graphql/type/schema.d.ts"),
  require("raw-loader!@types/graphql/type/validate.d.ts"),
  require("raw-loader!gqliteral/dist/builder.d.ts"),
  require("raw-loader!gqliteral/dist/core.d.ts"),
  require("raw-loader!gqliteral/dist/definitions.d.ts"),
  require("raw-loader!gqliteral/dist/index.d.ts"),
  require("raw-loader!gqliteral/dist/lang.d.ts"),
  require("raw-loader!gqliteral/dist/metadata.d.ts"),
  require("raw-loader!gqliteral/dist/typegen.d.ts"),
  require("raw-loader!gqliteral/dist/types.d.ts"),
  require("raw-loader!gqliteral/dist/utils.d.ts"),
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
  "gqliteral/builder.d.ts",
  "gqliteral/core.d.ts",
  "gqliteral/definitions.d.ts",
  "gqliteral/index.d.ts",
  "gqliteral/lang.d.ts",
  "gqliteral/metadata.d.ts",
  "gqliteral/typegen.d.ts",
  "gqliteral/types.d.ts",
  "gqliteral/utils.d.ts",
];

files.forEach((file, i) => {
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    allTypeDefs[i],
    `file:///node_modules/${file}`
  );
});

monaco.languages.typescript.typescriptDefaults.addExtraLib(
  `
import * as nexus from 'graphql-nexus'

// Re-export these so we can use globally in the sandbox
// while still preserving the typegen
declare global {
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

monaco.languages.register({ id: "graphql" });

// https://code.visualstudio.com/blogs/2017/02/08/syntax-highlighting-optimizations
monaco.languages.setMonarchTokensProvider("graphql", {
  ignoreCase: true,
  // @ts-ignore
  keywords: [
    "type",
    "input",
    "scalar",
    "enum",
    "union",
    "implements",
    "interface",
    "directive",
  ],
  tokenizer: {
    root: [
      { include: "@whitespace" },
      [
        /[a-z_$][\w$]*/,
        {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],
    ],
    whitespace: [
      [/\s+/, "white"],
      [/(^#.*$)/, "comment"],
      [/(""".*""")/, "string"],
      [/""".*$/, "string", "@endDblDocString"],
    ],
    endDocString: [[/.*$/, "string"]],
    endDblDocString: [
      [/\\"/, "string"],
      [/.*"""/, "string", "@popall"],
      [/.*$/, "string"],
    ],
  },
});

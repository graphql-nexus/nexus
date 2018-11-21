import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  objectType,
  interfaceType,
  inputObjectType,
  unionType,
  enumType,
  scalarType,
  abstractType,
  directiveType,
  arg,
  buildSchemaWithMetadata,
  core,
} from "gqliteral";
import { printSchema, GraphQLSchema, graphql } from "graphql";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { OutputPanel } from "./panels";
import * as urlHash from "./urlHash";
import { GQLiteralMetadata } from "../../dist/metadata";

interface GraphiQLProps {
  fetcher: Function;
  defaultQuery?: string;
}

declare global {
  const GraphiQL: React.ComponentClass<GraphiQLProps>;
}

interface PlaygroundProps {
  initialSchema: string;
  initialQuery: string;
}

export const Playground: React.SFC<PlaygroundProps> = (props) => {
  // const original = urlHash.read();
  const editorRef = useRef(null);
  const graphiqlRef = useRef(null);
  const [content, setContent] = useState(props.initialSchema);
  const [schemaError, setSchemaError] = useState<Error | null>(null);
  const [activeSchema, setActiveSchema] = useState<{
    schema: GraphQLSchema;
    metadata: GQLiteralMetadata;
  } | null>(null);

  const printedSchema = useMemo(
    () => (activeSchema ? printSchema(activeSchema.schema) : ""),
    [activeSchema]
  );

  useEffect(() => {
    if (editorRef.current) {
      const editor = monaco.editor.create(editorRef.current, {
        language: "typescript",
        model: monaco.editor.createModel(
          content,
          "typescript",
          monaco.Uri.file("main.ts")
        ),
        minimap: {
          enabled: false,
        },
        scrollBeyondLastLine: false,
      });
      const debouncedChange = debounce(() => {
        setContent(editor.getValue());
      }, 100);
      editor.onDidChangeModelContent(debouncedChange);
      return () => editor.dispose();
    }
  }, []);

  useEffect(
    () => {
      const { schema, metadata, error } = getCurrentSchema(content);
      if (error) {
        setSchemaError(error);
      } else {
        setActiveSchema({ schema, metadata });
      }
    },
    [content]
  );

  useEffect(
    () => {
      if (activeSchema && graphiqlRef.current) {
        graphiqlRef.current.handleRunQuery();
      }
    },
    [activeSchema, graphiqlRef.current]
  );

  return (
    <div className="editors-container">
      <div className="editors">
        <div ref={editorRef} style={{ flexBasis: "50%", height: "100%" }} />
        <div style={{ flexDirection: "column", width: "50%", height: "100%" }}>
          <OutputPanel mode="graphql" value={printedSchema || ""} ruler={80} />
          {activeSchema && (
            <GraphiQL
              ref={graphiqlRef}
              key={printedSchema}
              defaultQuery={props.initialQuery}
              fetcher={(params) => {
                return graphql(activeSchema.schema, params.query);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

type SchemaOrError =
  | { schema: GraphQLSchema; metadata: GQLiteralMetadata; error: null }
  | { schema: null; metadata: null; error: Error };

function getCurrentSchema(code): SchemaOrError {
  const cache = [];
  function add(val: any) {
    cache.push(val);
    return val;
  }
  const singleton = {
    objectType(name: any, fn: any) {
      return add(objectType(name, fn));
    },
    interfaceType(name: any, fn: any) {
      return add(interfaceType(name, fn));
    },
    inputObjectType(name: any, fn: any) {
      return add(inputObjectType(name, fn));
    },
    enumType(name: any, fn: any) {
      return add(enumType(name, fn));
    },
    unionType(name: any, fn: any) {
      return add(unionType(name, fn));
    },
    scalarType(name: any, fn: any) {
      return add(scalarType(name, fn));
    },
    directiveType(name: any, fn: any) {
      return add(directiveType(name, fn));
    },
  };
  try {
    const fn = new Function(
      "abstractType",
      "objectType",
      "interfaceType",
      "inputObjectType",
      "enumType",
      "unionType",
      "scalarType",
      "directiveType",
      "arg",
      `
        "use strict";
        ${code};
      `
    );
    fn(
      abstractType,
      singleton.objectType,
      singleton.interfaceType,
      singleton.inputObjectType,
      singleton.enumType,
      singleton.unionType,
      singleton.scalarType,
      singleton.directiveType,
      arg
    );
    const { schema, metadata } = buildSchemaWithMetadata({
      types: cache,
      outputs: false,
    });

    const sortedSchema = metadata.sortSchema(schema);

    return { schema: sortedSchema, metadata, error: null };
  } catch (error) {
    return { schema: null, metadata: null, error };
  }
}

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
import * as gqliteral from 'gqliteral'

// Re-export these so we can use globally in the sandbox
// while still preserving the typegen
declare global {
  declare const arg: typeof gqliteral.arg;
  declare const enumType: typeof gqliteral.enumType;
  declare const unionType: typeof gqliteral.unionType;
  declare const scalarType: typeof gqliteral.scalarType;
  declare const directiveType: typeof gqliteral.directiveType;
  declare const objectType: typeof gqliteral.objectType;
  declare const interfaceType: typeof gqliteral.interfaceType;
  declare const inputObjectType: typeof gqliteral.inputObjectType;
}
`,
  "file:///sandbox-globals.ts"
);

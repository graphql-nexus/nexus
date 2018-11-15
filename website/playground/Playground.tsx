import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  GQLiteralObject,
  GQLiteralInterface,
  GQLiteralInputObject,
  GQLiteralUnion,
  GQLiteralEnum,
  GQLiteralScalar,
  GQLiteralSchema,
  GQLiteralAbstractType,
  GQLiteralDirective,
  GQLiteralArg,
} from "gqliteral";
import { printSchema, GraphQLSchema, graphql } from "graphql";
import * as monaco from "monaco-editor";
import debounce from "lodash.debounce";
import { OutputPanel } from "./panels";
import * as urlHash from "./urlHash";

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
  const [activeSchema, setActiveSchema] = useState<GraphQLSchema | null>(null);

  const printedSchema = useMemo(
    () => (activeSchema ? printSchema(activeSchema) : ""),
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
      editor.onDidChangeModelContent(
        debounce(() => {
          setContent(editor.getValue());
        }, 100)
      );
      return () => editor.dispose();
    }
  }, []);

  useEffect(
    () => {
      const { schema, error } = getCurrentSchema(content);
      if (error) {
        setSchemaError(error);
      } else {
        setActiveSchema(schema);
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
                return graphql(activeSchema, params.query);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

type SchemaOrError =
  | { schema: GraphQLSchema; error: null }
  | { schema: null; error: Error };

function getCurrentSchema(code): SchemaOrError {
  const cache = [];
  function add(val: any) {
    cache.push(val);
    return val;
  }
  const singleton = {
    GQLiteralObject(name: any, fn: any) {
      return add(GQLiteralObject(name, fn));
    },
    GQLiteralInterface(name: any, fn: any) {
      return add(GQLiteralInterface(name, fn));
    },
    GQLiteralInputObject(name: any, fn: any) {
      return add(GQLiteralInputObject(name, fn));
    },
    GQLiteralEnum(name: any, fn: any) {
      return add(GQLiteralEnum(name, fn));
    },
    GQLiteralUnion(name: any, fn: any) {
      return add(GQLiteralUnion(name, fn));
    },
    GQLiteralScalar(name: any, fn: any) {
      return add(GQLiteralScalar(name, fn));
    },
    GQLiteralDirective(name: any, fn: any) {
      return add(GQLiteralDirective(name, fn));
    },
  };
  try {
    const fn = new Function(
      "GQLiteralAbstractType",
      "GQLiteralObject",
      "GQLiteralInterface",
      "GQLiteralInputObject",
      "GQLiteralEnum",
      "GQLiteralUnion",
      "GQLiteralScalar",
      "GQLiteralDirective",
      "GQLiteralArg",
      `
        "use strict";
        ${code};
      `
    );
    fn(
      GQLiteralAbstractType,
      singleton.GQLiteralObject,
      singleton.GQLiteralInterface,
      singleton.GQLiteralInputObject,
      singleton.GQLiteralEnum,
      singleton.GQLiteralUnion,
      singleton.GQLiteralScalar,
      singleton.GQLiteralDirective,
      GQLiteralArg
    );
    const schema = GQLiteralSchema({
      types: cache,
      definitionFilePath: false,
      typeGeneration: {
        typesFilePath: "file:///index.ts",
      },
    });
    return { schema, error: null };
  } catch (error) {
    return { schema: null, error };
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
  require("raw-loader!gqliteral/dist/definitions.d.ts"),
  require("raw-loader!gqliteral/dist/index.d.ts"),
  require("raw-loader!gqliteral/dist/objects.d.ts"),
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
  "gqliteral/definitions.d.ts",
  "gqliteral/index.d.ts",
  "gqliteral/objects.d.ts",
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
  declare const GQLiteralArg: typeof gqliteral.GQLiteralArg;
  declare const GQLiteralEnum: typeof gqliteral.GQLiteralEnum;
  declare const GQLiteralUnion: typeof gqliteral.GQLiteralUnion;
  declare const GQLiteralScalar: typeof gqliteral.GQLiteralScalar;
  declare const GQLiteralDirective: typeof gqliteral.GQLiteralDirective;
  declare const GQLiteralObject: typeof gqliteral.GQLiteralObject;
  declare const GQLiteralInterface: typeof gqliteral.GQLiteralInterface;
  declare const GQLiteralInputObject: typeof gqliteral.GQLiteralInputObject;
}
`,
  "file:///sandbox-globals.ts"
);

// @ts-ignore
window.writeFileShim = function() {
  console.log(arguments);
};

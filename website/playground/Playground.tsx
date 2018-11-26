import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  objectType,
  interfaceType,
  inputObjectType,
  unionType,
  enumType,
  scalarType,
  directiveType,
  makeSchemaWithMetadata,
  arg,
  intArg,
  stringArg,
  floatArg,
  idArg,
  booleanArg,
  core,
} from "gqliteral";
import { GraphQLSchema, graphql } from "graphql";
import * as monaco from "monaco-editor";
import "./monaco-config";
import debounce from "lodash.debounce";
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

const COMMON_CONFIG: monaco.editor.IEditorConstructionOptions = {
  minimap: {
    enabled: false,
  },
  scrollBeyondLastLine: false,
  lineNumbersMinChars: 3,
};
const COMMON_READONLY_CONFIG: monaco.editor.IEditorConstructionOptions = {
  ...COMMON_CONFIG,
  readOnly: true,
  contextmenu: false,
  renderLineHighlight: "none",
};

function monacoRef() {
  return useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
}

export const Playground: React.SFC<PlaygroundProps> = (props) => {
  // const original = urlHash.read();
  const [codeDiv, schemaDiv, typesDiv] = [
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const [codeEditorRef, schemaEditorRef, typesEditorRef] = [
    monacoRef(),
    monacoRef(),
    monacoRef(),
  ];
  const graphiqlRef = useRef(null);
  const [activeEditor, setActiveEditor] = useState<"SDL" | "TYPES">("SDL");
  const [content, setContent] = useState(props.initialSchema);
  const [schemaError, setSchemaError] = useState<Error | null>(null);
  const [activeSchema, setActiveSchema] = useState<{
    schema: GraphQLSchema;
    metadata: core.GraphQLiteralMetadata;
  } | null>(null);

  const printedSchema = useMemo(
    () =>
      activeSchema
        ? activeSchema.metadata.generateSchemaFile(activeSchema.schema)
        : "",
    [activeSchema]
  );
  const generatedTypes = useMemo(
    () =>
      activeSchema
        ? activeSchema.metadata.generateTypesFile(activeSchema.schema, true)
        : "",
    [printedSchema]
  );

  useEffect(() => {
    if (codeDiv.current) {
      const codeEditor = monaco.editor.create(codeDiv.current, {
        language: "typescript",
        model: monaco.editor.createModel(
          content,
          "typescript",
          monaco.Uri.file("main.ts")
        ),
        ...COMMON_CONFIG,
      });
      const typesEditor = monaco.editor.create(typesDiv.current, {
        language: "typescript",
        model: monaco.editor.createModel(
          generatedTypes,
          "typescript",
          monaco.Uri.file("generated-typings.d.ts")
        ),
        ...COMMON_READONLY_CONFIG,
      });
      const schemaEditor = monaco.editor.create(schemaDiv.current, {
        language: "graphql",
        model: monaco.editor.createModel(
          printedSchema,
          "graphql",
          monaco.Uri.file("sdl.graphql")
        ),
        ...COMMON_READONLY_CONFIG,
      });
      codeEditorRef.current = codeEditor;
      schemaEditorRef.current = schemaEditor;
      typesEditorRef.current = typesEditor;
      const debouncedChange = debounce(() => {
        setContent(codeEditor.getValue());
      }, 100);
      codeEditor.onDidChangeModelContent(debouncedChange as any);
      return () => codeEditor.dispose();
    }
  }, []);

  useEffect(
    () => {
      schemaEditorRef.current.setValue(printedSchema);
    },
    [printedSchema]
  );

  useEffect(
    () => {
      const { schema, metadata, error } = getCurrentSchema(content);
      if (error) {
        setSchemaError(error);
      } else {
        setActiveSchema({ schema, metadata });
        setSchemaError(null);
      }
    },
    [content]
  );

  useEffect(
    () => {
      if (codeEditorRef.current) {
        codeEditorRef.current.layout();
      }
      if (typesEditorRef.current) {
        typesEditorRef.current.layout();
      }
    },
    [schemaError, activeEditor]
  );

  useEffect(
    () => {
      if (activeSchema && graphiqlRef.current) {
        graphiqlRef.current.handleRunQuery();
      }
    },
    [activeSchema, graphiqlRef.current]
  );

  useEffect(
    () => {
      if (generatedTypes) {
        const disposable = monaco.languages.typescript.typescriptDefaults.addExtraLib(
          generatedTypes,
          "file:///generated-types.d.ts"
        );
        if (typesEditorRef.current) {
          typesEditorRef.current.setValue(generatedTypes);
        }
        return () => disposable.dispose();
      }
    },
    [generatedTypes]
  );

  const toggleSDL = useCallback(() => setActiveEditor("SDL"), []);
  const toggleTypings = useCallback(() => setActiveEditor("TYPES"), []);
  const sdlButtonStyle = activeEditor === "SDL" ? { color: "#800020" } : {};
  const typingsButtonStyle =
    activeEditor === "TYPES" ? { color: "#800020" } : {};

  return (
    <div className="editors-container">
      <div className="editors">
        <div
          style={{ flexBasis: "50%", height: "100%", flexDirection: "column" }}
        >
          <div ref={codeDiv} style={{ height: schemaError ? "95%" : "100%" }} />
          {schemaError ? (
            <div
              style={{
                height: "5%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <div style={{ color: "#FF5759", marginLeft: 10 }}>
                {schemaError.message}
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ flexDirection: "column", width: "50%", height: "100%" }}>
          <div style={{ position: "fixed", right: 14, top: 55, zIndex: 1000 }}>
            <button onClick={toggleSDL} style={sdlButtonStyle}>
              SDL
            </button>
            <button onClick={toggleTypings} style={typingsButtonStyle}>
              typings
            </button>
          </div>
          <div
            ref={schemaDiv}
            className="readonly-editor"
            style={{
              height: activeEditor === "SDL" ? "50%" : "0%",
              display: activeEditor === "SDL" ? "block" : "none",
            }}
          />
          <div
            ref={typesDiv}
            className="readonly-editor"
            style={{
              height: activeEditor === "TYPES" ? "50%" : "0%",
              display: activeEditor === "TYPES" ? "block" : "none",
            }}
          />
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
  | { schema: GraphQLSchema; metadata: core.GraphQLiteralMetadata; error: null }
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
      "objectType",
      "interfaceType",
      "inputObjectType",
      "enumType",
      "unionType",
      "scalarType",
      "directiveType",
      "arg",
      "intArg",
      "stringArg",
      "floatArg",
      "idArg",
      "booleanArg",
      `
        "use strict";
        ${code};
      `
    );
    fn(
      singleton.objectType,
      singleton.interfaceType,
      singleton.inputObjectType,
      singleton.enumType,
      singleton.unionType,
      singleton.scalarType,
      singleton.directiveType,
      arg,
      intArg,
      stringArg,
      floatArg,
      idArg,
      booleanArg
    );
    const { schema, metadata } = makeSchemaWithMetadata({
      types: cache,
      outputs: false,
    });

    const sortedSchema = metadata.sortSchema(schema);

    return { schema: sortedSchema, metadata, error: null };
  } catch (error) {
    return { schema: null, metadata: null, error };
  }
}

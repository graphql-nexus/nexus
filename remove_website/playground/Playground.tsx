import {
  arg,
  booleanArg,
  core,
  enumType,
  floatArg,
  idArg,
  inputObjectType,
  intArg,
  interfaceType,
  objectType,
  scalarType,
  stringArg,
  unionType,
} from "@nexus/schema";
import { graphql, GraphQLSchema, lexicographicSortSchema } from "graphql";
import debounce from "lodash.debounce";
import * as monaco from "monaco-editor";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebounce } from "use-debounce";
import "./monaco-config";
// import * as urlHash from "./urlHash";

interface GraphiQLProps {
  fetcher: Function;
  defaultQuery?: string;
  onToggleDocs?: (toggle: boolean) => any;
  storage?: Storage;
}

interface GraphiQLComponent extends React.Component<GraphiQLProps> {
  handleRunQuery(): any;
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
    useRef<null | HTMLDivElement>(null),
    useRef<null | HTMLDivElement>(null),
    useRef<null | HTMLDivElement>(null),
  ];
  const [codeEditorRef, schemaEditorRef, typesEditorRef] = [
    monacoRef(),
    monacoRef(),
    monacoRef(),
  ];
  const graphiqlRef = useRef<null | GraphiQLComponent>(null);
  const [activeEditor, setActiveEditor] = useState<"SDL" | "TYPES">("SDL");
  const [content, setContent] = useState(props.initialSchema);
  const [schemaError, setSchemaError] = useState<Error | null>(null);
  const [generatedTypes, setGeneratedTypes] = useState("");
  const [activeSchema, setActiveSchema] = useState<{
    schema: GraphQLSchema;
    metadata: core.TypegenMetadata;
  } | null>(null);
  const [debouncedSchema] = useDebounce<{
    schema: GraphQLSchema;
    metadata: core.TypegenMetadata;
  } | null>(activeSchema, 100);

  const printedSchema = useMemo(
    () =>
      debouncedSchema
        ? debouncedSchema.metadata.generateSchemaFile(debouncedSchema.schema)
        : "",
    [debouncedSchema]
  );
  useEffect(() => {
    if (debouncedSchema) {
      debouncedSchema.metadata
        .generateTypesFile(debouncedSchema.schema, {
          dynamicInputFields: {},
          dynamicOutputField: {},
        })
        .then((generated) => {
          setGeneratedTypes(generated);
        });
    }
  }, [printedSchema]);

  useEffect(() => {
    if (codeDiv.current && typesDiv.current && schemaDiv.current) {
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

  useEffect(() => {
    if (schemaEditorRef.current) {
      schemaEditorRef.current.setValue(printedSchema);
    }
  }, [printedSchema]);

  useEffect(() => {
    const { schema, metadata, error } = getCurrentSchema(content);
    if (error) {
      setSchemaError(error);
    } else if (schema && metadata) {
      setActiveSchema({ schema, metadata });
      setSchemaError(null);
    }
  }, [content]);

  useEffect(() => {
    if (codeEditorRef.current) {
      codeEditorRef.current.layout();
    }
    if (typesEditorRef.current) {
      typesEditorRef.current.layout();
    }
  }, [schemaError, activeEditor]);

  useEffect(() => {
    if (activeSchema && graphiqlRef.current) {
      graphiqlRef.current.handleRunQuery();
    }
  }, [activeSchema, graphiqlRef.current]);

  useEffect(() => {
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
  }, [generatedTypes]);

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
              fetcher={(params: any) => {
                return graphql(activeSchema.schema, params.query);
              }}
              storage={window.sessionStorage}
              onToggleDocs={(open) => {
                if (open) {
                  setTimeout(() => {
                    if (graphiqlRef.current) {
                      graphiqlRef.current.setState({ docExplorerOpen: false });
                    }
                  }, 0);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

type SchemaOrError =
  | { schema: GraphQLSchema; metadata: core.TypegenMetadata; error: null }
  | { schema: null; metadata: null; error: Error };

function getCurrentSchema(code: string): SchemaOrError {
  const cache: any[] = [];
  function add(val: any) {
    cache.push(val);
    return val;
  }
  const singleton = {
    core,
    objectType(obj: any) {
      return add(objectType(obj));
    },
    interfaceType(obj: any) {
      return add(interfaceType(obj));
    },
    inputObjectType(obj: any) {
      return add(inputObjectType(obj));
    },
    enumType(obj: any) {
      return add(enumType(obj));
    },
    unionType(obj: any) {
      return add(unionType(obj));
    },
    scalarType(obj: any) {
      return add(scalarType(obj));
    },
  };
  try {
    const fn = new Function(
      "core",
      "objectType",
      "interfaceType",
      "inputObjectType",
      "enumType",
      "unionType",
      "scalarType",
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
      singleton.core,
      singleton.objectType,
      singleton.interfaceType,
      singleton.inputObjectType,
      singleton.enumType,
      singleton.unionType,
      singleton.scalarType,
      arg,
      intArg,
      stringArg,
      floatArg,
      idArg,
      booleanArg
    );
    const config = {
      types: cache,
      outputs: false as false,
      typegenAutoConfig: {
        contextType: "{}",
        sources: [],
        backingTypeMap: {
          Date: "Date",
        },
      },
    };
    const { schema, finalConfig } = core.makeSchemaInternal(config);
    const sortedSchema = lexicographicSortSchema(schema);
    return {
      schema: sortedSchema,
      metadata: new core.TypegenMetadata(
        core.resolveTypegenConfig(finalConfig)
      ),
      error: null,
    };
  } catch (error) {
    return { schema: null, metadata: null, error };
  }
}

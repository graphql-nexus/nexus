import { convertSDL } from "@nexus/schema";
import json5 from "json5";
import debounce from "lodash.debounce";
import * as monaco from "monaco-editor";
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { EXAMPLE_SDL } from "../../tests/_sdl";
import { fetchSchema } from "./fetchSchema";
import "./monaco-graphql";

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

export function Converter() {
  const [url, setUrl] = useState("");
  const [content, setContent] = useState(
    [`# Paste your SDL here:`].concat(EXAMPLE_SDL).join("\n")
  );
  useEffect(() => {
    !!url &&
      fetchSchema(url).then((content: string) => {
        sdlEditorRef.current && sdlEditorRef.current.setValue(content);
        setContent(content);
      });
  }, [url]);
  const debounceInputChange = debounce((value) => {
    setUrl(value);
  }, 500);
  const [sdlDiv, outputDiv] = [
    useRef<null | HTMLDivElement>(null),
    useRef<null | HTMLDivElement>(null),
  ];
  const [sdlEditorRef, outputEditorRef] = [monacoRef(), monacoRef()];
  useEffect(() => {
    if (sdlDiv.current && outputDiv.current) {
      const sdlEditor = monaco.editor.create(sdlDiv.current, {
        language: "graphql",
        model: monaco.editor.createModel(
          content,
          "graphql",
          monaco.Uri.file("sdl.graphql")
        ),
        ...COMMON_CONFIG,
      });
      const outputEditor = monaco.editor.create(outputDiv.current, {
        language: "typescript",
        ...COMMON_READONLY_CONFIG,
      });
      sdlEditorRef.current = sdlEditor;
      outputEditorRef.current = outputEditor;
      const debouncedChange = debounce(() => {
        setContent(sdlEditor.getValue());
      }, 100);
      sdlEditor.onDidChangeModelContent(debouncedChange as any);
      return () => sdlEditor.dispose();
    }
  }, []);
  useEffect(() => {
    const converted = convertSDL(content, null, json5 as JSON);
    if (outputEditorRef.current) {
      outputEditorRef.current.setValue(converted);
    }
  }, [content]);
  return (
    <React.Fragment>
      <input
        className="urlInput"
        type="text"
        placeholder="Paste your endpoint here:"
        style={{
          height: 50,
          marginTop: 50,
          fontSize: "medium",
          textAlign: "center",
        }}
        onChange={(e) => debounceInputChange(e.target.value)}
      />
      <div className="editors-container">
        <div className="editors">
          <div
            style={{
              flexBasis: "50%",
              height: "100%",
              flexDirection: "column",
            }}
          >
            <div ref={sdlDiv} style={{ height: "100%" }} />
          </div>
          <div
            style={{
              flexBasis: "50%",
              height: "100%",
              flexDirection: "column",
            }}
          >
            <div ref={outputDiv} style={{ height: "100%" }} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

ReactDOM.render(<Converter />, document.getElementById("root"));

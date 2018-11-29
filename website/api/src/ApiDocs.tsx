import React from "react";
import marked from "marked";
import prism from "prismjs";
import data from "./allTypes-transit.json";
import {
  transit,
  ParsedFiles,
  BaseRecords,
  isFuncRecord,
  TypeVal,
  isInterfaceRecord,
  isClassRecord,
  ClassMethodRecord,
  ParamRecord,
  DocRecord,
} from "./typedefs";
import { List } from "immutable";

const { api, core, types } = transit.fromJSON(data) as ReturnType<
  typeof ParsedFiles
>;

marked.setOptions({
  xhtml: true,
});

const renderer = new marked.Renderer();

renderer.code = function(code) {
  const rendered = prism.highlight(
    code.replace(/^ \* /g, "").replace(/\n \* ?/g, "\n"),
    prism.languages.javascript
  );
  return `<code class="codeBlock">${rendered}</code>`;
};

function extractDoc(item: {
  doc: DocRecord | null;
}): { first: JSX.Element | null; rest: JSX.Element | null } {
  if (item.doc) {
    const [first, ...tail] = item.doc.comment.split("\n\n");
    const discussion = tail.join("\n\n").trim();
    const rest = discussion ? (
      <p
        dangerouslySetInnerHTML={{
          __html: marked(discussion, { renderer }),
        }}
      />
    ) : null;
    return {
      first: first ? (
        <p
          dangerouslySetInnerHTML={{
            __html: marked(first, { renderer }),
          }}
        />
      ) : null,
      rest,
    };
  }
  return { first: null, rest: null };
}

function extractTags(obj: { doc: DocRecord | null }) {
  return null;
}

export function ApiDocs() {
  const apiKeys = api.keySeq();
  const coreKeys = core.keySeq();
  const typeKeys = types.keySeq();
  const allKeys = new Set(apiKeys.concat(coreKeys).concat(typeKeys));
  const usedKeys = new Set();
  const isKnownKey = (key: string): boolean => {
    return api.has(key) || core.has(key) || types.has(key);
  };
  const makeClassMethod = (method: ClassMethodRecord) => {
    return (
      <>
        {method.name}({makeSignature(method.params)}){returnType(method)}
      </>
    );
  };
  const returnType = (obj: { type: TypeVal | null }) => {
    return obj.type ? <>: {makeType(obj.type)}</> : "";
  };
  const makeType = (
    type: TypeVal,
    asUnion = false
  ): JSX.Element | JSX.Element[] | string => {
    if (typeof type === "string") {
      if (type.indexOf("Types.") === 0) {
        type = type.replace("Types.", "");
      }
      if (
        type === "DirectiveName" ||
        type === "TypeName" ||
        type === "FieldName"
      ) {
        type = "string";
      }
      usedKeys.add(type);
      return isKnownKey(type) ? (
        <a className="codeLink" href={`#${type}`}>
          {type}
        </a>
      ) : (
        type
      );
    }
    if (isFuncRecord(type)) {
      const fn = (
        <>
          ({makeSignature(type.params)}) => {makeType(type.type || "unknown")}
        </>
      );
      return asUnion ? <>({fn})</> : fn;
    }
    if (List.isList(type)) {
      return interleave(
        type.toArray().map((item) => <>{makeType(item, true)}</>),
        " | "
      );
    }
    return "unknown";
  };
  const makeSignature = (params: List<ParamRecord>) => {
    let args: JSX.Element[] = [];
    args = params.toArray().map((param, i) => {
      const separator = param.optional ? "?:" : ":";
      return (
        <>
          {param.name}
          {separator} {makeType(param.type)}
          {i < params.size - 1 ? ", " : ""}
        </>
      );
    });
    return args;
  };
  const extractMethods = (def: BaseRecords) => {
    let args: JSX.Element[] = [];
    if (isClassRecord(def)) {
      args = def.members.toArray().map((member) => {
        const { first, rest } = extractDoc(member);
        return (
          <>
            <h4>
              <a className="anchor" id={`${def.name}-${member.name}`} />
              t.
              {member.name}
              ()
            </h4>
            {first}
            <code key={member.name} className="codeBlock memberSignature">
              {makeClassMethod(member)}
            </code>
            {rest}
          </>
        );
      });
    }
    return <>{args}</>;
  };
  return (
    <div>
      <h1>API Reference</h1>
      {api.toArray().map(([key, def]) => {
        const { first, rest } = extractDoc(def);
        return (
          <div>
            <a className="anchor" id={key} />
            <h3 key={key}>
              {key}
              ()
            </h3>
            {first}
            <code className="codeBlock memberSignature">
              {key}
              {isFuncRecord(def) ? (
                <>
                  ({makeSignature(def.params)}){returnType(def)}
                </>
              ) : null}
            </code>
            {rest}
            {extractTags(def)}
          </div>
        );
      })}
      <h2>Definition Objects:</h2>
      <p>
        Each of these objects represent the value passed to the{" "}
        <b>builder function</b>, the second argument of the main API:
      </p>
      <div
        dangerouslySetInnerHTML={{
          __html: marked(builderExample, { renderer }),
        }}
      />
      <hr />
      {core.toArray().map(([key, def]) => {
        const { first, rest } = extractDoc(def);
        return (
          <div style={{ paddingTop: 10 }}>
            <a className="anchor" id={key} />
            <h3 key={key}>{key}</h3>
            {first}
            {extractMethods(def)}
            {rest}
          </div>
        );
      })}
      <h2>Type Annotations</h2>
      {types
        .toArray()
        .filter(([key]) => usedKeys.has(key))
        .map(([key, def]) => {
          return (
            <div>
              <a className="anchor" id={key} />
              <h4 key={key}>{key}</h4>
            </div>
          );
        })}
    </div>
  );
}

const builderExample = `
\`\`\`
// "t" is the Definition Object in this code block
const User = objectType('User', (t: ObjectTypeDef) => {
  t.int('id', { description: 'Primary key of the user' });
});
\`\`\`
`;

const interleave = (
  elements: any[],
  toInterleave: JSX.Element | string
): any[] => {
  return elements.reduce((result: any[], elem, i) => {
    result.push(elem);
    if (i < elements.length - 1) {
      result.push(toInterleave);
    }
    return result;
  }, []);
};

export const ApiSidebar = () => {
  const apiKeys = api.keySeq();
  const coreKeys = core.keySeq();
  return (
    <nav className="onPageNav">
      <ul className="toc-headings">
        <li>
          <a href="#">Core API</a>
          <ul className="toc-headings">
            {apiKeys
              .map((key) => {
                if (/(.*)Arg/.test(key)) {
                  return null;
                }
                return (
                  <li key={key}>
                    <a href={`#${key}`}>{key === "arg" ? "arg / *Arg" : key}</a>
                  </li>
                );
              })
              .filter((f) => f)}
          </ul>
        </li>
        <li>
          <a href="#building-a-schema">Building a Schema</a>
        </li>
        <li>
          <a href="#nullability-default-values">
            Nullability &amp; Default Values
          </a>
        </li>
        <li>
          <a href="#resolving-property">Resolving: Property</a>
        </li>
        <li>
          <a href="#type-mixing">Type Mixing</a>
        </li>
        <li>
          <a href="#auto-generated-artifacts">Auto-Generated Artifacts</a>
        </li>
        <li>
          <a href="#type-level-defaultresolver">Type-Level defaultResolver</a>
        </li>
      </ul>
    </nav>
  );
};

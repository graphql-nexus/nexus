import React from "react";
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
  ParamProps,
  ParamRecord,
} from "./typedefs";
import { List } from "immutable";
const { api, core, types } = transit.fromJSON(data) as ReturnType<
  typeof ParsedFiles
>;

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
        {method.name}({makeSignature(method.params)}
        ): {method.type ? makeType(method.type) : ""}
      </>
    );
  };
  const makeType = (type: TypeVal): JSX.Element | string => {
    if (typeof type === "string") {
      if (type.indexOf("Types.") === 0) {
        type = type.replace("Types.", "");
      }
      if (type === "DirectiveName" || type === "TypeName") {
        type = "string";
      }
      usedKeys.add(type);
      return isKnownKey(type) ? <a href={`#${type}`}>{type}</a> : type;
    }
    if (isFuncRecord(type)) {
      return (
        <>
          ({makeSignature(type.params)}) => {makeType(type.type || "unknown")}
        </>
      );
    }
    return "unknown";
  };
  const makeSignature = (params: List<ParamRecord>) => {
    let args: JSX.Element[] = [];
    args = params.toArray().map((param, i) => {
      return (
        <>
          {param.name}: {makeType(param.type)}
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
        return (
          <>
            <h4>
              t.
              {member.name}
              ()
            </h4>
            <code key={member.name} className="codeBlock memberSignature">
              {makeClassMethod(member)}
            </code>
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
        return (
          <div>
            <h3 key={key} id={key}>
              {key}
              ()
            </h3>
            <code className="codeBlock memberSignature">
              {key}
              {isFuncRecord(def) ? <>({makeSignature(def.params)})</> : null}
            </code>
          </div>
        );
      })}
      <h2>Definition Objects:</h2>
      {core.toArray().map(([key, def]) => {
        return (
          <div>
            <h3 key={key} id={key}>
              {key}
            </h3>
            {extractMethods(def)}
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
              <h3 key={key} id={key}>
                {key}
              </h3>
            </div>
          );
        })}
    </div>
  );
}

import ts from "typescript";
import { List, OrderedMap } from "immutable";
import fs from "fs-extra";
import path from "path";
import {
  TagStruct,
  TypeVal,
  ClassMethodStruct,
  ParamStruct,
  ClassMethodRecord,
  ClassStruct,
  FuncStruct,
  DocStruct,
  ParamRecord,
  InterfaceStruct,
  PropertyRecord,
  PropertyStruct,
  TypeWithArgsStruct,
  transit,
  ParsedFiles,
} from "../src/typedefs";

const TYPES_TO_EXPAND = new Set([
  "Maybe",
  "Record",
  "Promise",
  "PromiseLike",
  "MaybePromise",
  "MaybeThunk",
]);

function hasJsDoc(node: any): node is { jsDoc: ts.JSDoc[] } {
  if ("jsDoc" in node && node.jsDoc.length > 0) {
    return true;
  }
  return false;
}

function extractTags(tags: ReadonlyArray<ts.JSDocTag> = []) {
  return tags.reduce((a, tag) => {
    return a.push(
      TagStruct({
        comment: tag.comment,
        name: tag.tagName.text,
      })
    );
  }, List());
}

function parseSourceFile(source: ts.SourceFile) {
  function setName(
    map: OrderedMap<string, any>,
    ident: ts.Identifier,
    val: any
  ) {
    const name = ident.getText(source);
    if (map.has(name)) {
      throw new Error(`Duplicate top level name ${name}`);
    }
    return map.set(ident.getText(source), val);
  }

  function typeWithArgs(text: string, arr: ts.NodeArray<ts.TypeNode>) {
    return TypeWithArgsStruct({
      name: text,
      args: arr.reduce((a, b) => a.push(extractType(b)), List()),
    });
  }

  function extractType(type: ts.TypeNode): TypeVal {
    if (ts.isUnionTypeNode(type)) {
      return type.types.reduce((a, b) => a.push(extractType(b)), List());
    }
    if (ts.isTypeReferenceNode(type)) {
      const typeNameText = type.typeName.getText(source);
      if (TYPES_TO_EXPAND.has(typeNameText) && type.typeArguments) {
        return typeWithArgs(typeNameText, type.typeArguments);
      }
      return type.typeName.getText(source);
    }
    if (ts.isFunctionTypeNode(type)) {
      return extractFn(type);
    }
    if (ts.isParenthesizedTypeNode(type)) {
      return extractType(type.type);
    }
    return type.getText(source);
  }
  function extractMethods(
    members: ts.NodeArray<ts.ClassElement | ts.TypeElement>
  ): List<ClassMethodRecord> {
    return members.reduce((a, b) => {
      if (ts.isMethodDeclaration(b)) {
        return a.push(
          ClassMethodStruct({
            name: b.name.getText(source),
            params: extractParams(b.parameters),
            type: b.type ? extractType(b.type) : "unknown",
            doc: extractDoc(b),
          })
        );
      }
      return a;
    }, List<ClassMethodRecord>());
  }
  function extractProperties(
    members: ts.NodeArray<ts.ClassElement | ts.TypeElement>
  ) {
    return members.reduce((a, b) => {
      if (ts.isPropertySignature(b)) {
        return a.push(
          PropertyStruct({
            name: b.name.getText(source),
            type: b.type ? extractType(b.type) : null,
            doc: extractDoc(b),
          })
        );
      }
      return a;
    }, List<PropertyRecord>());
  }
  function extractParams(params: ts.NodeArray<ts.ParameterDeclaration>) {
    return params.reduce((a, param) => {
      return a.push(
        ParamStruct({
          name: param.name.getText(source),
          type: param.type ? extractType(param.type) : "unknown",
          optional: Boolean(param.questionToken),
          doc: extractDoc(param),
        })
      );
    }, List<ParamRecord>());
  }
  function extractDoc(type: ts.Node) {
    if (hasJsDoc(type)) {
      if (type.jsDoc.length > 1) {
        throw new Error("Each item must have only one associated jsDoc block");
      }
      const doc = type.jsDoc[0];
      return DocStruct({
        comment: doc.comment,
        tags: extractTags(doc.tags),
      });
    }
    return null;
  }
  function extractFn(node: ts.FunctionDeclaration | ts.FunctionTypeNode) {
    return FuncStruct({
      name: node.name ? node.name.getText(source) : null,
      doc: extractDoc(node),
      params: extractParams(node.parameters),
      type: node.type ? extractType(node.type) : null,
    });
  }
  function extractClass(node: ts.ClassDeclaration) {
    return ClassStruct({
      name: node.name ? node.name.getText(source) : null,
      doc: extractDoc(node),
      members: extractMethods(node.members),
    });
  }
  function extractInterface(node: ts.InterfaceDeclaration) {
    return InterfaceStruct({
      name: node.name.getText(source),
      doc: extractDoc(node),
      members: extractProperties(node.members),
      inherits: node.heritageClauses
        ? extractHeritageClauses(node.heritageClauses)
        : List(),
    });
  }
  function extractHeritageClauses(nodeArr: ts.NodeArray<ts.HeritageClause>) {
    return nodeArr.reduce((a, node) => {
      return node.types.reduce((b, c) => {
        return b.concat(c.getText(source));
      }, a);
    }, List());
  }
  return source.statements.reduce((a, b) => {
    if (ts.isFunctionDeclaration(b) && b.name) {
      return setName(a, b.name, extractFn(b));
    }
    if (ts.isClassDeclaration(b) && b.name) {
      return setName(a, b.name, extractClass(b));
    }
    if (ts.isInterfaceDeclaration(b)) {
      return setName(a, b.name, extractInterface(b));
    }
    if (ts.isTypeAliasDeclaration(b)) {
    }
    return a;
  }, OrderedMap<string, any>());
}

export async function run() {
  const typesPath = path.join(__dirname, "../../../dist/types.d.ts");
  const definitionPath = path.join(__dirname, "../../../dist/definitions.d.ts");
  const corePath = path.join(__dirname, "../../../dist/core.d.ts");
  const typesSource = ts.createSourceFile(
    typesPath,
    await fs.readFile(typesPath, "utf-8"),
    ts.ScriptTarget.ES2017
  );
  const definitionSource = ts.createSourceFile(
    definitionPath,
    await fs.readFile(definitionPath, "utf-8"),
    ts.ScriptTarget.ES2017
  );
  const coreSource = ts.createSourceFile(
    definitionPath,
    await fs.readFile(corePath, "utf-8"),
    ts.ScriptTarget.ES2017
  );
  const parsed = ParsedFiles()
    .set("api", parseSourceFile(definitionSource))
    .set("types", parseSourceFile(typesSource))
    .set("core", parseSourceFile(coreSource));

  await fs.writeFile(
    path.join(__dirname, "../src/allTypes.json"),
    JSON.stringify(parsed, null, 2)
  );
  await fs.writeFile(
    path.join(__dirname, "../src/allTypes-transit.json"),
    JSON.stringify(transit.toJSON(parsed), null, 2)
  );
}

import {
  objectType,
  stringArg,
  enumType,
  unionType,
  interfaceType,
} from "gqliteral";
import ts from "typescript";
import fs from "fs-extra";

export const Node = interfaceType("Node", (t) => {
  t.int("pos");
  t.int("end");
  t.field("kind", "SyntaxKind");
  t.field("flags", "NodeFlags");
  // t.field('decorators', 'Decorator', {list: true, nullable: true})
  t.field("modifiers", "Token", { list: true, nullable: true });
  t.field("parent", "Node");
});

export const Token = objectType("Token", (t) => {
  t.implements("Node");
  t.field("kind", "SyntaxKind");
});

export const SourceFile = objectType("SourceFile", (t) => {
  t.field("statements", "Statement", {
    list: true,
    resolve(root, args) {
      return Array.from(root.statements).filter((stmt) =>
        knownDeclarations.has(ts.SyntaxKind[stmt.kind])
      );
    },
  });
});

export const SyntaxKind = enumType("SyntaxKind", convertTsEnum(ts.SyntaxKind));

export const NodeFlags = enumType("NodeFlags", {
  ...convertTsEnum(ts.NodeFlags),
  UNKNOWN: 4194816,
});

const knownDeclarations = new Set([
  "MissingDeclaration",
  "InterfaceDeclaration",
  "TypeAliasDeclaration",
  "EnumDeclaration",
  "ModuleDeclaration",
  "ImportDeclaration",
  "ClassDeclaration",
  "ImportEqualsDeclaration",
  "NamespaceExportDeclaration",
  "ExportDeclaration",
  "ExportAssignment",
]);

export const Statement = unionType("Statement", (t) => {
  t.members(...Array.from(knownDeclarations));
  t.resolveType((obj: any) => ts.SyntaxKind[obj.kind]);
});

export const ImportDeclaration = objectType("ImportDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const ClassDeclaration = objectType("ClassDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const MissingDeclaration = objectType("MissingDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const InterfaceDeclaration = objectType("InterfaceDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const TypeAliasDeclaration = objectType("TypeAliasDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const EnumDeclaration = objectType("EnumDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const ModuleDeclaration = objectType("ModuleDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const ImportEqualsDeclaration = objectType(
  "ImportEqualsDeclaration",
  (t) => {
    t.implements("Node");
    t.boolean("ok", { default: true });
  }
);

export const NamespaceExportDeclaration = objectType(
  "NamespaceExportDeclaration",
  (t) => {
    t.implements("Node");
    t.boolean("ok", { default: true });
  }
);

export const ExportDeclaration = objectType("ExportDeclaration", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const ExportAssignment = objectType("ExportAssignment", (t) => {
  t.implements("Node");
  t.boolean("ok", { default: true });
});

export const Query = objectType("Query", (t) => {
  t.field("parseFile", "SourceFile", {
    args: {
      file: stringArg({ required: true }),
    },
    async resolve(root, args) {
      const fileContents = await fs.readFile(args.file, "utf-8");
      const sourceFile = ts.createSourceFile(
        args.file,
        fileContents,
        ts.ScriptTarget.ES2017
      );
      return sourceFile;
    },
  });
});

function convertTsEnum(toConvert: any) {
  const converted: { [key: string]: number } = {};
  Object.keys(toConvert).forEach((key) => {
    if (/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(key)) {
      converted[key] = toConvert[key];
    }
  });
  return converted;
}

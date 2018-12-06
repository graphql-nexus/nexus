import { interfaceType, arg } from "graphql-nexus";
import { SyntaxKind, JSDoc } from "typescript";
import ts from "typescript";
import { allKnownNodes, syntaxKindFilter } from "./utils";

const syntaxKindArgs = {
  skip: arg("SyntaxKind", { list: true }),
  only: arg("SyntaxKind", { list: true }),
};

export const MaybeOptional = interfaceType("MaybeOptional", (t) => {
  t.field("questionToken", "Token", { nullable: true });
});

export const Node = interfaceType("Node", (t) => {
  t.int("pos");
  t.int("end");
  t.string("nameText", {
    nullable: true,
    resolve: (root) =>
      // @ts-ignore
      root.name ? root.name.escapedText : null,
  });
  t.field("name", "DeclarationName", { nullable: true });
  t.field("typeName", "DeclarationName", { nullable: true });
  t.field("kind", "SyntaxKind");
  t.int("kindCode", { property: "kind" });
  t.field("flags", "NodeFlags");
  // t.field('decorators', 'Decorator', {list: true, nullable: true})
  t.field("modifiers", "Token", {
    list: true,
    nullable: true,
    args: syntaxKindArgs,
    async resolve(root, args) {
      if (!root.modifiers) {
        return null;
      }
      return syntaxKindFilter(args, Array.from(root.modifiers));
    },
  });
  t.field("parent", "Node");
  t.string("rawText", {
    args: syntaxKindArgs,
    resolve(root, args, ctx) {
      const filtered = syntaxKindFilter(args, [root]);
      return filtered.length ? filtered[0].getText(ctx.source) : "";
    },
  });
  t.resolveType((node, ctx, info) => {
    if (KeywordKinds.has(node.kind)) {
      return "KeywordTypeNode";
    }
    if (allKnownNodes(info.schema).has(SyntaxKind[node.kind])) {
      return SyntaxKind[node.kind] as any;
    }
    return "UNKNOWN_NODE";
  });
});

export const JSDocInterface = interfaceType("HasJSDoc", (t) => {
  t.field("jsDoc", "JSDoc", {
    list: true,
    nullable: true,
    resolve(root) {
      if ("jsDoc" in root) {
        // https://github.com/Microsoft/TypeScript/issues/19856
        return ((root as unknown) as { jsDoc: JSDoc[] }).jsDoc;
      }
      return null;
    },
  });
  t.resolveType((node, ctx, info) => {
    if (allKnownNodes(info.schema).has(SyntaxKind[node.kind])) {
      return SyntaxKind[node.kind] as any;
    }
    return "UNKNOWN_NODE";
  });
});

const KeywordKinds = new Set([
  SyntaxKind.AnyKeyword,
  SyntaxKind.UnknownKeyword,
  SyntaxKind.NumberKeyword,
  SyntaxKind.BigIntKeyword,
  SyntaxKind.ObjectKeyword,
  SyntaxKind.BooleanKeyword,
  SyntaxKind.StringKeyword,
  SyntaxKind.SymbolKeyword,
  SyntaxKind.ThisKeyword,
  SyntaxKind.VoidKeyword,
  SyntaxKind.UndefinedKeyword,
  SyntaxKind.NullKeyword,
  SyntaxKind.NeverKeyword,
]);

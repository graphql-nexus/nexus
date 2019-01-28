import { interfaceType, arg } from "nexus";
import { SyntaxKind, JSDoc } from "typescript";
import ts from "typescript";
import { allKnownNodes, syntaxKindFilter } from "./utils";

const syntaxKindArgs = {
  skip: arg({ type: "SyntaxKind", list: true }),
  only: arg({ type: "SyntaxKind", list: true }),
};

export const MaybeOptional = interfaceType({
  name: "MaybeOptional",
  definition(t) {
    t.field("questionToken", { type: "Token", nullable: true });
  },
});

export const Node = interfaceType({
  name: "Node",
  definition(t) {
    t.int("pos");
    t.int("end");
    t.string("nameText", {
      nullable: true,
      resolve: (root) =>
        // @ts-ignore
        root.name ? root.name.escapedText : null,
    });
    t.field("name", { type: "DeclarationName", nullable: true });
    t.field("typeName", { type: "DeclarationName", nullable: true });
    t.field("kind", { type: "SyntaxKind" });
    t.int("kindCode", (o) => o.kind);
    t.field("flags", { type: "NodeFlags" });
    // t.field('decorators', 'Decorator', {list: true, nullable: true})
    t.list.field("modifiers", {
      type: "Token",
      nullable: true,
      args: syntaxKindArgs,
      async resolve(root, args) {
        if (!root.modifiers) {
          return null;
        }
        return syntaxKindFilter(args, Array.from(root.modifiers));
      },
    });
    t.field("parent", { type: "Node" });
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
  },
});

export const JSDocInterface = interfaceType({
  name: "HasJSDoc",
  definition(t) {
    t.list.field("jsDoc", {
      type: "JSDoc",
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
  },
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

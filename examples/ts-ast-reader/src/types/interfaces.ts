import { interfaceType, arg } from "gqliteral";
import { SyntaxKind } from "typescript";
import { GraphQLResolveInfo } from "graphql";
import { allKnownNodes } from "./utils";

export const Node = interfaceType("Node", (t) => {
  t.int("pos");
  t.int("end");
  t.field("kind", "SyntaxKind");
  t.int("kindCode", { property: "kind" });
  t.field("flags", "NodeFlags");
  // t.field('decorators', 'Decorator', {list: true, nullable: true})
  t.field("modifiers", "Token", { list: true, nullable: true });
  t.field("parent", "Node");
  t.string("rawText", {
    args: {
      skip: arg("SyntaxKind", { list: true }),
    },
    resolve(root, args, ctx) {
      if (args.skip && args.skip.length > 0) {
        if (args.skip.some((val) => val === root.kind)) {
          return "";
        }
      }
      return root.getText(ctx.source);
    },
  });

  t.resolveType((node: any, ctx: any, info: GraphQLResolveInfo) => {
    if (KeywordKinds.has(node.kind)) {
      return "KeywordTypeNode";
    }
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

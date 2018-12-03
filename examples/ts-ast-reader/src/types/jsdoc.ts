import { interfaceType, objectType, core } from "gqliteral";
import ts from "typescript";

export const JSDoc = objectType("JSDoc", (t) => {
  t.string("comment", { nullable: true });
  t.field("tags", "JSDocTag", { list: true, nullable: true });
});

export const JSDocTag = interfaceType("JSDocTag", (t) => {
  t.string("tagName", {
    nullable: true,
    resolve: (root) => `${root.tagName.escapedText}`,
  });
  t.string("comment", { nullable: true });
  t.resolveType((tag, ctx, info) => {
    if (info.schema.getType(ts.SyntaxKind[tag.kind])) {
      return ts.SyntaxKind[tag.kind] as any;
    }
    return "JSDocUnknownTag";
  });
});

const jsDocTag = (t: core.ObjectTypeDef<GraphQLiteralGen, any>) =>
  t.implements("JSDocTag");

export const JSDocUnknownTag = objectType("JSDocUnknownTag", jsDocTag);
export const JSDocAugmentsTag = objectType("JSDocAugmentsTag", jsDocTag);
export const JSDocClassTag = objectType("JSDocClassTag", jsDocTag);
export const JSDocEnumTag = objectType("JSDocEnumTag", jsDocTag);
export const JSDocThisTag = objectType("JSDocThisTag", jsDocTag);
export const JSDocTemplateTag = objectType("JSDocTemplateTag", jsDocTag);
export const JSDocReturnTag = objectType("JSDocReturnTag", jsDocTag);
export const JSDocTypeTag = objectType("JSDocTypeTag", jsDocTag);

import { GQLiteralObject, GQLiteralInputObject } from "../../../../src";

export const Comment = GQLiteralObject("Comment", t => {
  t.field("id", "ID");
});

export const CreateCommentInput = GQLiteralInputObject(
  "CreateCommentInput",
  t => {
    t.mix("Comment");
  }
);

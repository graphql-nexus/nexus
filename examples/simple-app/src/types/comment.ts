import { GQLitObject, GQLitInputObject } from "../../../../src";

export const Comment = GQLitObject("Comment", t => {
  t.field("id", "ID");
});

export const CreateCommentInput = GQLitInputObject("CreateCommentInput", t => {
  t.mix("Comment");
});

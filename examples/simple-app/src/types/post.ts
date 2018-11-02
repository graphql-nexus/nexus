import { GQLitObject } from '../../../../src';

export const Post = GQLitObject('Post', t => {
  t.implements('Node');
});

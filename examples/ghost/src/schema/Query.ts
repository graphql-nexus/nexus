import { idArg, nonNull, queryType } from 'nexus'
import { Post } from './Post'
import { User } from './User'

export const Query = queryType({
  nonNullDefaults: { input: true },
  definition(t) {
    t.field('me', {
      type: User,
      resolve() {
        return null
      },
    })
    t.field('postById', {
      type: nonNull(Post),
      args: { id: idArg() },
      authorize: (root, args, ctx) => ctx.auth.canViewPost(args.id),
      resolve(root, args, ctx) {
        return ctx.post.byId(args.id)
      },
    })
    t.field('userById', {
      type: nonNull(User),
      args: { id: idArg() },
      authorize: (root, args, ctx) => ctx.auth.canViewUser(args.id),
      resolve(root, args, ctx) {
        return ctx.user.byId(args.id)
      },
    })
  },
})

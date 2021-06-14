import { objectType } from 'nexus'

export const Post = objectType({
  name: 'Post',
  nonNullDefaults: {
    output: true,
  },
  definition(t) {
    t.string('uuid')
    t.string('title')
    t.string('slug')
    t.string('html', { resolve: (o) => o.html || '' })
  },
})

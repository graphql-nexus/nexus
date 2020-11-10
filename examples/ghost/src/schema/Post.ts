import { objectType } from '@nexus/schema'

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

import { nonNull, objectType } from 'nexus'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.field('id', { type: nonNull('String') })
    t.field('name', { type: nonNull('String') })
    t.field('slug', { type: nonNull('String') })
    t.string('ghostAuthAccessToken')
    t.string('ghostAuthId')
    t.field('email', { type: nonNull('String') })
    t.string('profileImage')
    t.string('coverImage')
    t.string('bio')
    t.string('website')
    t.string('location')
    t.string('facebook')
    t.string('twitter')
    t.string('accessibility')
    t.field('status', { type: nonNull('String') })
    t.string('locale')
    t.field('visibility', { type: nonNull('String') })
    t.string('metaTitle')
    t.string('metaDescription')
    t.string('tour')
    t.date('lastSeen')
    t.field('createdAt', { type: nonNull('Date') })
    t.field('createdBy', {
      type: nonNull(User),
      resolve: (root, args, ctx) => ctx.user.byId(root.createdBy),
    })
    t.date('updatedAt')
    t.string('updatedBy')
  },
})

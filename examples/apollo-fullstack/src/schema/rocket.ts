import { nullable, objectType } from '@nexus/schema'

export const Rocket = objectType({
  name: 'Rocket',
  definition(t) {
    t.id('id')
    t.string('name')
    t.string('type')
  },
})

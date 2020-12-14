import { nullable, objectType } from 'nexus'

export const Rocket = objectType({
  name: 'Rocket',
  definition(t) {
    t.id('id')
    t.string('name')
    t.string('type')
  },
})

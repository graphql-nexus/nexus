import { objectType } from 'nexus'

export const Droid = objectType({
  name: 'Droid',
  description: 'A mechanical creature in the Star Wars universe.',
  definition(t) {
    t.implements('Character')
    t.string('primaryFunction', {
      description: 'The primary function of the droid.',
      resolve: (o) => o.primary_function || 'N/A',
    })
  },
})

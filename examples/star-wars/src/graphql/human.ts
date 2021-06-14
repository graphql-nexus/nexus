import { objectType } from 'nexus'

export const Human = objectType({
  name: 'Human',
  description: 'A humanoid creature in the Star Wars universe.',
  definition(t) {
    t.implements('Character')
    t.string('homePlanet', {
      description: 'The home planet of the human, or null if unknown.',
      resolve: (o) => o.home_planet || null,
    })
  },
})

import { interfaceType, idArg } from '@nexus/schema'
import { getFriends } from '../data'

export const Character = interfaceType({
  name: 'Character',
  resolveType(character) {
    return character.type
  },
  definition: (t) => {
    t.string('id', { description: 'The id of the character' })
    t.string('name', { description: 'The name of the character' })
    t.list.field('friends', {
      type: 'Character',
      description: 'The friends of the character, or an empty list if they have none.',
      resolve: (character) => getFriends(character),
    })
    t.list.field('appearsIn', {
      type: 'Episode',
      description: 'Which movies they appear in.',
      resolve: (o) => o.appears_in,
      args: {
        id: idArg({ required: true }),
      },
    })
  },
})

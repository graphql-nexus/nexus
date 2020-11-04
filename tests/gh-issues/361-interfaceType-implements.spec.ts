import { GraphQLSchema } from 'graphql'
import { interfaceType, makeSchema, objectType } from '../../src'

describe('GH #361, interfaceType & implements', () => {
  test('should pass', () => {
    const Node = interfaceType({
      name: 'Node',
      resolveType() {
        return null
      },
      definition(t) {
        t.id('id', { description: 'Unique identifier for the resource' })
      },
    })

    const User = objectType({
      name: 'User',
      definition(t) {
        t.implements(Node)
        t.string('username')
        t.string('email')
      },
    })

    const schema = makeSchema({
      types: [User],
      outputs: false,
      features: {
        abstractTypes: {
          resolveType: true,
        },
      },
    })

    expect(schema).toBeInstanceOf(GraphQLSchema)
  })
})

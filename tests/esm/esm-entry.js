import { GraphQLSchema } from 'graphql'
import { makeSchema, queryType } from '../../dist'

const schema = makeSchema({
  types: [
    queryType({
      definition(t) {
        t.boolean('ok')
      },
    }),
  ],
})

if (!(schema instanceof GraphQLSchema)) {
  throw new Error('Not a schema')
}

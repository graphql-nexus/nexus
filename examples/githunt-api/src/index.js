// @ts-check
const { ApolloServer } = require('apollo-server')
const path = require('path')
const { makeSchema } = require('@nexus/schema')
const types = require('./schema')

const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, '../githunt-api-schema.graphql'),
    typegen: path.join(__dirname, './githunt-typegen.ts'),
  },
  prettierConfig: require.resolve('../../../package.json'),
})

const server = new ApolloServer({
  // @ts-ignore
  schema,
})

const port = process.env.PORT || 4000

server.listen({ port }, () => console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`))

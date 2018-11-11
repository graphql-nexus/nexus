// @ts-check
const { ApolloServer } = require("apollo-server");
const path = require("path");
const { GQLiteralSchema } = require("gqliteral");
const types = require("./schema");

const schema = GQLiteralSchema({
  types,
  definitionFilePath: path.join(__dirname, "../githunt-api-schema.graphql"),
  typeGeneration: {
    typesFilePath: path.join(__dirname, "../githuntTypes.ts"),
  },
});

const server = new ApolloServer({
  schema,
});

const port = 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);

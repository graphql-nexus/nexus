import { ApolloServer } from "apollo-server";

import { schema } from "./schema";

const server = new ApolloServer({
  schema,
});

const port = process.env.PORT || 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);

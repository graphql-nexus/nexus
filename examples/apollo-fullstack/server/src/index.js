const { GQLiteralSchema } = require("gqliteral");

const schema = GQLiteralSchema({
  types: require("./schema"),
  definitionFilePath: "../output.graphql",
});

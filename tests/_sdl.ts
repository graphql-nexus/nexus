export const EXAMPLE_SDL = `
scalar UUID

type Query {
  user: User!
  posts(filters: PostFilters!): [Post!]!
}

"""
This is a description of a Node
"""
interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  """
  This is a description of a name
  """
  name(
    """
    And a description of an arg
    """
    prefix: String
  ): String!
  email: String!
  phone: String
  posts(filters: PostFilters): [Post!]!
  outEnum: SomeEnum
}

enum SomeEnum {
  A
  B
}

enum OrderEnum {
  ASC
  DESC
}

input PostFilters {
  order: OrderEnum!
  search: String
}

type Post implements Node {
  id: ID!
  uuid: UUID!
  author: User!
  geo: [[Float!]!]!
  messyGeo: [[Float!]]
}

input CreatePostInput {
  name: String!
  author: ID!
  geo: [[Float]!]!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
  registerClick(uuid: UUID): Query!
}
`;

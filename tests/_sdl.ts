export const EXAMPLE_SDL = `
directive @TestFieldDirective on FIELD_DEFINITION

scalar UUID

type Query {
  user: User! @TestFieldDirective
  posts(filters: PostFilters!): [Post!]!
  unionField: ExampleUnion!
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
  B @deprecated(reason: "This is a deprecation reason for B")
}

enum OrderEnum {
  ASC
  DESC
}

input PostFilters {
  order: OrderEnum!
  search: String = "nexus"
}

"""
This is a description of a Post
"""
type Post implements Node {
  id: ID!
  uuid: UUID!
  author: User!
  geo: [[Float!]!]!
  messyGeo: [[Float!]]
}

union ExampleUnion = Post | User

input CreatePostInput {
  name: String!
  author: ID!
  geo: [[Float]!]!
}

type Mutation {
  someList(items: [String]!): [String]!
  createPost(input: CreatePostInput!): Post!
  registerClick(uuid: UUID): Query!
}
`

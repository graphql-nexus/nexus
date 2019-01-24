import { buildSchema } from "graphql";
import { Typegen } from "./typegen2";
import { Metadata } from "./metadata";

const EXAMPLE_SDL = `
scalar UUID

type Query {
  user: User!
  posts(filters: PostFilters!): [Post!]!
}

interface Node {
  id: ID!
}

type User implements Node {
  id: ID!
  name(prefix: String): String!
  email: String!
  phone: String
  posts(filters: PostFilters): [Post!]!
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

describe("typegen2", () => {
  let typegen: Typegen;
  beforeEach(() => {
    const schema = buildSchema(EXAMPLE_SDL);
    typegen = new Typegen(schema, new Metadata({ outputs: false }), {
      headers: [],
      backingTypeMap: {
        Post: "t.Post",
      },
      contextType: "c.ContextType",
      imports: [],
    });
  });

  it("builds the enum object type defs", () => {
    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"interface NexusGenEnums {
  OrderEnum: \\"ASC\\" | \\"DESC\\"
}"
`);
  });

  it("builds the input object type defs", () => {
    expect(typegen.printInputTypeMap()).toMatchInlineSnapshot(`
"interface NexusGenInputs {
  PostFilters: {
    order: NexusGenEnums['OrderEnum'] // OrderEnum!
    search?: string | null // String
  }
  CreatePostInput: {
    name: string // String!
    author: string // ID!
    geo: Array<Array<number | null>> // [[Float]!]!
  }
}"
`);
  });

  it("should build an argument type map", () => {
    expect(typegen.printArgTypeMap()).toMatchInlineSnapshot(`
"interface NexusArgMap {
  Query: {
    posts: {
      filters: NexusGenInputs['PostFilters'] // PostFilters!
    }
  }
  User: {
    name: {
      prefix?: string | null // String
    }
    posts: {
      filters?: NexusGenInputs['PostFilters'] | null // PostFilters
    }
  }
  Mutation: {
    createPost: {
      input: NexusGenInputs['CreatePostInput'] // CreatePostInput!
    }
    registerClick: {
      uuid?: NexusGenScalars['UUID'] | null // UUID
    }
  }
}"
`);
  });

  it("should print a return type map", () => {
    expect(typegen.printReturnTypeMap()).toMatchInlineSnapshot(`
"interface NexusGenReturns {
  Query: {
    user: User!
    posts: [Post!]!
  }
  User: {
    id: ID!
    name: String!
    email: String!
    phone: String
    posts: [Post!]!
  }
  Post: {
    id: ID!
    uuid: UUID!
    author: User!
    geo: [[Float!]!]!
    messyGeo: [[Float!]]
  }
  Mutation: {
    createPost: Post!
    registerClick: Query!
  }
  Node: {
    id: ID!
  }
}"
`);
  });
});

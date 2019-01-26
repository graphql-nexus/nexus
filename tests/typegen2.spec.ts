import { buildSchema, lexicographicSortSchema } from "graphql";
import path from "path";
import { Typegen } from "../src/typegen2";
import { Metadata } from "../src/metadata";

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

describe("typegen2", () => {
  let typegen: Typegen;
  let metadata: Metadata;
  beforeEach(async () => {
    const schema = lexicographicSortSchema(buildSchema(EXAMPLE_SDL));
    metadata = new Metadata({
      outputs: {
        typegen: path.join(__dirname, "test-gen.ts"),
        schema: path.join(__dirname, "test-gen.graphql"),
      },
      typegenAutoConfig: {
        backingTypeMap: {
          UUID: "string",
        },
        sources: [
          {
            alias: "t",
            module: path.join(__dirname, "_helpers.ts"),
          },
        ],
        contextType: "t.TestContext",
      },
    });
    const typegenInfo = await metadata.getTypegenInfo(schema);
    typegen = new Typegen(schema, metadata, typegenInfo);
    jest
      .spyOn(metadata, "hasResolver")
      .mockImplementation((typeName: string) => {
        if (typeName === "Query" || typeName === "Mutation") {
          return true;
        }
        return false;
      });
  });

  it("builds the enum object type defs", () => {
    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"interface NexusGenEnums {
  OrderEnum: \\"ASC\\" | \\"DESC\\"
  SomeEnum: \\"A\\" | \\"B\\"
}"
`);
  });

  it("builds the input object type defs", () => {
    expect(typegen.printInputTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenInputs {
  PostFilters: {
    order: NexusGenEnums['OrderEnum']; // OrderEnum!
    search?: string | null; // String
  }
  CreatePostInput: {
    author: string; // ID!
    geo: Array<Array<number | null>>; // [[Float]!]!
    name: string; // String!
  }
}"
`);
  });

  it("should build an argument type map", () => {
    expect(typegen.printArgTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenArgTypes {
  Mutation: {
    createPost: {
      input: NexusGenInputs['CreatePostInput']; // CreatePostInput!
    }
    registerClick: {
      uuid?: string | null; // UUID
    }
  }
  Query: {
    posts: {
      filters: NexusGenInputs['PostFilters']; // PostFilters!
    }
  }
  User: {
    name: {
      prefix?: string | null; // String
    }
    posts: {
      filters?: NexusGenInputs['PostFilters'] | null; // PostFilters
    }
  }
}"
`);
  });

  it("should print a root type map", () => {
    expect(typegen.printRootTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenRootTypes {
  Mutation: {};
  Node: {
    id: string; // ID!
  }
  Post: {
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: {
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
}"
`);
  });

  it("should not print roots for fields with resolvers", () => {
    // If we don't have a dedicated "root type", then we need to infer
    // what the return type should be based on the shape of the object
    // If the field has a resolver, we assume it's derived, otherwise
    // you'll need to supply a backing root type with more information.
    jest
      .spyOn(metadata, "hasResolver")
      .mockImplementation((typeName: string, fieldName: string) => {
        if (typeName === "Query" || typeName === "Mutation") {
          return true;
        }
        if (typeName === "User" && fieldName === "posts") {
          return true;
        }
        return false;
      });
    expect(typegen.printRootTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenRootTypes {
  Mutation: {};
  Node: {
    id: string; // ID!
  }
  Post: {
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: {
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
  }
}"
`);
  });

  it("should print a return type map", () => {
    expect(typegen.printReturnTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenReturnTypes {
  Mutation: {
    createPost: NexusGenRootTypes['Post']; // Post!
    registerClick: NexusGenRootTypes['Query']; // Query!
  }
  Node: {
    id: string; // ID!
  }
  Post: {
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
    user: NexusGenRootTypes['User']; // User!
  }
  User: {
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
}"
`);
  });

  it("should print the full output", () => {
    expect(typegen.print()).toMatchInlineSnapshot(`
"/**
* This file was automatically generated by Nexus 0.0.0-test
* Do not make changes to this file directly
*/

import { GraphQLResolveInfo } from \\"graphql\\";
import * as t from \\"./_helpers\\"
declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  PostFilters: {
    order: NexusGenEnums['OrderEnum']; // OrderEnum!
    search?: string | null; // String
  }
  CreatePostInput: {
    author: string; // ID!
    geo: Array<Array<number | null>>; // [[Float]!]!
    name: string; // String!
  }
}

interface NexusGenEnums {
  OrderEnum: \\"ASC\\" | \\"DESC\\"
  SomeEnum: \\"A\\" | \\"B\\"
}

export interface NexusGenRootTypes {
  Mutation: {};
  Node: {
    id: string; // ID!
  }
  Post: {
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: {
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
}

export interface NexusGenReturnTypes {
  Mutation: {
    createPost: NexusGenRootTypes['Post']; // Post!
    registerClick: NexusGenRootTypes['Query']; // Query!
  }
  Node: {
    id: string; // ID!
  }
  Post: {
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
    user: NexusGenRootTypes['User']; // User!
  }
  User: {
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    createPost: {
      input: NexusGenInputs['CreatePostInput']; // CreatePostInput!
    }
    registerClick: {
      uuid?: string | null; // UUID
    }
  }
  Query: {
    posts: {
      filters: NexusGenInputs['PostFilters']; // PostFilters!
    }
  }
  User: {
    name: {
      prefix?: string | null; // String
    }
    posts: {
      filters?: NexusGenInputs['PostFilters'] | null; // PostFilters
    }
  }
}

interface NexusGenAbstractResolveSourceTypes {
  Node: NexusGenRootTypes['Post'] | NexusGenRootTypes['User']
}

interface NexusGenAbstractResolveReturnTypes {
  Node: \\"Post\\" | \\"User\\"
}

export interface NexusGenTypes {
  context: t.TestContext;
  rootTypes: NexusGenRootTypes;
  argTypes: NexusGenArgTypes;
  returnTypes: NexusGenReturnTypes;
  objectNames: \\"Mutation\\" | \\"Post\\" | \\"Query\\" | \\"User\\";
  inputNames: \\"CreatePostInput\\" | \\"PostFilters\\";
  enumNames: \\"OrderEnum\\" | \\"SomeEnum\\";
  interfaceNames: \\"Node\\";
  scalarNames: \\"Boolean\\" | \\"Float\\" | \\"ID\\" | \\"Int\\" | \\"String\\" | \\"UUID\\";
  unionNames: never;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['enumNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractResolveRoot: NexusGenAbstractResolveSourceTypes;
  abstractResolveReturn: NexusGenAbstractResolveReturnTypes;
}

export type Gen = NexusGenTypes;

type MaybePromise<T> = PromiseLike<T> | T;
type SourceType<TypeName>
type RootType<TypeName> = TypeName extends keyof NexusGenRootTypes ? NexusGenRootTypes[TypeName] : never;
type ArgType<TypeName, FieldName> = TypeName extends keyof NexusGenArgTypes ? FieldName extends keyof NexusGenArgTypes[TypeName] ? NexusGenArgTypes[TypeName][FieldName] : {} : {};

export type NexusResolver<TypeName extends keyof NexusGenReturnTypes, FieldName extends keyof NexusGenReturnTypes[TypeName]> = (
  root: RootType<TypeName>, 
  args: ArgType<TypeName, FieldName>, 
  context: NexusGenTypes['context'], 
  info: GraphQLResolveInfo
) => MaybePromise<NexusGenReturnTypes[TypeName][FieldName]>

export type NexusAbstractTypeResolver<TypeName extends keyof NexusGenReturnTypes, FieldName extends keyof NexusGenReturnTypes[TypeName]> = (
  root: SourceType<TypeName>, 
  context: NexusGenTypes['context'], 
  info: GraphQLResolveInfo
) => MaybePromise<NexusGenReturnTypes[TypeName][FieldName]>
"
`);
  });
});

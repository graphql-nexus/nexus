import {
  buildSchema,
  lexicographicSortSchema,
  GraphQLField,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from "graphql";
import path from "path";
import { core } from "../src";
import { EXAMPLE_SDL } from "./_sdl";

const { Typegen, TypegenMetadata } = core;

describe("typegen", () => {
  let typegen: core.Typegen;
  let metadata: core.TypegenMetadata;
  beforeEach(async () => {
    const schema = lexicographicSortSchema(buildSchema(EXAMPLE_SDL));
    metadata = new TypegenMetadata({
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
            source: path.join(__dirname, "_helpers.ts"),
          },
        ],
        contextType: "t.TestContext",
      },
    });
    const typegenInfo = await metadata.getTypegenInfo(schema);
    typegen = new Typegen(schema, typegenInfo);
    jest
      .spyOn(typegen, "hasResolver")
      .mockImplementation(
        (
          field: GraphQLField<any, any>,
          type: GraphQLObjectType | GraphQLInterfaceType
        ) => {
          if (type.name === "Query" || type.name === "Mutation") {
            return true;
          }
          return false;
        }
      );
  });

  it("builds the enum object type defs", () => {
    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  OrderEnum: \\"ASC\\" | \\"DESC\\"
  SomeEnum: \\"A\\" | \\"B\\"
}"
`);
  });

  it("builds the input object type defs", () => {
    expect(typegen.printInputTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenInputs {
  CreatePostInput: { // input type
    author: string; // ID!
    geo: Array<Array<number | null>>; // [[Float]!]!
    name: string; // String!
  }
  PostFilters: { // input type
    order: NexusGenEnums['OrderEnum']; // OrderEnum!
    search?: string | null; // String
  }
}"
`);
  });

  it("should build an argument type map", () => {
    expect(typegen.printArgTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenArgTypes {
  Mutation: {
    createPost: { // args
      input: NexusGenInputs['CreatePostInput']; // CreatePostInput!
    }
    registerClick: { // args
      uuid?: string | null; // UUID
    }
  }
  Query: {
    posts: { // args
      filters: NexusGenInputs['PostFilters']; // PostFilters!
    }
  }
  User: {
    name: { // args
      prefix?: string | null; // String
    }
    posts: { // args
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
  Post: { // root type
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: { // root type
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
  Node: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  UUID: string;
  ExampleUnion: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
}"
`);
  });

  it("should not print roots for fields with resolvers", () => {
    // If we don't have a dedicated "root type", then we need to infer
    // what the return type should be based on the shape of the object
    // If the field has a resolver, we assume it's derived, otherwise
    // you'll need to supply a backing root type with more information.
    jest
      .spyOn(typegen, "hasResolver")
      .mockImplementation(
        (
          field: GraphQLField<any, any>,
          type: GraphQLObjectType | GraphQLInterfaceType
        ) => {
          if (type.name === "Query" || type.name === "Mutation") {
            return true;
          }
          if (type.name === "User" && field.name === "posts") {
            return true;
          }
          return false;
        }
      );
    expect(typegen.printRootTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenRootTypes {
  Mutation: {};
  Post: { // root type
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: { // root type
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
  }
  Node: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  UUID: string;
  ExampleUnion: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
}"
`);
  });

  it("should print a return type map", () => {
    expect(typegen.printReturnTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenFieldTypes {
  Mutation: { // field return type
    createPost: NexusGenRootTypes['Post']; // Post!
    registerClick: NexusGenRootTypes['Query']; // Query!
  }
  Post: { // field return type
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: { // field return type
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
    user: NexusGenRootTypes['User']; // User!
  }
  User: { // field return type
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
  Node: { // field return type
    id: string; // ID!
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

import * as t from \\"./_helpers\\"


declare global {
  interface NexusGen extends NexusGenTypes {}
}

export interface NexusGenInputs {
  CreatePostInput: { // input type
    author: string; // ID!
    geo: Array<Array<number | null>>; // [[Float]!]!
    name: string; // String!
  }
  PostFilters: { // input type
    order: NexusGenEnums['OrderEnum']; // OrderEnum!
    search?: string | null; // String
  }
}

export interface NexusGenEnums {
  OrderEnum: \\"ASC\\" | \\"DESC\\"
  SomeEnum: \\"A\\" | \\"B\\"
}

export interface NexusGenRootTypes {
  Mutation: {};
  Post: { // root type
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo?: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: {};
  User: { // root type
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum?: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone?: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
  Node: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
  String: string;
  Int: number;
  Float: number;
  Boolean: boolean;
  ID: string;
  UUID: string;
  ExampleUnion: NexusGenRootTypes['Post'] | NexusGenRootTypes['User'];
}

export interface NexusGenAllTypes extends NexusGenRootTypes {
  CreatePostInput: NexusGenInputs['CreatePostInput'];
  PostFilters: NexusGenInputs['PostFilters'];
  OrderEnum: NexusGenEnums['OrderEnum'];
  SomeEnum: NexusGenEnums['SomeEnum'];
}

export interface NexusGenFieldTypes {
  Mutation: { // field return type
    createPost: NexusGenRootTypes['Post']; // Post!
    registerClick: NexusGenRootTypes['Query']; // Query!
  }
  Post: { // field return type
    author: NexusGenRootTypes['User']; // User!
    geo: number[][]; // [[Float!]!]!
    id: string; // ID!
    messyGeo: Array<number[] | null> | null; // [[Float!]]
    uuid: string; // UUID!
  }
  Query: { // field return type
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
    user: NexusGenRootTypes['User']; // User!
  }
  User: { // field return type
    email: string; // String!
    id: string; // ID!
    name: string; // String!
    outEnum: NexusGenEnums['SomeEnum'] | null; // SomeEnum
    phone: string | null; // String
    posts: NexusGenRootTypes['Post'][]; // [Post!]!
  }
  Node: { // field return type
    id: string; // ID!
  }
}

export interface NexusGenArgTypes {
  Mutation: {
    createPost: { // args
      input: NexusGenInputs['CreatePostInput']; // CreatePostInput!
    }
    registerClick: { // args
      uuid?: string | null; // UUID
    }
  }
  Query: {
    posts: { // args
      filters: NexusGenInputs['PostFilters']; // PostFilters!
    }
  }
  User: {
    name: { // args
      prefix?: string | null; // String
    }
    posts: { // args
      filters?: NexusGenInputs['PostFilters'] | null; // PostFilters
    }
  }
}

export interface NexusGenAbstractResolveReturnTypes {
  ExampleUnion: \\"Post\\" | \\"User\\"
  Node: \\"Post\\" | \\"User\\"
}

export interface NexusGenInheritedFields {}

export type NexusGenObjectNames = \\"Mutation\\" | \\"Post\\" | \\"Query\\" | \\"User\\";

export type NexusGenInputNames = \\"CreatePostInput\\" | \\"PostFilters\\";

export type NexusGenEnumNames = \\"OrderEnum\\" | \\"SomeEnum\\";

export type NexusGenInterfaceNames = \\"Node\\";

export type NexusGenScalarNames = \\"Boolean\\" | \\"Float\\" | \\"ID\\" | \\"Int\\" | \\"String\\" | \\"UUID\\";

export type NexusGenUnionNames = \\"ExampleUnion\\";

export interface NexusGenTypes {
  context: t.TestContext;
  inputTypes: NexusGenInputs;
  rootTypes: NexusGenRootTypes;
  argTypes: NexusGenArgTypes;
  fieldTypes: NexusGenFieldTypes;
  allTypes: NexusGenAllTypes;
  inheritedFields: NexusGenInheritedFields;
  objectNames: NexusGenObjectNames;
  inputNames: NexusGenInputNames;
  enumNames: NexusGenEnumNames;
  interfaceNames: NexusGenInterfaceNames;
  scalarNames: NexusGenScalarNames;
  unionNames: NexusGenUnionNames;
  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];
  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['scalarNames'];
  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']
  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];
  abstractResolveReturn: NexusGenAbstractResolveReturnTypes;
}"
`);
  });
});

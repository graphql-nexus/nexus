import {
  printType,
  execute,
  parse,
  GraphQLFieldResolver,
  GraphQLError,
} from "graphql";
import { connectionFromArray } from "graphql-relay";
import { connectionPlugin, makeSchema, objectType, arg } from "../../src";
import {
  ConnectionPluginConfig,
  ConnectionFieldConfig,
} from "../../src/plugins/connectionPlugin";

const userNodes: { id: string; name: string }[] = [];
for (let i = 0; i < 10; i++) {
  userNodes.push({ id: `User:${i + 1}`, name: `Test ${i + 1}` });
}

const User = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.string("name");
  },
});

const UsersFieldBody = `
  nodes { id }
  edges { 
    cursor
    node { id } 
  }
  pageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`;

const UsersFieldLast = parse(
  `query UsersFieldLast($last: Int!) { users(last: $last) { ${UsersFieldBody} } }`
);
const UsersFieldLastBefore = parse(
  `query UsersFieldLastBefore($last: Int!, $before: String!) { users(last: $last, before: $before) { ${UsersFieldBody} } }`
);
const UsersFieldFirst = parse(
  `query UsersFieldFirst($first: Int!) { users(first: $first) { ${UsersFieldBody} } }`
);
const UsersFieldFirstAfter = parse(
  `query UsersFieldFirstAfter($first: Int!, $after: String!) { users(first: $first, after: $after) { ${UsersFieldBody} } }`
);

const customResolveFn: GraphQLFieldResolver<any, any> = (
  root: any,
  args: any
) => {
  return connectionFromArray(userNodes, args);
};

const testConnectionSchema = (
  pluginConfig: ConnectionPluginConfig,
  connectionFieldProps: Omit<ConnectionFieldConfig<any, any>, "type"> = {}
) =>
  makeSchema({
    outputs: false,
    types: [
      User,
      objectType({
        name: "Query",
        definition(t) {
          // @ts-ignore
          t.connectionField("users", {
            type: "User",
            nodes(root: any, args: any, ctx: any, info: any) {
              return userNodes;
            },
            ...connectionFieldProps,
          });
        },
      }),
    ],
    plugins: [connectionPlugin(pluginConfig)],
    nonNullDefaults: {
      input: false,
      output: false,
    },
  });

describe("connectionPlugin", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("basic behavior", () => {
    it("should adhere to the Relay spec", () => {
      const schema = testConnectionSchema({});
      expect(printType(schema.getType("UserConnection")!)).toMatchSnapshot();
      expect(printType(schema.getType("UserEdge")!)).toMatchSnapshot();
      expect(printType(schema.getType("PageInfo")!)).toMatchSnapshot();
    });

    it("should provide forward pagination defaults", async () => {
      const schema = testConnectionSchema({});
      const nodes = await execute({
        schema,
        document: UsersFieldFirst,
        variableValues: { first: 1 },
      });
      expect(nodes.data?.users.edges).toEqual([
        { cursor: "Y3Vyc29yOjA=", node: { id: "User:1" } },
      ]);
      expect(
        Buffer.from(nodes.data?.users.edges[0].cursor, "base64").toString(
          "utf8"
        )
      ).toEqual("cursor:0");
    });

    it("should provide backward pagination defaults", async () => {
      const schema = testConnectionSchema({});
      const lastNodes = await execute({
        schema,
        document: UsersFieldLast,
        variableValues: { last: 1 },
      });
      expect(lastNodes.data?.users.edges).toEqual([
        { cursor: "Y3Vyc29yOjA=", node: { id: "User:10" } },
      ]);
    });

    it("should resolve pageInfo with basics", async () => {
      const schema = testConnectionSchema({});
      const lastNodes = await execute({
        schema,
        document: UsersFieldFirst,
        variableValues: { first: 10 },
      });
      expect(lastNodes.data?.users.pageInfo).toEqual({
        endCursor: "Y3Vyc29yOjk=",
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: "Y3Vyc29yOjA=",
      });
    });

    it("should resolve nodes & edges at the same time", async () => {
      const schema = testConnectionSchema({
        includeNodesField: true,
      });
      const lastNodes = await execute({
        schema,
        document: UsersFieldLast,
      });
      expect(lastNodes.data?.users.nodes).toEqual(
        lastNodes.data?.users.edges.map((e: any) => e.node)
      );
    });

    it("should be possible to define a custom resolve, rather than just the nodes needed", async () => {
      const schema = testConnectionSchema(
        {
          includeNodesField: true,
        },
        {
          nodes: undefined,
          resolve: customResolveFn,
        }
      );
      const lastNodes = await execute({
        schema,
        document: UsersFieldFirst,
        variableValues: { first: 2 },
      });
      expect(lastNodes).toMatchSnapshot();
    });

    it("default arg validation: throws if no connection are provided", async () => {
      const schema = testConnectionSchema({});
      const result = await execute({
        schema,
        document: parse(`{ users { edges { cursor } } }`),
        variableValues: {},
      });
      expect(result).toEqual({
        data: { users: null },
        errors: [
          new GraphQLError(
            'The Query.users connection field requires a "first" or "last" argument'
          ),
        ],
      });
    });

    it("default arg validation: throws if both first & last are provided", async () => {
      const schema = testConnectionSchema({});
      const result = await execute({
        schema,
        document: parse(`{ users(first: 2, last: 1) { edges { cursor } } }`),
        variableValues: {},
      });
      expect(result).toEqual({
        data: { users: null },
        errors: [
          new GraphQLError(
            'The Query.users connection field requires a "first" or "last" argument, not both'
          ),
        ],
      });
    });

    it("default arg validation: throws if first & before are mixed", async () => {
      const schema = testConnectionSchema({});
      const result = await execute({
        schema,
        document: parse(
          `{ users(first: 1, before: "FAKE") { edges { cursor } } }`
        ),
        variableValues: {},
      });
      expect(result).toEqual({
        data: { users: null },
        errors: [
          new GraphQLError(
            'The Query.users connection field does not allow a "before" argument with "first"'
          ),
        ],
      });
    });

    it("default arg validation: throws if last & after are mixed", async () => {
      const schema = testConnectionSchema({});
      const result = await execute({
        schema,
        document: parse(
          `{ users(last: 2, after: "FAKE") { edges { cursor } } }`
        ),
        variableValues: {},
      });
      expect(result).toEqual({
        data: { users: null },
        errors: [
          new GraphQLError(
            'The Query.users connection field does not allow a "last" argument with "after"'
          ),
        ],
      });
    });

    it("returns empty arrays, but warns if the nodes returns null", async () => {
      const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
      const schema = testConnectionSchema(
        {
          includeNodesField: true,
        },
        {
          nodes() {
            return null as any;
          },
        }
      );
      const lastNodes = await execute({
        schema,
        document: UsersFieldFirst,
        variableValues: { first: 2 },
      });
      expect(lastNodes.data?.users).toEqual({
        edges: [],
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      });
      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenLastCalledWith(
        'You resolved null/undefined from nodes() at path ["users"], this is likely an error. Return an empty array to suppress this warning.'
      );
    });
  });

  describe("global plugin configuration", () => {
    it("allows disabling forward pagination", () => {
      const schema = testConnectionSchema({
        disableForwardPagination: true,
      });
      expect(printType(schema.getQueryType()!)).toMatchSnapshot();
    });

    it("allows disabling backward pagination", () => {
      const schema = testConnectionSchema({
        disableBackwardPagination: true,
      });
      expect(printType(schema.getQueryType()!)).toMatchSnapshot();
    });

    it("can configure additional fields for the connection globally", () => {
      const schema = testConnectionSchema(
        {
          extendConnection: {
            totalCount: {
              type: "Int",
            },
          },
        },
        {
          // @ts-ignore
          totalCount: () => 1,
        }
      );
      expect(printType(schema.getType("UserConnection")!)).toMatchSnapshot();
    });

    it("errors if the extendConnection resolver is not specified", () => {
      const spy = jest.spyOn(console, "error").mockImplementation();
      testConnectionSchema({
        extendConnection: {
          totalCount: {
            type: "Int",
          },
        },
      });
      expect(spy.mock.calls[0]).toMatchSnapshot();
      expect(spy).toBeCalledTimes(1);
    });

    it("can configure additional fields for the edge globally", () => {
      const schema = testConnectionSchema(
        {
          extendEdge: {
            createdAt: {
              type: "String",
            },
          },
        },
        {
          // @ts-ignore
          edgeFields: {
            createdAt: () => "FakeDate",
          },
        }
      );
      expect(printType(schema.getType("UserEdge")!)).toMatchSnapshot();
    });

    it('can include a "nodes" field, with an array of nodes', () => {
      const schema = testConnectionSchema({
        includeNodesField: true,
      });
      expect(schema.getType("UserConnection")!).toMatchSnapshot();
    });

    it("can define additional args for all connections", () => {
      const schema = testConnectionSchema({
        additionalArgs: {
          order: arg({
            type: "String",
            required: true,
            description: "This should be included",
          }),
        },
      });
      expect(printType(schema.getQueryType()!)).toMatchSnapshot();
    });
  });

  describe("field level configuration", () => {
    it("can configure the connection per-instance", () => {
      const schema = testConnectionSchema(
        {},
        {
          extendConnection(t) {
            t.int("totalCount", () => 1);
          },
        }
      );
      expect(
        printType(schema.getType("QueryUsers_Connection")!)
      ).toMatchSnapshot();
      expect(schema.getType("QueryUsers_Edge")).toBeUndefined();
    });

    it("can configure the edge per-instance", () => {
      const schema = testConnectionSchema(
        {},
        {
          extendEdge(t) {
            t.string("role", () => "admin");
          },
        }
      );
      expect(
        printType(schema.getType("QueryUsers_Connection")!)
      ).toMatchSnapshot();
      expect(printType(schema.getType("QueryUsers_Edge")!)).toMatchSnapshot();
    });

    it("can modify the behavior of cursorFromNode ", () => {});

    it("can define additional args for the connection", () => {
      const schema = testConnectionSchema(
        {
          additionalArgs: {
            order: arg({
              type: "String",
              required: true,
              description: "This should be ignored",
            }),
          },
        },
        {
          additionalArgs: {
            filter: arg({
              type: "String",
              description: "This should be included",
            }),
          },
        }
      );
      expect(printType(schema.getQueryType()!)).toMatchSnapshot();
    });

    it("can inherit the additional args from the main config", () => {
      const schema = testConnectionSchema(
        {
          additionalArgs: {
            order: arg({
              type: "String",
              required: true,
              description: "This should be included",
            }),
          },
        },
        {
          inheritAdditionalArgs: true,
          additionalArgs: {
            filter: arg({
              type: "String",
              description: "This should also be included",
            }),
          },
        }
      );
      expect(printType(schema.getQueryType()!)).toMatchSnapshot();
    });
  });
});

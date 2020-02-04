import path from "path";
import {
  objectType,
  makeSchema,
  queryField,
  fieldAuthorizePlugin,
} from "../../src";
import { graphql } from "graphql";
import { generateSchema, subscriptionField } from "../../src/core";

describe("fieldAuthorizePlugin", () => {
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  const consoleWarnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation(() => {});

  afterEach(() => {
    jest.resetAllMocks();
  });

  const schemaTypes = [
    objectType({
      name: "User",
      definition(t) {
        t.int("id");
      },
    }),
    queryField("userTrue", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => ctx.user.id === 1,
      resolve: () => ({ id: 1 }),
    }),
    queryField("userTruePromise", {
      type: "User",
      // @ts-ignore
      authorize: async (root, args, ctx) => ctx.user.id === 1,
      resolve: () => ({ id: 1 }),
    }),
    queryField("userFalse", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => ctx.user.id === 2,
      resolve: () => ({ id: 2 }),
    }),
    queryField("userFalsePromise", {
      type: "User",
      // @ts-ignore
      authorize: async (root, args, ctx) => ctx.user.id === 2,
      resolve: () => ({ id: 2 }),
    }),
    queryField("userReturnError", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => new Error("You shall not pass."),
      resolve: () => ({ id: 1 }),
    }),
    queryField("userReturnPromiseError", {
      type: "User",
      // @ts-ignore
      authorize: async (root, args, ctx) => new Error("You shall not pass."),
      resolve: () => ({ id: 1 }),
    }),
    queryField("userThrowError", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => {
        throw new Error("You shall not pass.");
      },
      resolve: () => ({ id: 1 }),
    }),
    queryField("userInvalidValue", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => 1,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeTrue", {
      type: "User",
      //@ts-ignore
      authorize: (root, args, ctx) => ctx.user.id === 1,
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeTruePromise", {
      type: "User",
      //@ts-ignore
      authorize: async (root, args, ctx) => ctx.user.id === 1,
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeFalse", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => ctx.user.id === 2,
      subscribe: () => true,
      resolve: () => ({ id: 2 }),
    }),
    subscriptionField("userSubscribeFalsePromise", {
      type: "User",
      // @ts-ignore
      authorize: async (root, args, ctx) => ctx.user.id === 2,
      subscribe: () => true,
      resolve: () => ({ id: 2 }),
    }),
    subscriptionField("userSubscribeReturnError", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => new Error("You shall not pass."),
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeReturnPromiseError", {
      type: "User",
      // @ts-ignore
      authorize: async (root, args, ctx) => new Error("You shall not pass."),
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeThrowError", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => {
        throw new Error("You shall not pass.");
      },
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
    subscriptionField("userSubscribeInvalidValue", {
      type: "User",
      // @ts-ignore
      authorize: (root, args, ctx) => 1,
      subscribe: () => true,
      resolve: () => ({ id: 1 }),
    }),
  ];

  const testSchema = makeSchema({
    outputs: false,
    types: schemaTypes,
    plugins: [
      fieldAuthorizePlugin({
        formatError({ error, root, args, ctx, info }) {
          console.error(`Guarded error ${error.message}`);
          return new Error("Authorization Error");
        },
      }),
    ],
  });
  const mockCtx = { user: { id: 1 } };
  const testField = (field: string, passes = false, schema = testSchema) => {
    return graphql(
      schema,
      `
        {
          ${field} {
            id
          }
        }
      `,
      {},
      mockCtx
    );
  };

  test("field-level authorize passes returning true", async () => {
    const { data, errors = [] } = await testField("userTrue", true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(data?.userTrue).toEqual({ id: 1 });
  });

  test("field-level authorize passes returning a Promise for true", async () => {
    const { data, errors = [] } = await testField("userTruePromise", true);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(data?.userTruePromise).toEqual({ id: 1 });
  });

  test("field-level authorize fails returning false", async () => {
    const { data, errors = [] } = await testField("userFalse");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("field-level authorize fails returning a Promise for false", async () => {
    const { data, errors = [] } = await testField("userFalsePromise");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("field-level authorize fails returning an error", async () => {
    const { data, errors = [] } = await testField("userReturnError");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("field-level authorize fails returning a Promise for an error", async () => {
    const { data, errors = [] } = await testField("userFalsePromise");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("field-level authorize fails throwing an error", async () => {
    const { data, errors = [] } = await testField("userThrowError");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("field-level authorize fails with any other value", async () => {
    const { data, errors = [] } = await testField("userInvalidValue");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  const testSubscription = (field: string) => {
    return graphql(
      testSchema,
      `
        subscription {
          ${field} {
            id
          }
        }
      `,
      {},
      mockCtx
    );
  };

  test("subscribe field-level authorize passes returning true", async () => {
    const { data, errors = [] } = await testSubscription("userSubscribeTrue");
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(data?.userSubscribeTrue).toEqual({ id: 1 });
  });

  test("subscribe field-level authorize passes returning a Promise for true", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeTruePromise"
    );
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(data?.userSubscribeTruePromise).toEqual({ id: 1 });
  });

  test("subscribe field-level authorize fails returning false", async () => {
    const { data, errors = [] } = await testSubscription("userSubscribeFalse");
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("subscribe field-level authorize fails returning a Promise for false", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeFalsePromise"
    );
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("subscribe field-level authorize fails returning an error", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeReturnError"
    );
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("subscribe field-level authorize fails returning a Promise for an error", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeFalsePromise"
    );
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("subscribe field-level authorize fails throwing an error", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeThrowError"
    );
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("subscribe field-level authorize fails with any other value", async () => {
    const { data, errors = [] } = await testSubscription(
      "userSubscribeInvalidValue"
    );
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Authorization Error");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("default format error does not call console.error", async () => {
    const schema = makeSchema({
      outputs: false,
      types: schemaTypes,
      plugins: [fieldAuthorizePlugin()],
    });
    const { data, errors = [] } = await testField("userFalse", false, schema);
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Not authorized");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
  });

  test("always throws an error, even when formatError is wrong", async () => {
    const schema = makeSchema({
      outputs: false,
      types: schemaTypes,
      plugins: [
        // @ts-ignore
        fieldAuthorizePlugin({
          // @ts-ignore
          formatError() {},
        }),
      ],
    });
    const { data, errors = [] } = await testField("userFalse", false, schema);
    expect(data).toBeNull();
    expect(errors.length).toEqual(1);
    expect(errors[0].message).toEqual("Not authorized");
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("warns when a field has a non-function authorize prop", async () => {
    const schema = makeSchema({
      outputs: false,
      types: [
        schemaTypes,
        queryField("incorrectFieldConfig", {
          type: "User",
          // @ts-ignore
          authorize: 1,
          resolve: () => ({ id: 1 }),
        }),
      ],
      plugins: [fieldAuthorizePlugin({})],
    });
    const { data, errors = [] } = await testField(
      "incorrectFieldConfig",
      true,
      schema
    );
    expect(errors).toEqual([]);
    expect(data?.incorrectFieldConfig).toEqual({ id: 1 });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("warns and adds the authorize plugin when a schema has an authorize prop but no plugins", async () => {
    const schema = makeSchema({
      outputs: false,
      types: [
        schemaTypes,
        queryField("shouldWarn", {
          type: "User",
          // @ts-ignore
          authorize: () => true,
          resolve: () => ({ id: 1 }),
        }),
      ],
    });
    const { data, errors = [] } = await testField("shouldWarn", true, schema);
    expect(errors).toEqual([]);
    expect(data?.shouldWarn).toEqual({ id: 1 });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy.mock.calls[0]).toMatchSnapshot();
  });

  test("printing the authorize schema", async () => {
    const result = await generateSchema.withArtifacts(
      {
        types: [
          queryField("ok", {
            type: "Boolean",
            resolve: () => true,
          }),
        ],
        plugins: [fieldAuthorizePlugin()],
      },
      path.join(__dirname, "test.gen.ts")
    );
    expect(result.tsTypes).toMatchSnapshot("Full Type Output");
  });
});

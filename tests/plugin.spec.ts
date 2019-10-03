import { forEach, isCollection } from "iterall";
import { makeMiddlewareResolver, MiddlewareFn } from "../src/plugin";
import { isPromiseLike } from "../src/core";

let mockErrLog: jest.Mock;
let mockErrGuard: jest.Mock;

async function authorized(ctx: any) {
  return ctx.id === 1;
}

const authorizationPlugin = function*(root, args, ctx, info, next) {
  const isAuthed = yield authorized(ctx);
  if (isAuthed) {
    return next(root, args, ctx, info);
  }
  throw new Error("Not authed.");
};

const nullabilityGuard: MiddlewareFn = function*(root, args, ctx, info, next) {
  const val = yield next(root, args, ctx, info);
  if (val != null) {
    return val;
  }
  return 1;
};

const errorLogger: MiddlewareFn = async (root, args, ctx, info, next) => {
  try {
    const result = await next(root, args, ctx, info);
    if (result instanceof Error) {
      throw result;
    }
    return result;
  } catch (e) {
    mockErrLog(e);
    throw e;
  }
};
/**
 * Filters any errors from a result-set
 */
const errorFilter: MiddlewareFn = function*(root, args, ctx, info, next) {
  const result = yield next(root, args, ctx, info);
  if (!isCollection(result)) {
    return result;
  }
  let containsPromise = false;
  const completed = [];
  forEach(result as any, (item, index) => {
    if (item instanceof Error) {
      mockErrGuard(item);
      return;
    }
    if (isPromiseLike(item)) {
      containsPromise = true;
    }
    completed.push(item);
  });
  return containsPromise ? Promise.all(completed) : completed;
};

describe("plugin makeMiddlewareResolver", () => {
  beforeEach(() => {
    mockErrLog = jest.fn();
    mockErrGuard = jest.fn();
  });

  it("accepts several middleware generators and a resolve fn", async () => {
    const fn = makeMiddlewareResolver(
      [errorLogger, nullabilityGuard, errorFilter],
      () => {
        return [1, 2, new Error(), 3];
      }
    );
    expect(await fn({}, {}, {}, {} as any)).toEqual([1, 2, 3]);
    expect(mockErrGuard).toBeCalledTimes(1);
  });

  it("accepts several middleware generators and an async resolve fn", async () => {
    const fn = makeMiddlewareResolver(
      [nullabilityGuard, errorFilter, errorLogger],
      async () => {
        return Promise.resolve([1, 2, new Error(), 3]);
      }
    );
    expect(await fn({}, {}, {}, {} as any)).toEqual([1, 2, 3]);
    expect(mockErrGuard).toBeCalledTimes(1);
  });
});

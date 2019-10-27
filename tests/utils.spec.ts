import { deepAssign } from "../src/utils";
describe("deepAssign", () => {
  it.each([
    // source object merges into target object
    [[{}, {}], {}],
    [[{ a: 1 }, {}], { a: 1 }],
    [[{}, { a: 1 }], { a: 1 }],
    // source object keys override target object keys
    [[{ a: 2 }, { a: 1 }], { a: 1 }],
    [[{ a: 1 }, { b: 2 }], { a: 1, b: 2 }],
    [[{ a: { b: 2 } }, { a: 1 }], { a: 1 }],
    [[{ a: 1 }, { a: {} }], { a: {} }],
    // object collisions merge
    [[{ a: {} }, {}], { a: {} }],
    [[{ a: { b: 2 } }, {}], { a: { b: 2 } }],
    [[{ a: { b: 2 } }, { a: {} }], { a: { b: 2 } }],
    [[{ a: { b: 2 } }, { a: { c: 3 } }], { a: { b: 2, c: 3 } }],
    // nested source object keys override nested target object keys
    [[{ a: { b: 2 } }, { a: { b: 1 } }], { a: { b: 1 } }],
    // no special handling for lists
    [[{ a: [1] }, { a: 1 }], { a: 1 }],
    [[{ a: [1] }, { a: [] }], { a: [] }],
    // no special handling for complex objects
    [[{ a: [1] }, { a: 1 }], { a: 1 }],
    [[{ a: (a: any, b: any) => {} }, { a: { b: 2 } }], { a: { b: 2 } }],
  ])("%s %s", (given: [any, any], expected: any) => {
    expect(deepAssign(...given)).toEqual(expected);
  });
});

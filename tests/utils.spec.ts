import { venn } from "../src/utils";

describe("utils", () => {
  test("venn lhs", () => {
    expect(venn([1], [])).toEqual([new Set([1]), new Set([]), new Set([])]);
  });
  test("venn rhs", () => {
    expect(venn([], [1])).toEqual([new Set([]), new Set([]), new Set([1])]);
  });
  test("venn both", () => {
    expect(venn([1], [1])).toEqual([new Set([]), new Set([1]), new Set([])]);
  });
});

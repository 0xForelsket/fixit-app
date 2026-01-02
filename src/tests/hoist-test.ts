
import { describe, expect, it, mock } from "bun:test";
import { add } from "./math";

const vi = {
    mock: (path: string, factory: any) => mock.module(path, factory)
};

// Mock after import, but wrapped
vi.mock("./math", () => ({
  add: () => "mocked",
}));

describe("hoisting", () => {
  it("should be mocked", () => {
    // If hoisting fails, this might be real implementation or fail
    expect(add(1, 2)).toBe("mocked" as any);
  });
});

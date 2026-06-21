import { expect, test } from "bun:test"
import { clamp } from "./clamp"

test("clamp keeps values inside range", () => {
  expect(clamp(5, 0, 10)).toBe(5)
  expect(clamp(-2, 0, 10)).toBe(0)
  expect(clamp(12, 0, 10)).toBe(10)
})

test("clamp handles inverted bounds defensively", () => {
  expect(clamp(5, 10, 0)).toBe(5)
  expect(clamp(-2, 10, 0)).toBe(0)
  expect(clamp(12, 10, 0)).toBe(10)
})

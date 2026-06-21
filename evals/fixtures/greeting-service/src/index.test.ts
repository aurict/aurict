import { expect, test } from "bun:test"
import { welcomeUser } from "./index"

test("welcomeUser uses the formal salutation", () => {
  expect(welcomeUser("Ada")).toBe("Welcome, Ada.")
})

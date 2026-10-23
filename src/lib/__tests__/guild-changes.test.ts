import { describe, expect, it } from "vitest"
import { guildChangeColor } from "../guild-changes"

describe("guildChangeColor", () => {
  it.each([
    [0, "green"], [1, "green"], [3, "green"],
    [4, "yellow"], [6, "yellow"],
    [7, "red"], [12, "red"],
  ] as const)("%i changes → %s", (n, color) => {
    expect(guildChangeColor(n)).toBe(color)
  })
})

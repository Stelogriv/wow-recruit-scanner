/** Guild changes in the past year → traffic light. 1-3 green, 4-6 yellow, 7+ red. 0 counts as green. */
export type ChangeColor = "green" | "yellow" | "red"

export function guildChangeColor(changes: number): ChangeColor {
  if (changes >= 7) return "red"
  if (changes >= 4) return "yellow"
  return "green"
}

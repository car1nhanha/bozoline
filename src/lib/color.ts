export function hashHue(value: string): number {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) % 360
  }

  return hash
}

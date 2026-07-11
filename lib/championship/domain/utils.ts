const collator = new Intl.Collator("pt-BR", { sensitivity: "base" })

export function compareAlphabeticallyPtBr(
  a: string,
  b: string,
): number {
  return collator.compare(a, b)
}

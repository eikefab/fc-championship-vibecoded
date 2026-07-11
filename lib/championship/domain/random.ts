import { randomInt } from "node:crypto"

export interface RandomSource {
  nextInt(maxExclusive: number): number
}

export class CryptoRandomSource implements RandomSource {
  nextInt(maxExclusive: number): number {
    return randomInt(maxExclusive)
  }
}

export function createRandomSource(): RandomSource {
  return new CryptoRandomSource()
}

export function fisherYatesShuffle<T>(
  list: readonly T[],
  source: RandomSource,
): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = source.nextInt(i + 1)
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

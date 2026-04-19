export class RandomService {
  private seed: number;

  constructor(seed = 123456789) {
    this.seed = normalizeSeed(seed);
  }

  next(): number {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    if (maxInclusive < minInclusive) {
      throw new Error("maxInclusive must be greater than or equal to minInclusive");
    }

    const range = maxInclusive - minInclusive + 1;
    return Math.floor(this.next() * range) + minInclusive;
  }

  getSeed(): number {
    return this.seed;
  }
}

function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? 1 : normalized;
}

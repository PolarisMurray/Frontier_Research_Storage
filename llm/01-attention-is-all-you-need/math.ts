/** The formulas from the paper. No training, just the math. */

export function dot(a: number[], b: number[]): number {
  return a.reduce((sum, value, i) => sum + value * b[i], 0);
}

export function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const total = exps.reduce((sum, value) => sum + value, 0);
  return exps.map((value) => value / total);
}

/**
 * The weights in Attention(Q, K, V) = softmax(QKᵀ / √d_k) V.
 * `masked` applies the decoder rule from section 3.2.3: later positions get -∞ before the softmax.
 */
export function attentionWeights(Q: number[][], K: number[][], masked = false): number[][] {
  const scale = Math.sqrt(K[0].length);
  return Q.map((q, i) =>
    softmax(K.map((k, j) => (masked && j > i ? -Infinity : dot(q, k) / scale))),
  );
}

/** PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)). */
export function positionalEncoding(pos: number, d: number): number[] {
  return Array.from({ length: d }, (_, dim) => {
    const i = Math.floor(dim / 2);
    const angle = pos / 10000 ** ((2 * i) / d);
    return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}

/** Deterministic random numbers, so a demo looks the same on every load. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal sample (Box-Muller). */
export function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

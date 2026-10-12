/** Types for scripts/half-precision.mjs, which the unit tests and self-host-voices.mjs use. */
export function toHalfPrecision(model: Uint8Array): { model: Buffer; weights: number };

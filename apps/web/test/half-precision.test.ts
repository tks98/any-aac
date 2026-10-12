import { describe, expect, it } from 'vitest';
import { toHalfPrecision } from '../scripts/half-precision.mjs';
import catalog from '../src/lib/voice/voices.json';

// Just enough protobuf to write a small ONNX model (onnx.proto field numbers).
const varint = (n: number): number[] => {
  const out: number[] = [];
  for (; n >= 0x80; n = Math.floor(n / 128)) out.push((n % 128) | 0x80);
  return [...out, n];
};
const int = (field: number, value: number) => [...varint(field * 8), ...varint(value)];
const bytes = (field: number, data: ArrayLike<number>) => [
  ...varint(field * 8 + 2),
  ...varint(data.length),
  ...Array.from(data),
];
const str = (field: number, text: string) => bytes(field, new TextEncoder().encode(text));

const tensor = (name: string, dims: number[], values: Float32Array) => [
  ...dims.flatMap((d) => int(1, d)),
  ...int(2, 1), // FLOAT
  ...str(8, name),
  ...bytes(9, new Uint8Array(values.buffer)),
];
const ints = (name: string, values: number[]) => [
  ...str(1, name),
  ...values.flatMap((v) => int(8, v)),
  ...int(20, 7), // INTS
];
const node = (op: string, inputs: string[], output: string, attributes: number[][] = []) => [
  ...inputs.flatMap((i) => str(1, i)),
  ...str(2, output),
  ...str(4, op),
  ...attributes.flatMap((a) => bytes(5, a)),
];
const valueInfo = (name: string, shape: number[]) => [
  ...str(1, name),
  ...bytes(
    2,
    bytes(1, [
      ...int(1, 1),
      ...bytes(
        2,
        shape.flatMap((d) => bytes(1, int(1, d))),
      ),
    ]),
  ),
];

/** Repeatable values in [-0.1, 0.1]. */
const weights = (count: number, seed: number) =>
  Float32Array.from({ length: count }, (_, i) => Math.sin(seed * 1000 + i * 12.9898) * 0.1);

/**
 * Conv (1280 weights) → ConvTranspose (1024, the smallest converted) →
 * Conv (64, too small to convert), like the layers of a Piper voice.
 */
function model(big = weights(16 * 16 * 5, 1)) {
  const graph = [
    ...bytes(1, node('Conv', ['x', 'big', 'bias'], 'a', [ints('pads', [2, 2])])),
    ...bytes(1, node('ConvTranspose', ['a', 'up'], 'b', [ints('strides', [2])])),
    ...bytes(1, node('Conv', ['b', 'small'], 'y')),
    ...str(2, 'test'),
    ...bytes(5, tensor('big', [16, 16, 5], big)),
    ...bytes(5, tensor('bias', [16], weights(16, 2))),
    ...bytes(5, tensor('up', [16, 16, 4], weights(16 * 16 * 4, 3))),
    ...bytes(5, tensor('small', [4, 16, 1], weights(4 * 16, 4))),
    ...bytes(11, valueInfo('x', [1, 16, 32])),
    ...bytes(12, valueInfo('y', [1, 4, 66])),
  ];
  return Uint8Array.from([
    ...int(1, 8), // IR version
    ...bytes(8, int(2, 13)), // opset 13
    ...bytes(7, graph),
  ]);
}

async function run(onnx: Uint8Array) {
  const ort = await import('onnxruntime-web/wasm');
  ort.env.wasm.numThreads = 1;
  const session = await ort.InferenceSession.create(onnx, { executionProviders: ['wasm'] });
  const x = new ort.Tensor(
    'float32',
    weights(16 * 32, 5).map((v) => v * 10),
    [1, 16, 32],
  );
  const { y } = await session.run({ x });
  return y!.data as Float32Array;
}

describe('half-precision voices', () => {
  it('stores Conv and ConvTranspose weights in fp16, and the model gives the same result', async () => {
    const original = model();
    const { model: half, weights: converted } = toHalfPrecision(original);
    expect(converted).toBe(2);
    // 2304 weights at 2 bytes instead of 4, less the two Casts.
    expect(half.length).toBeLessThan(original.length - 4000);

    const [expected, actual] = await Promise.all([run(original), run(new Uint8Array(half))]);
    expect(actual.length).toBe(expected.length);
    const peak = Math.max(...expected.map(Math.abs));
    const error = Math.max(...expected.map((v, i) => Math.abs(v - actual[i]!)));
    expect(error / peak).toBeLessThan(5e-3);
  });

  it('gives the same file every time, and leaves a converted model as it is', () => {
    const once = toHalfPrecision(model()).model;
    expect(toHalfPrecision(model()).model.equals(once)).toBe(true);
    const twice = toHalfPrecision(once);
    expect(twice.weights).toBe(0);
    expect(twice.model.equals(once)).toBe(true);
  });

  it("keeps a weight in fp32 when fp16 can't hold it", () => {
    const big = weights(16 * 16 * 5, 1);
    big[7] = 1e6;
    expect(toHalfPrecision(model(big)).weights).toBe(1);
  });

  it('has a pinned half-precision copy of every voice, about half the size', () => {
    for (const voice of catalog.voices) {
      expect(voice.fp16.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(voice.fp16.size).toBeLessThan(voice.model.size * 0.7);
    }
  });
});

#!/usr/bin/env node
/**
 * Stores a Piper voice's convolution weights in half precision (fp16), which
 * halves its download (a medium voice goes from 63.5 MB to 32.5 MB) with no
 * difference you can hear (docs/research/decisions/0013-half-precision-voices.md).
 * A Cast turns each weight back into fp32 when the voice loads, so it still
 * computes in fp32 as before; only how the weights are stored changes.
 *
 * It edits the ONNX file's protobuf directly, so it needs only Node (24 or
 * later, for Float16Array). The output depends only on the input, so
 * voices.json pins its size and hash ("fp16"; update them if this script
 * changes what it writes). scripts/self-host-voices.mjs runs it for each
 * voice; on its own:
 *
 *   node scripts/half-precision.mjs voice.onnx voice.fp16.onnx
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Weights smaller than this (in values) stay as they are: they barely add to the size. */
const MIN_VALUES = 1024;

// ONNX's protobuf field numbers and enums (onnx.proto).
const MODEL_GRAPH = 7;
const GRAPH_NODE = 1;
const GRAPH_INITIALIZER = 5;
const GRAPH_INPUT = 11;
const NODE_INPUT = 1;
const NODE_OUTPUT = 2;
const NODE_NAME = 3;
const NODE_OP_TYPE = 4;
const NODE_ATTRIBUTE = 5;
const ATTRIBUTE_NAME = 1;
const ATTRIBUTE_I = 3;
const ATTRIBUTE_TYPE = 20;
const ATTRIBUTE_INT = 2;
const TENSOR_DIMS = 1;
const TENSOR_DATA_TYPE = 2;
const TENSOR_SEGMENT = 3;
const TENSOR_FLOAT_DATA = 4;
const TENSOR_NAME = 8;
const TENSOR_RAW_DATA = 9;
const TENSOR_EXTERNAL_DATA = 13;
const VALUE_INFO_NAME = 1;
const FLOAT = 1;
const FLOAT16 = 10;

/** Reads a varint: [value, offset after it]. */
function readVarint(bytes, offset) {
  let value = 0;
  let scale = 1;
  let byte;
  do {
    byte = bytes[offset++];
    if (byte === undefined) throw new Error('Not an ONNX model: the file ends mid-field.');
    value += (byte & 0x7f) * scale;
    scale *= 128;
  } while (byte & 0x80);
  return [value, offset];
}

/** A protobuf message's fields, in order, each with its encoded bytes. */
function fields(bytes) {
  const out = [];
  let offset = 0;
  while (offset < bytes.length) {
    const start = offset;
    let key;
    [key, offset] = readVarint(bytes, offset);
    const number = Math.floor(key / 8);
    const type = key % 8;
    let value;
    if (type === 0) {
      [value, offset] = readVarint(bytes, offset);
    } else if (type === 1 || type === 5) {
      const size = type === 1 ? 8 : 4;
      value = bytes.subarray(offset, offset + size);
      offset += size;
    } else if (type === 2) {
      let length;
      [length, offset] = readVarint(bytes, offset);
      value = bytes.subarray(offset, offset + length);
      offset += length;
    } else {
      throw new Error(`Not an ONNX model: unexpected protobuf wire type ${type}.`);
    }
    if (offset > bytes.length) throw new Error('Not an ONNX model: the file ends mid-field.');
    out.push({ number, type, value, raw: bytes.subarray(start, offset) });
  }
  return out;
}

function varint(value) {
  const out = [];
  while (value >= 0x80) {
    out.push((value % 128) | 0x80);
    value = Math.floor(value / 128);
  }
  out.push(value);
  return Buffer.from(out);
}

const varintField = (number, value) => Buffer.concat([varint(number * 8), varint(value)]);
const bytesField = (number, bytes) =>
  Buffer.concat([varint(number * 8 + 2), varint(bytes.length), bytes]);
const stringField = (number, text) => bytesField(number, Buffer.from(text, 'utf8'));
const text = (bytes) => Buffer.from(bytes).toString('utf8');
const strings = (message, number) =>
  fields(message)
    .filter((f) => f.number === number)
    .map((f) => text(f.value));

/** An initializer's name, shape, type and fp32 values (null when stored another way). */
function readTensor(bytes) {
  const tensor = { name: '', dims: [], dataType: 0, values: null, plain: true };
  const floats = [];
  for (const f of fields(bytes)) {
    if (f.number === TENSOR_NAME) tensor.name = text(f.value);
    else if (f.number === TENSOR_DATA_TYPE) tensor.dataType = f.value;
    else if (f.number === TENSOR_DIMS && f.type === 0) tensor.dims.push(f.value);
    else if (f.number === TENSOR_DIMS) {
      for (let offset = 0, dim; offset < f.value.length;) {
        [dim, offset] = readVarint(f.value, offset);
        tensor.dims.push(dim);
      }
    } else if (f.number === TENSOR_RAW_DATA) tensor.values = f.value;
    else if (f.number === TENSOR_FLOAT_DATA) floats.push(f.value);
    else if (f.number === TENSOR_SEGMENT || f.number === TENSOR_EXTERNAL_DATA) tensor.plain = false;
  }
  // float_data, packed or not, is the same little-endian fp32 as raw_data.
  if (floats.length) tensor.values = Buffer.concat(floats);
  if (tensor.values) {
    const copy = new Uint8Array(tensor.values); // aligned for Float32Array
    tensor.values = new Float32Array(copy.buffer, 0, copy.length / 4);
  }
  return tensor;
}

function tensorBytes({ name, dims, dataType, raw }) {
  return Buffer.concat([
    ...dims.map((dim) => varintField(TENSOR_DIMS, dim)),
    varintField(TENSOR_DATA_TYPE, dataType),
    stringField(TENSOR_NAME, name),
    bytesField(TENSOR_RAW_DATA, raw),
  ]);
}

/** A Cast from the stored fp16 weight to the fp32 one the model uses. */
function castBytes(from, to) {
  const toFloat = Buffer.concat([
    stringField(ATTRIBUTE_NAME, 'to'),
    varintField(ATTRIBUTE_I, FLOAT),
    varintField(ATTRIBUTE_TYPE, ATTRIBUTE_INT),
  ]);
  return Buffer.concat([
    stringField(NODE_INPUT, from),
    stringField(NODE_OUTPUT, to),
    stringField(NODE_NAME, `${from}_cast`),
    stringField(NODE_OP_TYPE, 'Cast'),
    bytesField(NODE_ATTRIBUTE, toFloat),
  ]);
}

if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1)
  throw new Error('half-precision.mjs expects a little-endian machine.');

/**
 * The model with its Conv and ConvTranspose weights stored in fp16. Weights
 * that are small, outside fp16's range, or stored unusually are left as they
 * are, and so is a model that's already converted.
 */
export function toHalfPrecision(model) {
  if (typeof Float16Array === 'undefined')
    throw new Error('Converting voices needs Node 24 or later (for Float16Array).');
  const top = fields(model);
  const graphField = top.find((f) => f.number === MODEL_GRAPH && f.type === 2);
  if (!graphField) throw new Error('Not an ONNX model: no graph.');
  const graph = fields(graphField.value);

  const weights = new Set();
  const graphInputs = new Set();
  const names = new Set();
  for (const f of graph) {
    if (f.number === GRAPH_NODE) {
      const op = strings(f.value, NODE_OP_TYPE)[0];
      const inputs = strings(f.value, NODE_INPUT);
      if ((op === 'Conv' || op === 'ConvTranspose') && inputs[1]) weights.add(inputs[1]);
      for (const name of strings(f.value, NODE_OUTPUT)) names.add(name);
    } else if (f.number === GRAPH_INPUT) {
      for (const name of strings(f.value, VALUE_INFO_NAME)) graphInputs.add(name);
    } else if (f.number === GRAPH_INITIALIZER) {
      for (const name of strings(f.value, TENSOR_NAME)) names.add(name);
    }
  }
  for (const name of graphInputs) names.add(name);

  const casts = [];
  const parts = graph.map((f) => {
    if (f.number !== GRAPH_INITIALIZER) return f.raw;
    const tensor = readTensor(f.value);
    // A weight that's also a graph input can be replaced when the model runs: leave it.
    if (!weights.has(tensor.name) || graphInputs.has(tensor.name)) return f.raw;
    if (tensor.dataType !== FLOAT || !tensor.plain || !tensor.values) return f.raw;
    const values = tensor.values;
    if (values.length < MIN_VALUES) return f.raw;
    if (values.length !== tensor.dims.reduce((a, b) => a * b, 1)) return f.raw;
    const halves = new Float16Array(values);
    // fp16 stops at ±65504; a weight beyond that would become infinite.
    if (halves.some((half, i) => !Number.isFinite(half) && Number.isFinite(values[i])))
      return f.raw;
    let stored = `${tensor.name}_fp16`;
    for (let n = 2; names.has(stored); n++) stored = `${tensor.name}_fp16_${n}`;
    names.add(stored);
    casts.push(bytesField(GRAPH_NODE, castBytes(stored, tensor.name)));
    return bytesField(
      GRAPH_INITIALIZER,
      tensorBytes({
        name: stored,
        dims: tensor.dims,
        dataType: FLOAT16,
        raw: Buffer.from(halves.buffer),
      }),
    );
  });
  // Nodes are listed in the order they run, so the Casts go first.
  const firstNode = parts.findIndex((_, i) => graph[i].number === GRAPH_NODE);
  parts.splice(firstNode === -1 ? parts.length : firstNode, 0, ...casts);

  const converted = Buffer.concat(
    top.map((f) => (f === graphField ? bytesField(MODEL_GRAPH, Buffer.concat(parts)) : f.raw)),
  );
  return { model: converted, weights: casts.length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [source, target] = process.argv.slice(2);
  if (!source || !target) {
    console.error('Usage: node scripts/half-precision.mjs <voice.onnx> <output.onnx>');
    process.exit(1);
  }
  const input = readFileSync(source);
  const { model, weights } = toHalfPrecision(input);
  writeFileSync(target, model);
  console.log(
    `${weights} weights in fp16: ${(input.length / 1e6).toFixed(1)} MB → ${(model.length / 1e6).toFixed(1)} MB.`,
  );
}

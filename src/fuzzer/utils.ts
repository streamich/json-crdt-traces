import * as fs from 'fs';
import * as path from 'path';
import {Patch} from 'json-joy/es2020/json-crdt-patch';
import {CborDecoder} from 'json-joy/es2020/json-pack/cbor/CborDecoder';
import {rootFolder} from '../root';

export const traces = [
  <const>'trace-1',
  <const>'trace-2',
  <const>'trace-3',
  <const>'long',
  <const>'short',
  <const>'low-concurrency',
  <const>'high-concurrency',
  <const>'str-only',
  <const>'bin-only',
];

export type FuzzerTraceName = typeof traces[number];

export const filename = (name: FuzzerTraceName) =>
  path.resolve(rootFolder, 'traces', 'fuzzer', 'collected', `${name}.cbor`);

export const toBatch = (name: FuzzerTraceName): Patch[] => {
  const traceFileName = filename(name);
  const buf = fs.readFileSync(traceFileName);
  const decoder = new CborDecoder();
  const blobs = decoder.decode(buf) as Uint8Array[];
  return blobs.map((blob) => Patch.fromBinary(blob));
};

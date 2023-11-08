import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import type {SequentialTrace, SequentialTraceName} from './types';
import {rootFolder} from '../root';

const loadTrace = (filename: SequentialTraceName) => {
  const buf = fs.readFileSync(filename);
  const text = zlib.gunzipSync(buf).toString();
  const json = JSON.parse(text);
  return json;
};

const cache = {} as Record<SequentialTraceName, SequentialTrace>;

export const sequentialTraceNames: SequentialTraceName[] = [
  'automerge-paper',
  'friendsforever_flat',
  'rustcode',
  'seph-blog1',
  'sveltecomponent',
];

export const sequentialTraces = {
  filename: (name: SequentialTraceName) =>
    path.resolve(rootFolder, 'node_modules', 'editing-traces', 'sequential_traces', `${name}.json.gz`),
  get: (name: SequentialTraceName) => {
    if (!cache[name]) {
      const filename = sequentialTraces.filename(name);
      cache[name] = loadTrace(filename as SequentialTraceName);
    }
    return cache[name];
  },
};

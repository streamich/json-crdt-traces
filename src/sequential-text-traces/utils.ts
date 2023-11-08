import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import {rootFolder} from '../root';
import type {SequentialTrace} from './types';

export const traces = [
  <const>'automerge-paper',
  <const>'friendsforever_flat',
  <const>'rustcode',
  <const>'seph-blog1',
  <const>'sveltecomponent',
];

export type SequentialTraceName = typeof traces[number];

export const filename = (name: SequentialTraceName) =>
  path.resolve(rootFolder, 'node_modules', 'editing-traces', 'sequential_traces', `${name}.json.gz`);

export const load = (name: SequentialTraceName): SequentialTrace => {
  const traceFileName = filename(name);
  const buf = fs.readFileSync(traceFileName);
  const text = zlib.gunzipSync(buf).toString();
  const json = JSON.parse(text);
  return json as SequentialTrace;
};

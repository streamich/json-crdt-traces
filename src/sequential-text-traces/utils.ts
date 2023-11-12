import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import {Patch} from 'json-joy/es2020/json-crdt-patch';
import {Model} from 'json-joy/es2020/json-crdt';
import {rootFolder} from '../root';
import type {SequentialTrace} from './types';
import {defaultSessionId} from '../constants';

export const traces = [
  <const>'automerge-paper',
  <const>'friendsforever_flat',
  <const>'rustcode',
  <const>'seph-blog1',
  <const>'sveltecomponent',
  <const>'json-crdt-patch',
  <const>'json-crdt-blog-post',
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

export const toBatch = (json: SequentialTrace): Patch[] => {
  const model = Model.withLogicalClock(defaultSessionId);
  model.api.root('');
  const str = model.api.str([]);
  const batch: Patch[] = [model.api.flush()];
  for (const txn of json.txns) {
    for (const patch of txn.patches) {
      const [pos, remove, insert] = patch;
      if (remove) str.del(pos, remove);
      if (insert) str.ins(pos, insert);
    }
    batch.push(model.api.flush());
  }
  if (model.view() !== json.endContent) console.warn('Contents do not match!');
  if ((model.view() as any).length !== json.endContent.length) throw new Error('Lengths do not match!');
  return batch;
};

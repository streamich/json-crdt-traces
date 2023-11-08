import * as path from 'path';
import * as fs from 'fs';
import * as zlib from 'zlib';
import {Patch} from 'json-joy/es2020/json-crdt-patch';
import {Model} from 'json-joy/es2020/json-crdt';
import {rootFolder} from '../root';
import {defaultSessionId} from '../constants';
import type {ConcurrentTrace} from './types';

export const traces = [
  <const>'friendsforever',
];

export type ConcurrentTraceName = typeof traces[number];

export const filename = (name: ConcurrentTraceName) =>
  path.join(rootFolder, 'node_modules', 'editing-traces', 'concurrent_traces', `${name}.json.gz`);

export const load = (traceName: ConcurrentTraceName): ConcurrentTrace => {
  const traceFile = filename(traceName);
  const buf = fs.readFileSync(traceFile);
  const text = zlib.gunzipSync(buf).toString();
  const json = JSON.parse(text) as ConcurrentTrace;
  return json;
};

export const toBatch = (json: ConcurrentTrace): Patch[] => {
  const agent0 = Model.withLogicalClock(defaultSessionId);
  agent0.api.root('');
  const agents: Model[] = [agent0];
  const histories: Patch[][] = [[agent0.api.flush()], ...Array.from({length: json.numAgents - 1}, () => [])];
  const historyLenAtTxn: number[][] = [];
  const historyConsumed: number[][] = Array.from({length: json.numAgents}, () => []);
  for (let i = 1; i < json.numAgents; i++) {
    const fork = agents[0].fork(agents[0].clock.sid + i);
    agents.push(fork);
  }
  for (let i = 0; i < json.txns.length; i++) {
    const txn = json.txns[i];
    const agent = agents[txn.agent];
    const str = agent.api.str([]);
    for (const parent of txn.parents) {
      const parentTxn = json.txns[parent];
      if (parentTxn.agent === txn.agent) continue;
      const historyLength = historyLenAtTxn[parent][parentTxn.agent];
      const history = histories[parentTxn.agent];
      const historySlice = history.slice(historyConsumed[txn.agent][parentTxn.agent], historyLength);
      historyConsumed[txn.agent][parentTxn.agent] = historyLength;
      agent.applyBatch(historySlice);
      for (const slice of historySlice) histories[txn.agent].push(slice);
    }
    for (const patch of txn.patches) {
      const [pos, remove, insert] = patch;
      if (remove) str.del(pos, remove);
      if (insert) str.ins(pos, insert);
    }
    const agentPatch = agent.api.flush();
    histories[txn.agent].push(agentPatch);
    historyLenAtTxn.push(histories.map((h) => h.length));
  }
  if (agents[0].view() !== json.endContent) console.warn('Contents do not match!');
  if ((agents[0].view() as any).length !== json.endContent.length) throw new Error('Lengths do not match!');
  const patchExists = new Set<string>();
  const history = histories[0];
  const batch: Patch[] = [];
  for (const patch of history) {
    const id = patch.getId()!.sid + '_' + patch.getId()!.time;
    if (patchExists.has(id)) continue;
    patchExists.add(id);
    batch.push(patch);
  }
  const model = Model.withLogicalClock(defaultSessionId);
  model.applyBatch(batch);
  if (model.view() !== json.endContent) console.warn('Contents do not match!');
  if ((model.view() as any).length !== json.endContent.length) throw new Error('Lengths do not match!');
  return batch;
};

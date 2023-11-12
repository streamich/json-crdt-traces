// Run: npx ts-node src/collect-vscodelogs.ts

import {collectTrace} from './collect/vscodelogs';

const logsDir = '/Users/mini/vscodelogs';
// const targetDocName = 'blog-post-1';
// const targetDocName = 'json-crdt-patch';
const targetDocName = 'json-crdt';

const trace = collectTrace(logsDir, targetDocName);

console.log(trace.endContent);
console.log(`✅ collected`);

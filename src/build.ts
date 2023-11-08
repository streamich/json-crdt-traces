// Run: npx ts-node src/build.ts

import * as concurrentTraces from './concurrent-text-traces';
import * as store from './store';

for (const traceName of concurrentTraces.traces) {
  const trace = concurrentTraces.load(traceName);
  const batch = concurrentTraces.toBatch(trace);
  store.storeTrace({
    name: traceName,
    directory: ['text', 'concurrent'],
    batch,
    emitViewText: true,
  });
}

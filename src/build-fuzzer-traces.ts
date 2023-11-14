// Run: npx ts-node src/build-fuzzer-traces.ts

import * as fuzzerTraces from './fuzzer';
import * as store from './store';

for (const traceName of fuzzerTraces.traces) {
  const batch = fuzzerTraces.toBatch(traceName);
  console.log(`Storing trace ${traceName}, batch size: ${batch.length}`);
  store.storeTrace({
    name: traceName,
    directory: ['fuzzer', 'processed'],
    batch,
  });
}

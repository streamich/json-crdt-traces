export type SequentialTraceName =
  | 'automerge-paper'
  | 'friendsforever_flat'
  | 'rustcode'
  | 'seph-blog1'
  | 'sveltecomponent';

export interface SequentialTrace {
  startContent: string;
  endContent: string;
  txns: SequentialTraceTransaction[];
}

export interface SequentialTraceTransaction {
  patches: [position: number, remove: number, insert: string][];
}

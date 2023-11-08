export interface ConcurrentTrace {
  kind: 'concurrent';
  endContent: 'string';
  numAgents: number;
  txns: ConcurrentTraceTransaction[];
}

export interface ConcurrentTraceTransaction {
  parents: number[];
  numChildren: number;
  agent: number;
  patches: [position: number, remove: number, text: string][];
}

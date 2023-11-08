export interface SequentialTrace {
  startContent: string;
  endContent: string;
  txns: SequentialTraceTransaction[];
}

export interface SequentialTraceTransaction {
  patches: [position: number, remove: number, insert: string][];
}

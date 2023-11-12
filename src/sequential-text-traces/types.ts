export interface SequentialTrace {
  startContent: string;
  endContent: string;
  txns: SequentialTraceTransaction[];
}

export interface SequentialTraceTransaction {
  time: string;
  patches: [position: number, remove: number, insert: string][];
}

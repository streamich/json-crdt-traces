import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import {SequentialTraceTransaction, SequentialTrace} from '../sequential-text-traces';
import {rootFolder} from '../root';

export interface LogChange {
  type: 'change';
  time: string;
  fileName: string;
  change: LogChangeItem[];
}

export interface LogChangeItem {
  range: [LogChangeItemRange, LogChangeItemRange];
  rangeOffset: number;
  rangeLength: number;
  text: string;
}

export interface LogChangeItemRange {
  line: number;
  character: number;
}

const LOG_FILE_REGEX = /^actions_\d\d_\d\d_\d\d\d\d_[a-zA-Z0-9]+\.json$/;

export const findLogsFiles = (dir: string) => {
  const files = fs.readdirSync(dir);
  const logFiles = files.filter(file => LOG_FILE_REGEX.test(file));
  const fullPaths = logFiles.map(file => `${dir}/${file}`);
  return fullPaths;
};

export const collectTxnsFromLogFile = (log: string, targetDocFileName: string): SequentialTraceTransaction[] => {
  const data = fs.readFileSync(log, 'utf8');
  const lines = data.split('\n');
  const txns: SequentialTraceTransaction[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const json = JSON.parse(line.trim());
      if (json.type === 'change') {
        if (String(json.fileName).indexOf(targetDocFileName) === -1) continue;
        if (!json.change.length) continue;
        const logChange = json as LogChange;
        const time = logChange.time;
        const tx: SequentialTraceTransaction = {
          time,
          patches: logChange.change.map((change: any) => {
            return [change.rangeOffset, change.rangeLength, change.text];
          }),
        };
        txns.push(tx);
      }
    } catch {}
  }
  return txns;
};

export const collectTxnsFromLogFiles = (logs: string[], targetDocFileName: string): SequentialTraceTransaction[] => {
  const txns: SequentialTraceTransaction[] = [];
  for (const log of logs) {
    const txnsInLog = collectTxnsFromLogFile(log, targetDocFileName);
    for (const txn of txnsInLog) txns.push(txn);
  }
  txns.sort((a, b) => a.time.localeCompare(b.time));
  return txns;
};

export const replayTxns = (txns: SequentialTraceTransaction[], str = ''): string => {
  for (const {patches} of txns) {
    for (const [pos, delHere, insContent = ''] of patches) {
      const before = str.slice(0, pos)
      const after = str.slice(pos + delHere)
      str = before + insContent + after
    }
  }
  return str;
};

export const collectTrace = (logsDir: string, targetDocName: string): SequentialTrace => {
  const targetDocNameSource = `/${targetDocName}.md`;

  const files = findLogsFiles(logsDir);
  const txns = collectTxnsFromLogFiles(files, targetDocNameSource);
  const endContent = replayTxns(txns);

  const trace: SequentialTrace = {
    startContent: '',
    endContent,
    txns,
  };

  const destination = path.join(rootFolder, 'traces', 'vscodelogs', `${targetDocName}.json.gz`);
  const zipped = zlib.gzipSync(Buffer.from(JSON.stringify(trace)));
  fs.writeFileSync(destination, zipped);

  return trace;
};

import * as path from "path";
import * as fs from "fs";
import * as zlib from "zlib";
import {Model} from "json-joy/es2020/json-crdt";
import {Patch} from "json-joy/es2020/json-crdt-patch";
import {encode as encodeVerbosePatch} from "json-joy/es2020/json-crdt-patch/codec/verbose";
import {encode as encodeCompactPatch} from "json-joy/es2020/json-crdt-patch/codec/compact";
import {Encoder as ModelVerboseEncoder} from "json-joy/es2020/json-crdt/codec/structural/verbose/Encoder";
import {Encoder as ModelCompactEncoder} from "json-joy/es2020/json-crdt/codec/structural/compact/Encoder";
import {Writer} from "json-joy/es2020/util/buffers/Writer";
import {JsonEncoder} from "json-joy/es2020/json-pack/json/JsonEncoder";
import {CborEncoder} from "json-joy/es2020/json-pack/cbor/CborEncoder";
import {rootFolder} from "./root";
import {defaultSessionId} from "./constants";

export interface StoreTraceOptions {
  directory: string[];
  name: string;
  batch: Patch[];
  emitViewText?: boolean;
}

export const storeTrace = (options: StoreTraceOptions) => {
  const tracesDir = path.join(rootFolder, 'traces');
  const traceDir = path.join(tracesDir, ...options.directory, options.name);
  fs.mkdirSync(traceDir, {recursive: true});

  const writer = new Writer();
  const jsonEncoder = new JsonEncoder(writer);
  const cborEncoder = new CborEncoder(writer);

  const files = {
    patchesTxt: path.join(traceDir, 'patches.txt'),
    patchesTxtGz: path.join(traceDir, 'patches.txt.gz'),
    patchesBin: path.join(traceDir, 'patches.bin'),
    patchesVerboseJson: path.join(traceDir, 'patches.verbose.json'),
    patchesVerboseJsonGz: path.join(traceDir, 'patches.verbose.json.gz'),
    patchesCompactJson: path.join(traceDir, 'patches.compact.json'),
    patchesCompactJsonGz: path.join(traceDir, 'patches.compact.json.gz'),
    modelTxt: path.join(traceDir, 'model.txt'),
    modelBin: path.join(traceDir, 'model.bin'),
    modelBinGz: path.join(traceDir, 'model.bin.gz'),
    modelVerboseJson: path.join(traceDir, 'model.verbose.json'),
    modelVerboseJsonGz: path.join(traceDir, 'model.verbose.json.gz'),
    modelCompactJson: path.join(traceDir, 'model.compact.json'),
    modelCompactJsonGz: path.join(traceDir, 'model.compact.json.gz'),
    viewTxt: path.join(traceDir, 'view.txt'),
    viewJson: path.join(traceDir, 'view.json'),
  };

  const txtData = options.batch.map(patch => patch + '\n\n').join('');
  // fs.writeFileSync(files.patchesTxt, txtData);
  fs.writeFileSync(files.patchesTxtGz, zlib.gzipSync(txtData, {level: 9}));

  const binData = cborEncoder.encode(options.batch.map(patch => patch.toBinary()));
  fs.writeFileSync(files.patchesBin, binData);

  const verboseJsonData = jsonEncoder.encode(options.batch.map(patch => encodeVerbosePatch(patch)));
  // fs.writeFileSync(files.patchesVerboseJson, verboseJsonData);
  fs.writeFileSync(files.patchesVerboseJsonGz, zlib.gzipSync(verboseJsonData, {level: 9}));

  const compactJsonData = jsonEncoder.encode(options.batch.map(patch => encodeCompactPatch(patch)));
  fs.writeFileSync(files.patchesCompactJson, compactJsonData);
  fs.writeFileSync(files.patchesCompactJsonGz, zlib.gzipSync(compactJsonData, {level: 9}));

  const model = Model.withLogicalClock(defaultSessionId);
  model.applyBatch(options.batch);
  const model2 = model.clone();

  const modelVerboseEncoder = new ModelVerboseEncoder();
  const modelCompactEncoder = new ModelCompactEncoder();

  fs.writeFileSync(files.modelTxt, model2 + '');
  fs.writeFileSync(files.modelBin, model2.toBinary());
  fs.writeFileSync(files.modelBinGz, zlib.gzipSync(model2.toBinary(), {level: 9}));
  fs.writeFileSync(files.modelVerboseJson, jsonEncoder.encode(modelVerboseEncoder.encode(model2)));
  fs.writeFileSync(files.modelVerboseJsonGz, zlib.gzipSync(jsonEncoder.encode(modelVerboseEncoder.encode(model2)), {level: 9}));
  fs.writeFileSync(files.modelCompactJson, jsonEncoder.encode(modelCompactEncoder.encode(model2)));
  fs.writeFileSync(files.modelCompactJsonGz, zlib.gzipSync(jsonEncoder.encode(modelCompactEncoder.encode(model2)), {level: 9}));

  if (options.emitViewText) fs.writeFileSync(files.viewTxt, model2.view() + '');
  const viewJson = JSON.stringify(JSON.parse(Buffer.from(jsonEncoder.encode(model2.view())).toString()), null, 4);
  fs.writeFileSync(files.viewJson, viewJson);
};

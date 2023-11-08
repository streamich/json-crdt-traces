# JSON CRDT Traces

A collection of [JSON CRDT][json-crdt] traces for testing and benchmarking. The
traces are provided in [JSON CRDT Patch][json-crdt-patch] format.

[json-crdt]: https://jsonjoy.com/specs/json-crdt
[json-crdt-patch]: https://jsonjoy.com/specs/json-crdt-patch


## Traces

See the __[`traces/`](traces/)__ directory for the list of traces. Each trace
is located in a separate directory and contains the following files:

- `patches.*` - files that contain the whole editing trace in JSON CRDT Patch format.
  - `patches.txt` - a text file containing the trace in human-readable format.
  - `patches.bin` - a binary file containing the trace patches in [`binary` format](https://jsonjoy.com/specs/json-crdt-patch/encoding/binary-format),
    the list of patches is store as a CBOR array.
  - `patch.verbose.json` - a JSON file containing the trace patches in [`verbose` format](https://jsonjoy.com/specs/json-crdt-patch/encoding/verbose-format).
  - `patch.compact.json` - a JSON file containing the trace patches in [`compact` format](https://jsonjoy.com/specs/json-crdt-patch/encoding/compact-format).
- `model.*` - files that contain the final state of the document in JSON CRDT format.
  - `model.txt` - a text file containing the document in human-readable format.
  - `model.bin` - a binary file containing the document in [`binary` format](https://jsonjoy.com/specs/json-crdt/encoding/structural-encoding/binary-structural-format).
  - `model.verbose.json` - a JSON file containing the document in [`verbose` format](https://jsonjoy.com/specs/json-crdt/encoding/structural-encoding/verbose-structural-format).
  - `model.compact.json` - a JSON file containing the document in [`compact` format](https://jsonjoy.com/specs/json-crdt/encoding/structural-encoding/compact-structural-format).
- `view.*` - files that store the final view of the document.
  - `view.json` - the final view of the document in JSON format.
  - `view.txt` - a text file containing the view, only available for text traces.


## License

- Code in this repository is provided under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.
- A number of datasets from the upstream `editing-traces` repository are provided under the CC BY 4.0 license as well, [see](https://github.com/josephg/editing-traces/blob/3caad3dcce0043ef925d588d4788dbcddececbd8/sequential_traces/README.md?plain=1#L88).

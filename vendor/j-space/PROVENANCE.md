# Pinned upstream J-Space preservation

This directory was added by anonyjcy for the DSH adaptation. The canonical archive
contains **unmodified upstream bytes**, not an additional discoverable Skill.
Do not load the compressed archive as an agent prompt or register this directory
as a skill root. Only the expanded runtime under `preset/skills/j-space/` is
registered by the preset.

- Upstream project: https://github.com/Tiger3807861189/J-Space-Cognition-Suite
- Upstream author/citation: Tiger3807861189; see `CITATION.cff`.
- Pinned commit: `b2023124a1fa08278e3ee82aefa8ed9faeade995`.
- Scope: all 26 files under upstream `j-space/`, plus upstream `LICENSE`,
  `THIRD_PARTY_NOTICES.md`, and `CITATION.cff`, both upstream READMEs, and all six
  original Python test files (37 files total).
- The SHA-256 hashes and exact byte lengths of every canonical file and the
  archive are recorded in `manifest.json`. The integrity utility separately pins
  the manifest SHA-256; changing a manifest and archive together does not evade
  canonical verification.

## Losslessness and compression boundaries

`canonical.tar.gz` is a deterministic USTAR archive: sorted paths, regular files
only, mode 0644, UID/GID zero, empty owner/group names, modification time zero.
The gzip header has no filename and modification time zero. Original file bytes
are preserved without decoding, line-ending conversion, paraphrasing, or editing.
Metadata normalization is intentional; byte-perfect reconstruction applies to
file contents and path inventory, not the upstream Git filesystem timestamps.

The 37 canonical files contain 523,821 bytes. The archive contains 165,162 bytes,
a reduction of 358,659 bytes (68.47%) relative to those canonical source bytes.
This is **storage compression, not prompt-token compression**. An expanded
runtime plus the canonical archive increases the package footprint relative to
shipping the expanded runtime alone. Compression does not reduce what the model
reads. Runtime premise recurrence, drills, induction, examples, and refresh
triggers must remain intact; content hashes do not replace source reinjection.

From the package root, using Python 3.10 or newer:

```text
python3 tools/upstream_integrity.py verify
python3 tools/upstream_integrity.py expand --output /existing-parent/NEW-directory
python3 tools/upstream_integrity.py verify --runtime preset/skills/j-space --adapters vendor/j-space/adapters.json
```

Expansion refuses an existing destination, symlink/reparse paths, traversal,
archive links, duplicate members, unexpected members, malformed input, or any
hash mismatch. It validates the entire archive before creating a destination and
never executes archived code or uses unrestricted archive extraction. Output
contains the original `j-space/` subtree, all six upstream tests, both READMEs,
and three attribution files. Expansion
does not modify the installed runtime or overwrite existing work.

The runtime verifier requires every upstream file to match, unless an explicit
DSH adapter manifest identifies the exact expected hash of `SKILL.md`. The only
other permitted adapted path is the additive `integration/dsh.md`.
No controller, Python script, module, or upstream reference may be silently
classified as adapted. Use `--adapters PATH` with `--runtime` for a reviewed DSH
adaptation. The adapter manifest is trusted package policy, not evidence that an
adaptation preserves semantics; reviewers must inspect it and its source diff.

## License and third-party boundary

The complete upstream Apache License 2.0 is shipped here in readable `LICENSE`.
Readable copies of `THIRD_PARTY_NOTICES.md` and `CITATION.cff` retain upstream
attribution. The archive contains byte-identical copies of all three. Upstream
source and suite-authored text remain Apache-2.0; the plugin-owned wrapper may
retain its own license. A wrapper's MIT license does **not** relicense upstream
Apache-2.0 material or third-party excerpts.

Upstream notices expressly exclude third-party quotations and reported trace
fragments from Apache relicensing. In particular, the selected Reddit/Codeforces
trace fragments retain whatever rights and terms apply to the poster, Reddit,
Anthropic, Codeforces, and other rightsholders. Attribution and a public URL are
not a general redistribution or training-data license. This archival mechanism
neither claims permission nor resolves whether a license, exception, or consent
covers a particular distribution, model-input use, or training-data reuse.
Redistributors must assess that lawful basis before publishing the material.
The archive does not contain the full screenshot collection, full conversations,
model weights, or a separate training corpus; it does reproduce every excerpt
already present in the pinned upstream files.

Apache-2.0 redistribution requires shipping the license, preserving applicable
notices, and prominent change notices in modified files. Canonical files in this
archive are unmodified. DSH-adapted runtime files must carry their own prominent
change notices; a provenance document alone is not a substitute for that duty.

# Licenses, attribution, and adaptation notices

The plugin-owned DSH wrapper is under the [MIT license](LICENSE). This does not
relicense the upstream J-Space suite or third-party materials embedded in it.

## J-Space Cognition Suite

- Source: [Tiger3807861189/J-Space-Cognition-Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite).
- Pinned revision: [`b2023124a1fa08278e3ee82aefa8ed9faeade995`](https://github.com/Tiger3807861189/J-Space-Cognition-Suite/tree/b2023124a1fa08278e3ee82aefa8ed9faeade995).
- Suite-authored text and source remain under the full upstream
  [Apache License 2.0](vendor/j-space/LICENSE), shipped with this package.
- Attribution and boundaries remain in the byte-identical
  [third-party notices](vendor/j-space/THIRD_PARTY_NOTICES.md) and
  [citation](vendor/j-space/CITATION.cff).

The runtime skill preserves all 26 upstream files. Twenty-five are unchanged;
[the entry](preset/skills/j-space/SKILL.md) carries a prominently delimited,
removable DSH authority block. The additive
[host overlay](preset/skills/j-space/integration/dsh.md),
[integrity utility](tools/upstream_integrity.py), test harnesses, and provenance
policy are DSH-wrapper additions, not upstream contributions. No original
cognitive text is deleted or paraphrased. The canonical archive contains the
unmodified original files, tests, READMEs and attribution materials; see
[provenance](vendor/j-space/PROVENANCE.md).

Upstream explicitly excludes external quotations and reported reasoning-trace
fragments from Apache relicensing. Their applicable rights remain with the
respective authors and rightsholders. A public link, attribution, or compressed
archive does not itself establish permission to redistribute or train on them.
Before publication or reuse, assess the applicable license, exception, or consent;
this package does not grant third-party rights or make a blanket permission claim.

“Lossless” here means exact source-byte preservation and checked reconstruction,
not identical model performance, fewer prompt tokens, or unchanged host authority.
The wrapper and suite's code licenses are represented by the package SPDX
expression `MIT AND Apache-2.0`; that expression does not override the separate
third-party-material terms above.

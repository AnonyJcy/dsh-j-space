#!/usr/bin/env python3
"""DSH-owned tests for exact upstream preservation and safe reconstruction."""
from __future__ import annotations

import copy
import gzip
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools' / 'upstream_integrity.py'
spec = importlib.util.spec_from_file_location('upstream_integrity', TOOL)
assert spec and spec.loader
integrity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(integrity)


class CanonicalIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest, cls.files = integrity.load_canonical()

    def invoke(self, *args):
        return subprocess.run([sys.executable, '-B', str(TOOL), *map(str, args)],
                              text=True, encoding='utf-8', capture_output=True, check=False)

    def copy_vendor(self, parent):
        destination = Path(parent) / 'vendor'
        shutil.copytree(integrity.DEFAULT_VENDOR, destination)
        return destination

    def runtime(self, parent):
        destination = Path(parent) / 'runtime'
        for name, data in self.files.items():
            if name.startswith('j-space/'):
                target = destination / name.removeprefix('j-space/')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
        return destination

    def adapter(self, parent, files):
        path = Path(parent) / 'adapters.json'
        path.write_text(json.dumps({'schema': 1, 'upstreamCommit': integrity.PIN, 'files': files}),
                        encoding='utf-8')
        return path

    def test_pinned_inventory_and_notice_copies(self):
        self.assertEqual(len(self.files), 37)
        self.assertEqual(sum(map(len, self.files.values())), 523821)
        self.assertEqual(self.manifest['archive']['bytes'], 165162)
        self.assertEqual(len([name for name in self.files if name.startswith('j-space/')]), 26)
        self.assertEqual(len([name for name in self.files if '/modules/' in name]), 13)
        self.assertEqual(len([name for name in self.files if '/references/' in name]), 7)
        for name in integrity.NOTICE_NAMES:
            self.assertEqual((integrity.DEFAULT_VENDOR / name).read_bytes(), self.files[name])

    def test_cli_verify(self):
        result = self.invoke('verify')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['commit'], integrity.PIN)

    def test_expand_byte_perfect_and_refuse_overwrite(self):
        with tempfile.TemporaryDirectory() as parent:
            destination = Path(parent) / 'new-tree'
            result = self.invoke('expand', '--output', destination)
            self.assertEqual(result.returncode, 0, result.stderr)
            observed = {p.relative_to(destination).as_posix(): p.read_bytes()
                        for p in destination.rglob('*') if p.is_file()}
            self.assertEqual(observed, self.files)
            second = self.invoke('expand', '--output', destination)
            self.assertEqual(second.returncode, 2)
            self.assertIn('NEW nonexistent directory', second.stderr)
            self.assertEqual(observed, {p.relative_to(destination).as_posix(): p.read_bytes()
                                       for p in destination.rglob('*') if p.is_file()})

    def test_manifest_and_archive_tampering_fail_closed(self):
        for name in ('manifest.json', 'canonical.tar.gz', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CITATION.cff'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as parent:
                vendor = self.copy_vendor(parent)
                target = vendor / name
                target.write_bytes(target.read_bytes() + b'\nchanged')
                result = self.invoke('--vendor', vendor, 'verify')
                self.assertEqual(result.returncode, 2, result.stdout)
                self.assertIn('BLOCK:', result.stderr)
                output = Path(parent) / 'not-created'
                result = self.invoke('--vendor', vendor, 'expand', '--output', output)
                self.assertEqual(result.returncode, 2)
                self.assertFalse(output.exists())

    def test_runtime_originals_all_match_and_tampering_blocks(self):
        with tempfile.TemporaryDirectory() as parent:
            runtime = self.runtime(parent)
            result = self.invoke('verify', '--runtime', runtime)
            self.assertEqual(result.returncode, 0, result.stderr)
            target = runtime / 'modules' / 'capacity.md'
            target.write_bytes(target.read_bytes().replace(b'## Drills', b'## Deleted drills', 1))
            result = self.invoke('verify', '--runtime', runtime)
            self.assertEqual(result.returncode, 2)
            self.assertIn('Unadapted runtime differs', result.stderr)

    def test_only_explicit_dsh_adaptations_are_accepted(self):
        with tempfile.TemporaryDirectory() as parent:
            runtime = self.runtime(parent)
            entry = runtime / 'SKILL.md'
            entry.write_bytes(entry.read_bytes().replace(
                b'# J-Space\n', b'# J-Space\n' + integrity.ADAPTER_BEGIN
                + b'DSH adaptation added by anonyjcy.\n' + integrity.ADAPTER_END, 1))
            dsh = runtime / 'integration' / 'dsh.md'
            dsh.parent.mkdir()
            dsh.write_bytes(b'# DSH integration\n\nDSH-owned additive host adapter.\n')
            records = {name: {'sha256': integrity.sha256((runtime / name).read_bytes()),
                              'notice': 'DSH-owned additive host adaptation; canonical content retained'}
                       for name in ('SKILL.md', 'integration/dsh.md')}
            adapters = self.adapter(parent, records)
            result = self.invoke('verify', '--runtime', runtime, '--adapters', adapters)
            self.assertEqual(result.returncode, 0, result.stderr)
            dsh.write_bytes(dsh.read_bytes() + b'tampered')
            result = self.invoke('verify', '--runtime', runtime, '--adapters', adapters)
            self.assertEqual(result.returncode, 2)
            self.assertIn('runtime hash mismatch', result.stderr)
            records['scripts/control.py'] = {'sha256': integrity.sha256((runtime / 'scripts/control.py').read_bytes()),
                                             'notice': 'Pretend adaptation'}
            self.adapter(parent, records)
            result = self.invoke('verify', '--runtime', runtime, '--adapters', adapters)
            self.assertEqual(result.returncode, 2)
            self.assertIn('may allow only', result.stderr)

    def test_current_package_adapter_policy_preserves_original_bytes(self):
        result = integrity.verify_runtime(ROOT / 'preset/skills/j-space', self.files,
                                          ROOT / 'vendor/j-space/adapters.json')
        self.assertEqual(result['originalFiles'], 26)
        self.assertEqual(result['adaptedFiles'], ['SKILL.md', 'integration/dsh.md'])

    def test_recomputed_adapter_hash_cannot_bless_cognitive_deletion(self):
        with tempfile.TemporaryDirectory() as parent:
            runtime = self.runtime(parent)
            entry = runtime / 'SKILL.md'
            original = entry.read_bytes()
            block = integrity.ADAPTER_BEGIN + b'DSH authority addition.\n' + integrity.ADAPTER_END
            entry.write_bytes(original.replace(b'# J-Space\n', b'# J-Space\n' + block, 1)
                              .replace(b'## Establish the live workspace\n', b'', 1))
            adapters = self.adapter(parent, {'SKILL.md': {
                'sha256': integrity.sha256(entry.read_bytes()), 'notice': 'Pretend harmless change'}})
            result = self.invoke('verify', '--runtime', runtime, '--adapters', adapters)
            self.assertEqual(result.returncode, 2)
            self.assertIn('changed original upstream bytes', result.stderr)

    def test_entry_insertion_must_be_unique_and_at_original_title(self):
        block = integrity.ADAPTER_BEGIN + b'DSH authority addition.\n' + integrity.ADAPTER_END
        original = self.files['j-space/SKILL.md']
        invalid = (
            original + block,
            original.replace(b'# J-Space\n', b'# J-Space\n' + block + block, 1),
            original.replace(b'# J-Space\n', b'# J-Space\n' + integrity.ADAPTER_END
                             + b'Wrong order.\n' + integrity.ADAPTER_BEGIN, 1),
        )
        for observed in invalid:
            with self.subTest(observed=observed[:20]), self.assertRaises(integrity.IntegrityError):
                integrity.canonical_entry(observed)

    def test_unlisted_runtime_source_blocks(self):
        with tempfile.TemporaryDirectory() as parent:
            runtime = self.runtime(parent)
            (runtime / 'SECOND-SKILL.md').write_bytes(b'---\nname: unexpected\n---\n')
            with self.assertRaisesRegex(integrity.IntegrityError, 'Unlisted runtime file'):
                integrity.verify_runtime(runtime, self.files)

    def test_unsafe_names_are_rejected(self):
        for name in ('../escape', '/absolute', 'j-space/../escape', 'j-space//x', './x',
                     'C:/drive', 'j-space\\escape', 'j-space/./x', 'j-space/x\x00', ''):
            with self.subTest(name=name), self.assertRaises(integrity.IntegrityError):
                integrity.safe_name(name)

    def test_symlink_output_parent_and_runtime_rejected(self):
        with tempfile.TemporaryDirectory() as parent:
            actual = Path(parent) / 'actual'
            actual.mkdir()
            link = Path(parent) / 'link'
            try:
                link.symlink_to(actual, target_is_directory=True)
            except (OSError, NotImplementedError):
                self.skipTest('Platform does not permit test symlinks')
            result = self.invoke('expand', '--output', link / 'new-tree')
            self.assertEqual(result.returncode, 2)
            self.assertFalse((actual / 'new-tree').exists())
            runtime = self.runtime(parent)
            (runtime / 'linked.md').symlink_to(runtime / 'SKILL.md')
            with self.assertRaisesRegex(integrity.IntegrityError, 'link/reparse'):
                integrity.verify_runtime(runtime, self.files)

    def test_malicious_archive_members_are_rejected(self):
        for kind in ('traversal', 'symlink', 'hardlink', 'duplicate', 'extra', 'missing', 'content'):
            with self.subTest(kind=kind):
                files = list(self.files.items())
                buffer = io.BytesIO()
                with tarfile.open(fileobj=buffer, mode='w', format=tarfile.USTAR_FORMAT) as archive:
                    for index, (name, data) in enumerate(files):
                        if kind == 'missing' and index == 0:
                            continue
                        info = tarfile.TarInfo('../escape' if kind == 'traversal' and index == 0 else name)
                        info.size = len(data)
                        if index == 0 and kind in ('symlink', 'hardlink'):
                            info.type = tarfile.SYMTYPE if kind == 'symlink' else tarfile.LNKTYPE
                            info.linkname = '/tmp/outside'
                            info.size = 0
                        if index == 0 and kind == 'content':
                            data = b'X' + data[1:]
                        archive.addfile(info, io.BytesIO(data) if info.isfile() else None)
                        if index == 0 and kind == 'duplicate':
                            archive.addfile(info, io.BytesIO(data))
                    if kind == 'extra':
                        archive.addfile(tarfile.TarInfo('unexpected'))
                expanded = buffer.getvalue()
                compressed = gzip.compress(expanded, mtime=0)
                manifest = copy.deepcopy(self.manifest)
                manifest['archive'].update(bytes=len(compressed), expandedBytes=len(expanded),
                                           sha256=integrity.sha256(compressed))
                with self.assertRaises(integrity.IntegrityError):
                    integrity.read_archive(compressed, manifest)

    def test_duplicate_json_keys_rejected(self):
        with self.assertRaisesRegex(integrity.IntegrityError, 'Duplicate JSON key'):
            integrity.decode_json(b'{"schema":1,"schema":2}')

    def test_safety_limits(self):
        with self.assertRaisesRegex(integrity.IntegrityError, 'compressed safety limit'):
            integrity.read_archive(b'x' * (integrity.MAX_ARCHIVE + 1), self.manifest)
        expanded = b'x' * (integrity.MAX_EXPANDED + 1)
        compressed = gzip.compress(expanded, mtime=0)
        manifest = copy.deepcopy(self.manifest)
        manifest['archive'].update(bytes=len(compressed), expandedBytes=len(expanded),
                                   sha256=integrity.sha256(compressed))
        with self.assertRaisesRegex(integrity.IntegrityError, 'expanded safety limit'):
            integrity.read_archive(compressed, manifest)


if __name__ == '__main__':
    unittest.main()

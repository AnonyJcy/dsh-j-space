#!/usr/bin/env python3
"""Run unchanged, pinned upstream tests against the current DSH skill in a fixture.

This intentionally executes reviewed upstream TEST code; the integrity utility itself
only verifies/reconstructs bytes. No profile, installed skill, or host Team is changed.
"""
import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('jspace_upstream_integrity', ROOT / 'tools/upstream_integrity.py')
INTEGRITY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INTEGRITY)


def main():
    try:
        _, canonical = INTEGRITY.load_canonical()
        runtime = ROOT / 'preset/skills/j-space'
        INTEGRITY.verify_runtime(runtime, canonical, ROOT / 'vendor/j-space/adapters.json')
        with tempfile.TemporaryDirectory(prefix='j-space-upstream-tests-') as temporary:
            parent = Path(temporary).resolve()
            fixture = parent / 'fixture'
            INTEGRITY.expand(fixture, canonical)
            # These fixture paths were just created from verified archive members. Copy
            # the reviewed runtime over them; originals remain untouched in the archive.
            for original in canonical:
                if original.startswith('j-space/'):
                    relative = Path(original.removeprefix('j-space/'))
                    source = runtime / relative
                    target = fixture / 'j-space' / relative
                    assert target.resolve().is_relative_to(fixture.resolve())
                    target.write_bytes(source.read_bytes())
            addition = fixture / 'j-space/integration'
            addition.mkdir()
            shutil.copyfile(runtime / 'integration/dsh.md', addition / 'dsh.md')
            env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
            print('Unchanged pinned upstream tests; current DSH runtime; disposable fixture:', fixture, flush=True)
            result = subprocess.run(
                [sys.executable, '-B', '-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py', '-v'],
                cwd=fixture, env=env, check=False)
            return result.returncode
    except (INTEGRITY.IntegrityError, OSError, ValueError) as exc:
        print('BLOCK: upstream test fixture not verified: ' + str(exc), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())

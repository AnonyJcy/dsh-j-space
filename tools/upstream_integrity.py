#!/usr/bin/env python3
"""Verify/reconstruct pinned J-Space bytes; never execute archived source.

DSH-owned integrity adapter, added by anonyjcy. Canonical upstream files retain
Apache-2.0 and third-party attribution; this utility grants no third-party rights.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import stat
import sys
import tarfile
import zlib

PIN = 'b2023124a1fa08278e3ee82aefa8ed9faeade995'
MANIFEST_SHA256 = '45d59d75e907019c67a771b8eb7f5a1838258788dc4e4bd60b9ed72cf21f99a9'
DEFAULT_VENDOR = Path(__file__).resolve().parents[1] / 'vendor' / 'j-space'
MAX_ARCHIVE = 1024 * 1024
MAX_EXPANDED = 2 * 1024 * 1024
MAX_FILE = 256 * 1024
ADAPTABLE = {'SKILL.md', 'integration/dsh.md'}
ADAPTER_BEGIN = b'\n<!-- DSH ADAPTER BEGIN -->\n'
ADAPTER_END = b'<!-- DSH ADAPTER END -->\n'
NOTICE_NAMES = {'LICENSE', 'THIRD_PARTY_NOTICES.md', 'CITATION.cff'}


class IntegrityError(ValueError):
    """The requested artifact is not the pinned, safe representation."""


def require(condition, message):
    if not condition:
        raise IntegrityError(message)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON key: ' + key)
        result[key] = value
    return result


def decode_json(data):
    return json.loads(data.decode('utf-8'), object_pairs_hook=unique_object)


def safe_name(name):
    require(isinstance(name, str) and bool(name), 'Empty or non-string archive path')
    require('\\' not in name and ':' not in name and '\x00' not in name,
            'Unsupported path syntax: ' + repr(name))
    path = PurePosixPath(name)
    require(not path.is_absolute() and all(part not in ('', '.', '..') for part in name.split('/')),
            'Unsafe path: ' + repr(name))
    require(str(path) == name, 'Noncanonical path: ' + repr(name))
    return path


def linked(path):
    info = path.lstat()
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, 'st_file_attributes', 0) & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400))


def unlinked_path(path):
    """Reject existing symbolic-link/reparse components, including ancestors."""
    path = Path(path).absolute()
    for part in reversed([path, *path.parents]):
        if part.exists() or part.is_symlink():
            require(not linked(part), 'Symbolic link/reparse path is forbidden: ' + str(part))
    return path


def bounded_file(path, maximum):
    path = unlinked_path(path)
    require(path.is_file(), 'Required regular file missing: ' + str(path))
    with path.open('rb') as handle:
        data = handle.read(maximum + 1)
    require(len(data) <= maximum, 'File exceeds safety limit: ' + str(path))
    return data


def read_archive(raw, manifest):
    """Validate all archive members before permitting any output creation."""
    require(len(raw) <= MAX_ARCHIVE, 'Archive exceeds compressed safety limit')
    require(len(raw) == manifest['archive']['bytes'], 'Archive size differs from manifest')
    require(sha256(raw) == manifest['archive']['sha256'], 'Canonical archive SHA-256 mismatch')
    with gzip.GzipFile(fileobj=io.BytesIO(raw), mode='rb') as handle:
        expanded = handle.read(MAX_EXPANDED + 1)
    require(len(expanded) <= MAX_EXPANDED, 'Archive exceeds expanded safety limit')
    require(len(expanded) == manifest['archive']['expandedBytes'], 'Expanded archive size mismatch')
    expected = {}
    for item in manifest['files']:
        name = item['path']
        safe_name(name)
        require(name not in expected, 'Duplicate manifest path: ' + name)
        require(type(item['bytes']) is int and 0 <= item['bytes'] <= MAX_FILE,
                'Invalid member byte length: ' + name)
        expected[name] = item
    require(len(expected) == 37, 'Pinned archive must contain exactly 37 files')
    result = {}
    with tarfile.open(fileobj=io.BytesIO(expanded), mode='r:', format=tarfile.USTAR_FORMAT) as archive:
        for member in archive:
            safe_name(member.name)
            require(member.name in expected, 'Unexpected archive member: ' + member.name)
            require(member.name not in result, 'Duplicate archive member: ' + member.name)
            require(member.isfile() and member.type == tarfile.REGTYPE,
                    'Only ordinary files are permitted: ' + member.name)
            require(not member.linkname and not member.pax_headers,
                    'Archive links/extensions are forbidden: ' + member.name)
            require(member.size == expected[member.name]['bytes'], 'Member size mismatch: ' + member.name)
            handle = archive.extractfile(member)
            require(handle is not None, 'Unreadable member: ' + member.name)
            with handle:
                data = handle.read(MAX_FILE + 1)
            require(len(data) == member.size, 'Truncated/oversized member: ' + member.name)
            require(sha256(data) == expected[member.name]['sha256'], 'Member SHA-256 mismatch: ' + member.name)
            result[member.name] = data
    require(set(result) == set(expected), 'Archive member inventory differs from manifest')
    return result


def load_canonical(vendor=DEFAULT_VENDOR):
    vendor = unlinked_path(vendor)
    raw = bounded_file(vendor / 'manifest.json', MAX_FILE)
    require(sha256(raw) == MANIFEST_SHA256, 'Pinned manifest SHA-256 mismatch')
    manifest = decode_json(raw)
    require(manifest['schema'] == 1 and manifest['upstream']['commit'] == PIN,
            'Manifest does not identify the pinned upstream revision')
    require(manifest['archive']['path'] == 'canonical.tar.gz', 'Unexpected archive path')
    files = read_archive(bounded_file(vendor / 'canonical.tar.gz', MAX_ARCHIVE), manifest)
    for name in NOTICE_NAMES:
        require(bounded_file(vendor / name, MAX_FILE) == files[name],
                'Readable attribution copy differs from canonical bytes: ' + name)
    return manifest, files


def load_adapters(path):
    if path is None:
        return {}
    document = decode_json(bounded_file(path, MAX_FILE))
    require(isinstance(document, dict) and document.get('schema') == 1
            and document.get('upstreamCommit') == PIN, 'Invalid DSH adapter manifest identity')
    files = document.get('files')
    require(isinstance(files, dict) and set(files).issubset(ADAPTABLE),
            'DSH adapter manifest may allow only SKILL.md and integration/dsh.md')
    for name, item in files.items():
        safe_name(name)
        require(isinstance(item, dict) and isinstance(item.get('notice'), str)
                and item['notice'].strip(), 'Adapted path requires a prominent-change description: ' + name)
        digest = item.get('sha256')
        require(isinstance(digest, str) and len(digest) == 64
                and all(c in '0123456789abcdef' for c in digest), 'Invalid adapter SHA-256: ' + name)
    return files


def canonical_entry(observed):
    """Remove exactly one DSH insertion, never any original cognitive content."""
    require(observed.count(ADAPTER_BEGIN) == 1 and observed.count(ADAPTER_END) == 1,
            'Adapted entry requires exactly one bounded DSH insertion')
    anchor = b'# J-Space\n'
    begin = observed.index(ADAPTER_BEGIN)
    require(observed.count(anchor) == 1 and begin == observed.index(anchor) + len(anchor),
            'DSH insertion must appear immediately after the original entry title')
    end = observed.index(ADAPTER_END)
    require(end > begin, 'DSH insertion markers are out of order')
    return observed[:begin] + observed[end + len(ADAPTER_END):]


def verify_runtime(root, canonical, adapters=None):
    root = unlinked_path(root)
    require(root.is_dir(), 'Runtime skill root is not a directory')
    originals = {name.removeprefix('j-space/'): data for name, data in canonical.items()
                 if name.startswith('j-space/')}
    adaptations = load_adapters(adapters)
    for name, data in originals.items():
        observed = bounded_file(root.joinpath(*safe_name(name).parts), MAX_FILE)
        if name in adaptations:
            require(sha256(observed) == adaptations[name]['sha256'], 'Adapted runtime hash mismatch: ' + name)
            require(name == 'SKILL.md' and canonical_entry(observed) == data,
                    'DSH entry insertion changed original upstream bytes: ' + name)
        else:
            require(observed == data, 'Unadapted runtime differs from upstream: ' + name)
    for name in set(adaptations) - set(originals):
        observed = bounded_file(root.joinpath(*safe_name(name).parts), MAX_FILE)
        require(sha256(observed) == adaptations[name]['sha256'], 'DSH-only runtime hash mismatch: ' + name)
    allowed = set(originals) | set(adaptations) | NOTICE_NAMES
    for path in root.rglob('*'):
        require(not linked(path), 'Runtime contains a link/reparse entry: ' + str(path))
        if path.is_file():
            relative = path.relative_to(root)
            if '__pycache__' in relative.parts and path.suffix == '.pyc':
                continue
            require(relative.as_posix() in allowed, 'Unlisted runtime file: ' + relative.as_posix())
    for name in NOTICE_NAMES:
        if (root / name).exists():
            require(bounded_file(root / name, MAX_FILE) == canonical[name], 'Runtime attribution differs: ' + name)
    return {'originalFiles': len(originals), 'adaptedFiles': sorted(adaptations)}


def expand(output, canonical):
    """Create a new destination only; deliberately do not use tar.extractall."""
    output = unlinked_path(output)
    require(not output.exists() and not output.is_symlink(), 'Output must be a NEW nonexistent directory')
    require(output.parent.is_dir(), 'Output parent must already exist')
    # Validation precedes mkdir: corrupt input cannot create a misleading partial tree.
    for name in canonical:
        safe_name(name)
    output.mkdir(exist_ok=False)
    for name, data in sorted(canonical.items()):
        target = output.joinpath(*safe_name(name).parts)
        unlinked_path(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        unlinked_path(target)
        with target.open('xb') as handle:
            handle.write(data)
    return output


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--vendor', type=Path, default=DEFAULT_VENDOR)
    sub = parser.add_subparsers(dest='command', required=True)
    verify = sub.add_parser('verify', help='Verify canonical archive and optionally runtime bytes')
    verify.add_argument('--runtime', type=Path)
    verify.add_argument('--adapters', type=Path)
    unpack = sub.add_parser('expand', help='Reconstruct all 37 canonical files in a NEW directory')
    unpack.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        manifest, files = load_canonical(args.vendor)
        result = {'commit': PIN, 'files': len(files), 'sourceBytes': sum(map(len, files.values())),
                  'archiveBytes': manifest['archive']['bytes'], 'archiveSha256': manifest['archive']['sha256']}
        if args.command == 'expand':
            result['output'] = str(expand(args.output, files))
        else:
            require(args.runtime is not None or args.adapters is None, '--adapters requires --runtime')
            if args.runtime is not None:
                result['runtime'] = verify_runtime(args.runtime, files, args.adapters)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (IntegrityError, OSError, ValueError, KeyError, TypeError, AttributeError,
            EOFError, tarfile.TarError, zlib.error) as exc:
        print('BLOCK: ' + str(exc), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())

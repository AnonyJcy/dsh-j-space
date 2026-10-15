"""Original cognitive gates with DSH-owned execution authority.

Run: python3 -B tests/dsh-cognition-contract.test.py
Fixtures model evidence participation, not actual Team creation or model comprehension.
Every mutation is confined to a disposable task/skill; no live DSH session is started.
"""
import ast
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
SKILL = Path(__file__).resolve().parents[1] / 'preset' / 'skills' / 'j-space'


def load(name, script):
    spec = importlib.util.spec_from_file_location(name, SKILL / 'scripts' / script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


CONTROL = load('dsh_original_cognition_control', 'control.py')
BRIDGE = load('dsh_original_cognition_bridge', 'host_bridge.py')


class DshCognitionContractTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='dsh cognition contract ')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / 'task'
        self.root.mkdir()
        self.skill = Path(temporary.name) / 'skill'
        shutil.copytree(SKILL, self.skill, ignore=shutil.ignore_patterns('__pycache__'))
        skill_patch = patch.object(CONTROL, 'SKILL', self.skill)
        skill_patch.start()
        self.addCleanup(skill_patch.stop)

    def cli(self, *args, ok=True):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = CONTROL.main(['--root', str(self.root), *args])
        text = out.getvalue() + err.getvalue()
        self.assertEqual(code, 0 if ok else 2, text)
        return text

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')

    def state(self):
        return json.loads((self.root / '.jspace/control.json').read_text(encoding='utf-8'))

    def init(self, level='high', *options):
        self.cli('init', '--goal', 'Deliver verified fixture behavior', '--next', 'Inspect fixture',
                 '--level', level, *options)
        self.cli('read')

    def participant(self):
        # This is a local evidence identity in a fixture, never a fake live Team row.
        self.cli('agent', 'add', '--id', 'worker', '--parent', 'root',
                 '--task', 'Inspect bounded fixture contract', '--owns', 'source.txt')

    def report(self, agent='root', round=1, sources=()):
        name = '%s-%s.txt' % (agent, round)
        self.write(name, 'Evidence for %s pass %s: boundary tested, limitation retained.' % (agent, round))
        options = []
        for source in sources:
            options += ['--source', source]
        if agent == 'root':
            self.write('completion.txt', 'Goal item checked; fixture tests passed; untested environment disclosed.')
            options += ['--completion', 'completion.txt']
        self.cli('report', '--agent', agent, '--summary', 'Verified bounded fixture',
                 '--evidence', name, '--next', 'Challenge weakest assumption', '--round', str(round), *options)

    def review(self):
        self.write('review.txt', 'Root independently repeated the fixture check and inspected the limitation.')
        self.cli('review', '--agent', 'root', '--target', 'worker',
                 '--verdict', 'accepted', '--evidence', 'review.txt')

    def accepted(self, sources=()):
        self.participant()
        self.cli('read', '--agent', 'worker')
        self.report('root', sources=sources)
        self.report('worker', 1, sources)
        self.report('worker', 2, sources)
        self.review()

    def test_high_root_can_ship_without_fabricated_delegate_or_round_two(self):
        self.init()
        self.report()
        self.assertEqual(list(self.state()['agents']), ['root'])
        self.assertIn('ALLOW ship', self.cli('check', '--stage', 'ship'))

    def test_xhigh_requires_truthful_recorded_delegation_limitation(self):
        self.init('xhigh')
        self.report()
        self.assertIn('--solo-reason', self.cli('check', '--stage', 'ship', ok=False))
        self.cli('note', '--solo-reason', 'Official DSH Team creation was not user-requested; sequential method checks only, no independent agent review.')
        self.cli('check', '--stage', 'ship')
        self.assertEqual(list(self.state()['agents']), ['root'])

    def test_local_participant_needs_own_reads_and_cannot_bypass_root_gate(self):
        self.init()
        self.participant()
        self.report()
        self.assertIn('must actually read', self.cli('check', '--stage', 'work', '--agent', 'worker', ok=False))
        self.cli('check', '--stage', 'ship', ok=False)
        self.cli('read', '--agent', 'worker')
        self.assertIn('no delivery report', self.cli('check', '--stage', 'ship', ok=False))

    def test_same_participant_second_consideration_and_independent_review_required(self):
        self.init()
        self.participant()
        self.cli('read', '--agent', 'worker')
        self.report()
        self.report('worker')
        self.review()
        self.assertIn('second-thinking', self.cli('check', '--stage', 'ship', ok=False))
        first = (self.root / 'worker-1.txt').read_bytes()
        self.report('worker', 2)
        self.assertEqual((self.root / 'worker-1.txt').read_bytes(), first)
        self.assertIn('not independently accepted', self.cli('check', '--stage', 'ship', ok=False))
        self.cli('review', '--agent', 'worker', '--target', 'worker', '--verdict', 'accepted', '--evidence', 'review.txt', ok=False)
        self.review()
        self.cli('check', '--stage', 'ship')

    def test_report_source_and_review_bytes_remain_bound_to_acceptance(self):
        for artifact in ('worker-2.txt', 'source.txt', 'review.txt'):
            with self.subTest(artifact=artifact):
                # Reinitialize separate fixture state for each invalidation.
                with tempfile.TemporaryDirectory(prefix='dsh bound evidence ') as directory:
                    original = self.root
                    self.root = Path(directory)
                    try:
                        self.init()
                        self.write('source.txt', 'Original material dependency')
                        self.accepted(('source.txt',))
                        self.cli('check', '--stage', 'ship')
                        self.write(artifact, 'Changed after independent acceptance')
                        self.cli('check', '--stage', 'ship', ok=False)
                    finally:
                        self.root = original

    def test_contract_change_requires_fresh_delegate_cycle_and_review(self):
        self.init()
        self.accepted()
        self.cli('note', '--goal', 'Deliver a changed fixture acceptance')
        self.cli('read')
        self.cli('read', '--agent', 'worker')
        self.report()
        self.assertIn('contract changed', self.cli('check', '--stage', 'ship', ok=False))
        self.write('new-worker-2.txt', 'New check')
        self.cli('report', '--agent', 'worker', '--summary', 'Old cycle continuation',
                 '--evidence', 'new-worker-2.txt', '--next', 'Deliver', '--round', '2', ok=False)

    def test_every_participant_views_final_repository_fingerprint(self):
        self.init('high', '--module', 'modules/repository.md')
        self.write('source.txt', 'Fixture behavior')
        self.write('map.json', json.dumps({'summary': 'Fixture', 'areas': [{'path': 'source.txt', 'purpose': 'Behavior'}]}))
        self.cli('repo', 'sync', '--map', 'map.json')
        self.accepted(('source.txt',))
        # Evidence artifacts are in the original whole-tree inventory.
        self.cli('repo', 'sync', '--map', 'map.json')
        self.cli('read')
        self.cli('read', '--agent', 'worker')
        self.cli('repo', 'view')
        self.assertIn('worker must run repo view', self.cli('check', '--stage', 'ship', ok=False))
        self.cli('repo', 'view', '--agent', 'worker')
        self.cli('check', '--stage', 'ship')
        self.write('source.txt', 'Changed source behavior')
        self.cli('check', '--stage', 'work', ok=False)

    def test_local_retirement_preserves_history_and_reopens_root_integration(self):
        self.init()
        self.accepted()
        self.cli('agent', 'retire', '--id', 'worker', '--reason', 'Fixture participant abandoned; scope transferred to root')
        self.assertFalse(self.state()['agents']['worker']['active'])
        self.assertEqual(len(self.state()['agents']['worker']['reports']), 2)
        self.cli('read')
        self.assertIn('retirement changed integration scope', self.cli('check', '--stage', 'ship', ok=False))
        self.report()
        self.cli('check', '--stage', 'ship')

    def test_root_completion_and_security_evidence_still_fail_closed(self):
        self.init()
        self.cli('check', '--stage', 'ship', ok=False)
        self.report()
        for name in ('repro.txt', 'negative.txt', 'assessment.txt'):
            self.write(name, 'Authorized fixture evidence: ' + name)
        self.cli('security', 'add', '--id', 'F1', '--claim', 'Potential boundary issue', '--scope', 'Authorized local fixture',
                 '--repro', 'repro.txt', '--expected', 'Reject', '--observed', 'Accepted', '--negative', 'negative.txt')
        self.assertIn('Unresolved security', self.cli('check', '--stage', 'ship', ok=False))
        self.cli('security', 'resolve', '--id', 'F1', '--status', 'confirmed', '--disposition', 'report', '--evidence', 'assessment.txt')
        self.cli('check', '--stage', 'ship')
        self.write('assessment.txt', 'Changed assessment')
        self.cli('check', '--stage', 'ship', ok=False)

    def test_unchanged_checkpoint_refresh_reinjects_complete_original_sources(self):
        self.init()
        text = self.cli('pulse', '--event', 'checkpoint')
        for name in CONTROL.skill_files(self.state()):
            self.assertIn((self.skill / name).read_text(encoding='utf-8'), text)
        self.assertNotIn('--- UNCHANGED ', text)

    def test_original_bridge_rejects_unknown_child_instead_of_passthrough(self):
        self.init()
        reply = BRIDGE.handle(self.root, {'event': 'before_work', 'agent': 'unmapped-host-target'})
        self.assertFalse(reply['allow'])
        self.assertIn('Unknown agent', reply['context'])

    def test_controller_has_no_host_spawn_network_or_team_lifecycle_execution(self):
        tree = ast.parse((SKILL / 'scripts/control.py').read_text(encoding='utf-8'))
        imports = {alias.name.split('.')[0] for node in ast.walk(tree) if isinstance(node, ast.Import) for alias in node.names}
        imports.update(node.module.split('.')[0] for node in ast.walk(tree) if isinstance(node, ast.ImportFrom) and node.module)
        self.assertFalse(imports & {'subprocess', 'socket', 'requests', 'urllib'})
        self.init()
        self.participant()
        state = self.state()
        self.assertEqual(state['schema'], 1)
        self.assertFalse(any('team' in key.lower() for key in state))
        self.assertEqual(list(self.root.iterdir()), [self.root / '.jspace'])
        overlay = (SKILL / 'integration/dsh.md').read_text(encoding='utf-8')
        for required in ('Complexity never authorizes spawning', 'not Team members', 'not a Team roster', 'Only the Team Lead', '--solo-reason'):
            self.assertIn(required, overlay)


if __name__ == '__main__':
    unittest.main(verbosity=2)

import { describe, expect, it } from 'vitest';
import { SWYMBLE_DATA } from '../../../data/config';
import { commitSha } from '../CareerRepository/commitMessage';
import { CLEAR_SIGNAL, runCommand, type TerminalContext } from './terminalCommands';

const context: TerminalContext = {
  about: SWYMBLE_DATA.about,
  career: SWYMBLE_DATA.career,
  labs: SWYMBLE_DATA.labs,
  projects: SWYMBLE_DATA.projects,
};

const run = (input: string) => runCommand(input, context);
const text = (input: string) =>
  run(input)
    .map((line) => line.text)
    .join('\n');

describe('about terminal', () => {
  it('ignores empty input', () => {
    expect(run('')).toEqual([]);
    expect(run('    ')).toEqual([]);
  });

  it('reports unknown commands instead of failing silently', () => {
    const output = run('bogus');
    expect(output[0].tone).toBe('error');
    expect(output[0].text).toContain('bogus');
  });

  it('is case and whitespace insensitive', () => {
    expect(text('  WhoAmI  ')).toBe(text('whoami'));
  });

  it('signals clear distinctly from ordinary output', () => {
    expect(run('clear')).toEqual([{ text: CLEAR_SIGNAL }]);
  });

  it('answers whoami from the about data, not a hard-coded string', () => {
    const output = text('whoami');
    expect(output).toContain(SWYMBLE_DATA.about.repo);
    expect(output).toContain(SWYMBLE_DATA.about.role);
    expect(output).toContain(SWYMBLE_DATA.about.availability.label);
  });

  it('lists every branch under git branch and marks the trunk', () => {
    const output = run('git branch');
    expect(output).toHaveLength(SWYMBLE_DATA.career.length);
    expect(output.filter((line) => line.text.startsWith('*'))).toHaveLength(1);
  });

  it('caps git log by default and lifts the cap with --all', () => {
    const total = SWYMBLE_DATA.career.reduce((sum, branch) => sum + branch.nodes.length, 0);
    // The default view is truncated, so it ends with a "… N more" hint rather than everything.
    const capped = run('git log');
    expect(capped.length).toBeLessThan(total);
    expect(capped[capped.length - 1].text).toContain('more');

    expect(run('git log --all')).toHaveLength(total);
    expect(run('git log -n 3')).toHaveLength(4); // 3 commits + the truncation hint
  });

  it('resolves git show by sha prefix and by node id', () => {
    const node = SWYMBLE_DATA.career[0].nodes[0];
    const sha = commitSha(node.id);

    expect(text(`git show ${sha}`)).toContain(node.title);
    expect(text(`git show ${sha.slice(0, 4)}`)).toContain(node.title);
    expect(text(`git show ${node.id}`)).toContain(node.title);
  });

  it('rejects a bad sha rather than showing the wrong commit', () => {
    const output = run('git show zzzzzzz');
    expect(output[0].tone).toBe('error');
    expect(output[0].text).toContain('bad object');
  });

  it('prints the real config block', () => {
    const output = run('git config --list');
    expect(output).toHaveLength(SWYMBLE_DATA.about.config.length);
    expect(output[0].text).toContain(SWYMBLE_DATA.about.config[0].key);
  });

  it('renders README sections from data', () => {
    const output = text('cat README.md');
    for (const section of SWYMBLE_DATA.about.readme) {
      expect(output).toContain(section.heading);
    }
  });

  it('errors on a file that does not exist', () => {
    expect(run('cat nope.txt')[0].tone).toBe('error');
  });

  it('never leaks private labs through ls', () => {
    const output = text('ls labs');
    for (const lab of SWYMBLE_DATA.labs) {
      if (lab.visibility === 'private') {
        expect(output).not.toContain(lab.title);
      } else {
        expect(output).toContain(lab.title);
      }
    }
  });

  it('has working easter eggs', () => {
    expect(run('sudo rm')[0].tone).toBe('error');
    expect(text('rm -rf /')).toContain('refusing');
    expect(text('exit')).toContain('no exit');
    expect(text('git status')).toContain('On branch main');
    expect(text('coffee')).toContain('teapot');
    expect(text('pwd')).toContain('career.git');
    expect(text('ps')).toContain('day-job');
    expect(text('git blame')).toContain('it was me');
    expect(text('git push')).toContain('up-to-date');
    expect(text('npm install swymble')).toContain('swymble@1.0.0');
    expect(text('42')).toContain('42');
    expect(text('echo hello there')).toContain('hello there');
    expect(text('ping swymble.com')).toContain('icmp_seq');
  });

  it('keeps `man` split between the help screen and the joke', () => {
    // Bare `man` is the help screen; `man <thing>` must NOT fall through to it.
    expect(text('man')).toBe(text('help'));
    expect(text('man grep')).toContain('No manual entry');
  });

  it('reaches every easter egg rather than shadowing them with an earlier branch', () => {
    // Each of these previously sat after a broader branch that already returned, making it dead.
    const reachable: [string, string][] = [
      ['who', 'built the thing'],
      ['blame', 'it was me'],
      ['make', 'No rule to make target'],
      ['cd /etc', 'exactly where you need to be'],
      ['uptime', 'load average'],
    ];
    for (const [command, expected] of reachable) {
      expect(text(command), command).toContain(expected);
    }
  });

  it('produces no undefined text for any documented command', () => {
    const commands = [
      'help',
      'whoami',
      'git log',
      'git branch',
      'git config --list',
      'git status',
      'cat README.md',
      'stack',
      'ls',
      'ls labs',
      'ls projects',
      'contact',
    ];

    for (const command of commands) {
      const output = run(command);
      expect(output.length, command).toBeGreaterThan(0);
      for (const line of output) {
        expect(typeof line.text, `${command} → ${JSON.stringify(line)}`).toBe('string');
        expect(line.text).not.toContain('undefined');
      }
    }
  });
});

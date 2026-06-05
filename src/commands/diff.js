const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

module.exports = function diff() {
  const target = path.join(process.cwd(), 'context.md');
  if (!fs.existsSync(target)) {
    throw new Error('context.md not found. Run `ctx init` first.');
  }

  const inRepo = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (inRepo.status === 0) {
    const out = execSync('git diff -- context.md', { encoding: 'utf8' });
    if (!out.trim()) {
      console.log('No changes to context.md.');
    } else {
      process.stdout.write(out);
    }
    return;
  }

  // Not a git repo — print last 20 log entries instead.
  const content = fs.readFileSync(target, 'utf8');
  const match = content.match(/^##\s+Log\b[^\n]*\n([\s\S]*)$/m);
  if (!match) {
    console.log('No ## Log section found.');
    return;
  }
  const entries = match[1]
    .split('\n')
    .filter((line) => /^- \[/.test(line));
  const tail = entries.slice(-20);
  if (!tail.length) {
    console.log('No log entries yet.');
    return;
  }
  console.log('(not a git repo — showing last 20 log entries)\n');
  console.log(tail.join('\n'));
};

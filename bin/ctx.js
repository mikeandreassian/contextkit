#!/usr/bin/env node
const { Command } = require('commander');
const init = require('../src/commands/init');
const append = require('../src/commands/append');
const compress = require('../src/commands/compress');
const diff = require('../src/commands/diff');

const program = new Command();

program
  .name('ctx')
  .description('Persistent context.md memory for AI coding agents')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold a context.md in the current directory')
  .action(run(init));

program
  .command('append <message>')
  .description('Append a timestamped entry under ## Log')
  .action((message) => run(append)(message));

program
  .command('compress')
  .description('LLM-compress the ## Log section into bullet points')
  .action(run(compress));

program
  .command('diff')
  .description('Show git diff of context.md (or last 20 log entries)')
  .action(run(diff));

program.parseAsync(process.argv);

function run(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  };
}

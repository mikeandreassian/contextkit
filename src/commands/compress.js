const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-sonnet-4-20250514';

function splitLogSection(content) {
  const match = content.match(/^##\s+Log\b[^\n]*\n/m);
  if (!match) return null;
  const start = match.index;
  const headerEnd = start + match[0].length;
  const rest = content.slice(headerEnd);
  const nextHeader = rest.match(/^##\s+/m);
  const logEnd = nextHeader ? headerEnd + nextHeader.index : content.length;
  return {
    before: content.slice(0, headerEnd),
    body: content.slice(headerEnd, logEnd),
    after: content.slice(logEnd),
  };
}

module.exports = async function compress() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set in environment.');
  }
  const target = path.join(process.cwd(), 'context.md');
  if (!fs.existsSync(target)) {
    throw new Error('context.md not found. Run `ctx init` first.');
  }

  const content = fs.readFileSync(target, 'utf8');
  const parts = splitLogSection(content);
  if (!parts) {
    throw new Error('No ## Log section found in context.md.');
  }
  if (!parts.body.trim()) {
    console.log('Log section is empty. Nothing to compress.');
    return;
  }

  console.log('Compressing log section...');
  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Below is a chronological log of work entries from an AI agent context file. Compress it into a concise set of bullet points that preserves all meaningful facts (decisions made, files created/changed, features completed, issues found). Group related entries. Drop redundant chatter. Output ONLY the compressed bullet list in Markdown, no preamble.

LOG:
${parts.body.trim()}`,
      },
    ],
  });

  const summary = resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const stamp = new Date().toISOString().slice(0, 10);
  const newBody = `\n_Compressed ${stamp}_\n\n${summary}\n\n`;
  fs.writeFileSync(target, parts.before + newBody + parts.after);
  console.log('Log compressed.');
};

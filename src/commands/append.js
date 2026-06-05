const fs = require('fs');
const path = require('path');

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = function append(message) {
  if (!message || !message.trim()) {
    throw new Error('Message is required. Usage: ctx append "<message>"');
  }
  const target = path.join(process.cwd(), 'context.md');
  if (!fs.existsSync(target)) {
    throw new Error('context.md not found. Run `ctx init` first.');
  }
  let content = fs.readFileSync(target, 'utf8');
  const entry = `- [${timestamp()}] ${message.trim()}`;

  if (/^##\s+Log\b/m.test(content)) {
    // Append at the end of the file under the existing ## Log section.
    if (!content.endsWith('\n')) content += '\n';
    content += `${entry}\n`;
  } else {
    if (!content.endsWith('\n')) content += '\n';
    content += `\n## Log\n\n${entry}\n`;
  }

  fs.writeFileSync(target, content);
  console.log(entry);
};

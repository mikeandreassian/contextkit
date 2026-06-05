const fs = require('fs');
const path = require('path');

module.exports = function init() {
  const target = path.join(process.cwd(), 'context.md');
  if (fs.existsSync(target)) {
    throw new Error('context.md already exists in this directory. Aborting.');
  }
  const template = fs.readFileSync(
    path.join(__dirname, '..', '..', 'templates', 'default.md'),
    'utf8'
  );
  fs.writeFileSync(target, template);
  console.log(`Created ${target}`);
};

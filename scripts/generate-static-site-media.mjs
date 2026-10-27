import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modules = [
  ['public/site-media.json', 'functions/staticSiteMedia.js'],
  ['src/data/session2-source.json', 'src/data/session2-source.js'],
  ['src/data/session3-source.json', 'src/data/session3-source.js'],
  ['src/data/session4-source.json', 'src/data/session4-source.js'],
  ['src/data/session5-source.json', 'src/data/session5-source.js']
];

for (const [source, target] of modules) {
  const data = JSON.parse(await readFile(path.join(root, source), 'utf8'));
  const identifier = path.basename(target, '.js').replace(/(^|[-.])([a-z])/g, (_, separator, letter) => letter.toUpperCase());
  const output = `const ${identifier} = ${JSON.stringify(data, null, 2)};\n\nexport default ${identifier};\n`;
  await writeFile(path.join(root, target), output);
}

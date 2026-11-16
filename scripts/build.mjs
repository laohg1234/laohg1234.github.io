import { copyFile, mkdir, readFile, readdir, lstat, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const sourceRoot = path.join(root, 'site');
export const outputRoot = path.join(root, 'dist');

function inside(base, relative) {
  const result = path.resolve(base, relative);
  if (result !== base && !result.startsWith(base + path.sep)) throw new Error(`Path escapes its directory: ${relative}`);
  return result;
}

export async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symbolic links are not supported: ${filename}`);
    if (entry.isDirectory()) files.push(...await listFiles(filename));
    else if (entry.isFile()) files.push(filename);
  }
  return files.sort();
}

export async function build() {
  const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
  const destinations = new Set();
  const sources = new Set();
  const plan = [];
  for (const mount of config.mounts) {
    const from = inside(sourceRoot, mount.source);
    for (const file of await listFiles(from)) {
      const relative = path.join(mount.target, path.relative(from, file));
      const destination = inside(outputRoot, relative);
      const key = relative.replaceAll('\\', '/').toLowerCase();
      if (destinations.has(key)) throw new Error(`Duplicate public path: ${relative}`);
      if (sources.has(file)) throw new Error(`Source mounted twice: ${file}`);
      destinations.add(key);
      sources.add(file);
      plan.push({ file, destination });
    }
  }
  for (const file of await listFiles(sourceRoot)) {
    if (!sources.has(file)) throw new Error(`Source has no public path: ${path.relative(sourceRoot, file)}`);
  }
  const output = await lstat(outputRoot).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (output?.isSymbolicLink() || output && !output.isDirectory()) throw new Error('dist must be a normal directory');
  // This exact repository-local output directory is the only deletion target.
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  for (const { file, destination } of plan) {
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(file, destination);
  }
  await writeFile(path.join(outputRoot, '.nojekyll'), '');
  console.log(`Built ${plan.length} files into dist/; public URLs preserved.`);
  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
}

import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { build, outputRoot } from './build.mjs';

await build();
const required = ['index.html', '404.html', 'error-page.css', 'version.json', 'admin-data.js',
  'game.html', 'n.html', 'cookies.html', 'cookies.mp4', 'play/index.html', 'play/games.json',
  'flaudioviz/index.html', 'resources/js/cr.js', 'static/index.js'];
for (const file of required) await access(path.join(outputRoot, file));
for (const file of ['114514.html', 'README.md', 'SECURITY.md', 'package.json', 'site.config.json', '.github/workflows/static.yml']) {
  await assert.rejects(access(path.join(outputRoot, file)), `${file} must not be deployed`);
}
const games = JSON.parse(await readFile(path.join(outputRoot, 'play/games.json'), 'utf8'));
assert.equal(games.length, 30, 'current game catalog must have 30 entries');
assert.equal(new Set(games.map(game => game.id)).size, 30, 'game IDs must be unique');
for (const game of games) {
  assert.match(game.id, /^[a-z0-9]+(?:-[a-z0-9]+)+$/, 'game ID must be safe to use in a cover URL');
  for (const field of ['title', 'en', 'genre', 'category', 'description', 'rules', 'controls']) {
    assert.equal(typeof game[field], 'string', `${game.id}: ${field} must be a string`);
    assert(game[field].trim(), `${game.id}: ${field} must not be empty`);
  }
}
const coversRoot = path.join(outputRoot, 'play/assets/covers');
const coverFiles = await readdir(coversRoot, { withFileTypes: true });
assert(coverFiles.every(entry => entry.isFile() && entry.name.endsWith('.webp')), 'cover directory must contain only game WebP files');
assert.deepEqual(coverFiles.map(entry => entry.name).sort(), games.map(game => game.id + '.webp').sort(), 'covers must match the active catalog exactly');

// Load only the registration scripts, without creating games or emulating a browser.
const playHtml = await readFile(path.join(outputRoot, 'play/index.html'), 'utf8');
const gameScripts = [...playHtml.matchAll(/<script\b[^>]*\bsrc=["'](js\/games?-[a-z-]+\.js)["'][^>]*>\s*<\/script>/g)].map(match => match[1]);
const expectedScripts = ['js/game-arcade.js', 'js/game-race.js', 'js/game-defense.js', 'js/game-optics.js',
  'js/games-action.js', 'js/games-physics.js', 'js/games-strategy.js', 'js/games-puzzle.js'];
assert.deepEqual([...gameScripts].sort(), [...expectedScripts].sort(), 'play/index.html must load the current eight game source files');
const context = { window: {}, console, Math };
vm.createContext(context);
vm.runInContext(await readFile(path.join(outputRoot, 'play/js/core.js'), 'utf8'), context, { filename: 'play/js/core.js', timeout: 1000 });
context.FG = context.window.FG;
for (const file of gameScripts) {
  vm.runInContext(await readFile(path.join(outputRoot, 'play', file), 'utf8'), context, { filename: 'play/' + file, timeout: 1000 });
}
const runtimeCatalog = JSON.parse(JSON.stringify(context.FG.games.map(({ create, ...metadata }) => metadata)));
assert.equal(runtimeCatalog.length, 30, 'runtime must register 30 games');
assert.deepEqual(runtimeCatalog, games, 'generated catalog must match all runtime game metadata and ordering');
const errorPage = await readFile(path.join(outputRoot, '404.html'), 'utf8');
const resourceUrls = [...errorPage.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('#') && !/^https?:/.test(url));
for (const url of resourceUrls) assert(url.startsWith('/'), `404 URL must resolve from the site root: ${url}`);
const home = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
assert(home.includes('id="wuziRedeemDialog"'));
assert(home.includes('FSRB-0B88-CDT7'));
const hub = await readFile(path.join(outputRoot, 'game.html'), 'utf8');
assert(hub.includes('id="newGameCenter"'));
assert(hub.includes('href="./play/"'));
assert(hub.includes('./play/assets/covers/arcade-siege.webp'));
assert(hub.includes('./play/assets/covers/race-ridge-rally.webp'));
assert(!hub.includes('212') && !hub.includes('deluxe-'), 'game hub must not refer to the retired catalog');
console.log('Site checks passed: deployment boundary, legacy paths, 404 root URLs, 30 exact covers, runtime/catalog parity, homepage supply code.');

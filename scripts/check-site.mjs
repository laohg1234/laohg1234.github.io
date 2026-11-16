import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
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
assert.equal(games.length, 212);
assert.equal(new Set(games.map(game => game.id)).size, 212);
for (const game of games) await access(path.join(outputRoot, 'play/assets/covers', game.id + '.webp'));
const errorPage = await readFile(path.join(outputRoot, '404.html'), 'utf8');
const resourceUrls = [...errorPage.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]).filter(url => !url.startsWith('#') && !/^https?:/.test(url));
for (const url of resourceUrls) assert(url.startsWith('/'), `404 URL must resolve from the site root: ${url}`);
const home = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
assert(home.includes('id="wuziRedeemDialog"'));
assert(home.includes('FSRB-0B88-CDT7'));
const hub = await readFile(path.join(outputRoot, 'game.html'), 'utf8');
assert(hub.includes('id="newGameCenter"'));
assert(hub.includes('href="./play/"'));
console.log('Site checks passed: deployment boundary, legacy paths, 404 root URLs, 212 covers, homepage supply code.');

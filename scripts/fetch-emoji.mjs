// Downloads the Microsoft Fluent 3D emoji (MIT licence) listed in src/emoji.ts and writes
// 160px WebP files to public/emoji/, plus public/favicon.png and public/apple-touch-icon.png.
// Usage (sharp is intentionally not a project dependency):
//   npm install --no-save sharp && node scripts/fetch-emoji.mjs
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const BASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';
const outPath = (name) => fileURLToPath(new URL(`../public/emoji/${name}.webp`, import.meta.url));
const publicPath = (file) => fileURLToPath(new URL(`../public/${file}`, import.meta.url));

const source = await readFile(new URL('../src/emoji.ts', import.meta.url), 'utf8');
const entries = [...source.matchAll(/\['([a-z0-9-]+)',\s*'([^']+)',\s*(true|false)\]/g)]
	.map(([, name, folder, skinTone]) => ({ name, folder, skinTone: skinTone === 'true' }));
if (entries.length === 0) throw new Error('No emoji entries found in src/emoji.ts');

const urlFor = ({ folder, skinTone }) => {
	const file = folder.toLowerCase().replace(/ /g, '_');
	const dir = encodeURIComponent(folder);
	return skinTone
		? `${BASE}/${dir}/Default/3D/${file}_3d_default.png`
		: `${BASE}/${dir}/3D/${file}_3d.png`;
};

const download = async (entry) => {
	const res = await fetch(urlFor(entry));
	if (!res.ok) throw new Error(`${entry.name}: HTTP ${res.status} for ${urlFor(entry)}`);
	return Buffer.from(await res.arrayBuffer());
};

await mkdir(fileURLToPath(new URL('../public/emoji/', import.meta.url)), { recursive: true });

for (const entry of entries) {
	const png = await download(entry);
	await sharp(png)
		.resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.webp({ quality: 88 })
		.toFile(outPath(entry.name));
	process.stdout.write('.');
}

const baby = await download(entries.find((e) => e.name === 'baby'));
await sharp(baby).resize(64, 64).png().toFile(publicPath('favicon.png'));
const inner = await sharp(baby).resize(132, 132).png().toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#FFFBF2' } })
	.composite([{ input: inner, gravity: 'center' }])
	.png()
	.toFile(publicPath('apple-touch-icon.png'));

console.log(`\nWrote ${entries.length} emoji, favicon.png and apple-touch-icon.png`);

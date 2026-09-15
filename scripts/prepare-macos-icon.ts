#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

if (process.platform !== 'darwin') {
  console.log('Skipping macOS icon preparation outside macOS.');
  process.exit(0);
}

const root = join(import.meta.dir, '..');
const resources = join(root, 'apps', 'desktop', 'resources');
const source = join(resources, 'hoprel-icon.png');
const iconset = join(resources, '.hoprel-icon.iconset');
const output = join(resources, 'hoprel-icon.icns');

if (!existsSync(source)) throw new Error(`Hoprel PNG icon is missing: ${source}`);

const variants: Array<[filename: string, pixels: number, icnsType: string]> = [
  ['icon_16x16.png', 16, 'icp4'],
  ['icon_16x16@2x.png', 32, 'ic11'],
  ['icon_32x32.png', 32, 'icp5'],
  ['icon_32x32@2x.png', 64, 'ic12'],
  ['icon_128x128.png', 128, 'ic07'],
  ['icon_128x128@2x.png', 256, 'ic13'],
  ['icon_256x256.png', 256, 'ic08'],
  ['icon_256x256@2x.png', 512, 'ic14'],
  ['icon_512x512.png', 512, 'ic09'],
  ['icon_512x512@2x.png', 1024, 'ic10'],
];

function run(command: string[]): void {
  const result = Bun.spawnSync(command, { stdout: 'inherit', stderr: 'inherit' });
  if (result.exitCode !== 0) throw new Error(`Command failed: ${command.join(' ')}`);
}

rmSync(iconset, { force: true, recursive: true });
mkdirSync(iconset, { recursive: true });

for (const [filename, pixels] of variants) {
  run(['sips', '-z', String(pixels), String(pixels), source, '--out', join(iconset, filename)]);
}

// iconutil rejects otherwise valid generated iconsets on some recent macOS
// runners. ICNS is a small big-endian container; modern entries contain the
// PNG bytes directly, so build it deterministically instead of depending on
// iconutil's host-version-specific validation.
const chunks = variants.map(([filename, , type]) => {
  const image = readFileSync(join(iconset, filename));
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, 'ascii');
  header.writeUInt32BE(image.length + header.length, 4);
  return Buffer.concat([header, image]);
});
const body = Buffer.concat(chunks);
const header = Buffer.alloc(8);
header.write('icns', 0, 4, 'ascii');
header.writeUInt32BE(body.length + header.length, 4);
writeFileSync(output, Buffer.concat([header, body]));
rmSync(iconset, { force: true, recursive: true });
if (!existsSync(output)) throw new Error(`macOS icon generation did not produce ${output}`);

console.log(`macOS icon prepared: ${output}`);

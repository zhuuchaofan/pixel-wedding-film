// 逐帧渲染 index.html 并用 ffmpeg 合成 MP4。
// 用法: node render.mjs [输出.mp4] [--from 秒] [--to 秒] [--png 秒,秒,...]
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const outFile = args[0] && !args[0].startsWith('--') ? args[0] : path.join(dir, 'out', 'nobel-2026-icecube.mp4');
const FPS = 30;
// 优先用本地安装的 playwright，否则回退到全局安装
let pw;
try { pw = await import('playwright'); }
catch { pw = createRequire(path.join(execSync('npm root -g').toString().trim(), 'x'))('playwright'); }
const { chromium } = pw;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1320, height: 820 } });
await page.addInitScript(() => { window.__RENDER = true; });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href);
await page.evaluate(() => document.fonts.load('16px Unifont', '中'));
const duration = await page.evaluate(() => window.DURATION);

const grab = t => page.evaluate(t => { window.renderFrame(t); return document.getElementById('screen').toDataURL('image/png'); }, t)
  .then(u => Buffer.from(u.split(',')[1], 'base64'));

const pngs = opt('--png');
if (pngs) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  for (const s of pngs.split(',')) fs.writeFileSync(`${outFile}-${s}.png`, await grab(+s));
  await browser.close();
  process.exit(0);
}

const from = +opt('--from', 0), to = +opt('--to', duration);
fs.mkdirSync(path.dirname(outFile), { recursive: true });
const music = path.join(dir, 'music.wav');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  ...(fs.existsSync(music) ? ['-ss', String(from), '-i', music, '-c:a', 'aac', '-b:a', '160k', '-shortest'] : []),
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outFile],
  { stdio: ['pipe', 'inherit', 'inherit'] });

const total = Math.round((to - from) * FPS);
for (let i = 0; i < total; i++) {
  const buf = await grab(from + i / FPS);
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 300 === 0) console.log(`frame ${i}/${total}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log('done →', outFile);

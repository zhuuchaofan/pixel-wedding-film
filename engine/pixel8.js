// ===== pixel8：8-bit 像素科普短片引擎 =====
// 画面在 320x180 低分辨率画布上绘制，仅用 PICO-8 16 色，最近邻放大 4 倍输出（1280x720）。
// 用法：在页面 <body> 末尾先引入本文件，再写场景函数，最后调用
//   film({ scenes: [[开始秒, 时长, 场景函数], ...], subs: [[开始, 结束, '字幕'], ...], duration })
// 场景函数签名 (t, dur)：t 为场景内时间。画面用 R/px/circle/... 画在 g 上，
// 大字用 B()（每个字点 = 4x4 屏幕像素），小字用 T()（坐标为 640x360，每个字点 = 2x2）。

(() => {
  const css = `
  :root { --bg: #000; --fg: #fff1e8; --accent: #29adff; }
  html, body { margin: 0; background: var(--bg); color: var(--fg); font-family: Unifont, "WenQuanYi Zen Hei Sharp", monospace; }
  main { max-width: 1280px; margin: 0 auto; padding: 16px; box-sizing: border-box; }
  canvas { width: 100%; height: auto; display: block; image-rendering: pixelated; background: #000; }
  .bar { display: flex; gap: 12px; align-items: center; margin-top: 10px; }
  button { font: inherit; background: #1d2b53; color: var(--fg); border: 2px solid var(--accent); padding: 4px 12px; cursor: pointer; }
  input[type=range] { flex: 1; accent-color: var(--accent); }
  #time { min-width: 90px; text-align: right; }`;
  document.head.insertAdjacentHTML('beforeend', `<style>${css}</style>`);
  document.body.insertAdjacentHTML('afterbegin', `<main>
  <canvas id="screen" width="1280" height="720"></canvas>
  <div class="bar"><button id="play">▶ 播放</button><input id="seek" type="range" min="0" max="1" step="0.01" value="0"><span id="time">0.0s</span></div>
  <audio id="music" src="music.wav" preload="auto"></audio>
</main>`);
})();

const W = 320, H = 180, FPS = 30;
const P = ['#000000','#1D2B53','#7E2553','#008751','#AB5236','#5F574F','#C2C3C7','#FFF1E8',
           '#FF004D','#FFA300','#FFEC27','#00E436','#29ADFF','#83769C','#FF77A8','#FFCCAA'];
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const FONT = '16px Unifont, "WenQuanYi Zen Hei Sharp", monospace';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const low = mk(W, H), g = low.getContext('2d');          // 像素画面
const big = mk(W, H), bg = big.getContext('2d');          // 大字（每个字点 = 4x4 屏幕像素）
const txt = mk(W * 2, H * 2), tg = txt.getContext('2d');  // 小字/字幕（每个字点 = 2x2 屏幕像素）

let FR = 0; // 当前帧号，用于确定性的闪烁
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;
function hash(i) { let x = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

function R(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
function px(x, y, c) { R(x, y, 1, 1, c); }
function circle(cx, cy, r, c) { cx = Math.round(cx); cy = Math.round(cy); for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); R(cx - w, cy + y, 2 * w + 1, 1, c); } }
function ring(cx, cy, r, c) { for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; px(cx + Math.cos(t) * r, cy + Math.sin(t) * r, c); } }
function line(x0, y0, x1, y1, c, dash = 0) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) { if (dash && ((i + FR) % dash) < dash / 2) continue; const k = n ? i / n : 0; px(lerp(x0, x1, k), lerp(y0, y1, k), c); } }
// 有序抖动填充：level 0..1，模拟 8-bit 的渐变/半透明
function dither(x, y, w, h, c, level) { g.fillStyle = c; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (bay(i, j) < level) g.fillRect(i, j, 1, 1); }
function sprite(rows, x, y, scale = 1) { rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') R(x + i * scale, y + j * scale, scale, scale, P[parseInt(ch, 16)]); })); }
function stars(seed = 1, n = 70, yMax = H) { for (let i = 0; i < n; i++) { const x = hash(i * 7 + seed) * W | 0, y = hash(i * 13 + seed) * yMax | 0; const tw = (FR + i * 5) % 40; px(x, y, tw < 4 ? P[5] : (hash(i + seed * 9) > .8 ? P[12] : P[6])); } }
const chars = s => [...s];
const typed = (s, t, cps = 14) => chars(s).slice(0, Math.max(0, Math.floor(t * cps))).join('');

function T(s, x, y, c = P[7], al = 'left') { if (!s) return; tg.font = FONT; tg.textAlign = al; tg.textBaseline = 'top'; tg.fillStyle = '#000'; tg.fillText(s, x + 2, y + 2); tg.fillStyle = c; tg.fillText(s, x, y); }
function B(s, x, y, c = P[7], al = 'left') { if (!s) return; bg.font = FONT; bg.textAlign = al; bg.textBaseline = 'top'; bg.fillStyle = '#000'; bg.fillText(s, x + 1, y + 1); bg.fillStyle = c; bg.fillText(s, x, y); }
// 去掉抗锯齿：alpha 二值化，保证文字是硬边像素
function crisp(ctx, w, h) { const im = ctx.getImageData(0, 0, w, h), d = im.data; for (let i = 3; i < d.length; i += 4) d[i] = d[i] >= 110 ? 255 : 0; ctx.putImageData(im, 0, 0); }
function box(x, y, w, h, fill = P[1], border = P[12]) { R(x, y, w, h, border); R(x + 1, y + 1, w - 2, h - 2, P[0]); R(x + 2, y + 2, w - 4, h - 4, fill); }

function earth(cx, cy, r, t) {
  circle(cx, cy, r, P[12]);
  for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) {
    if (x * x + y * y > r * r) continue;
    const u = Math.floor((x + t * 6) / 6), v = Math.floor(y / 6);
    if (hash(u * 31 + v * 977) > .58) R(cx + x, cy + y, 2, 2, P[11]);
  }
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); dither(cx + w - 4, cy + y, 4, 1, P[1], .6); }
}

const SPR = {
  person: ['..f..', '.fff.', '..f..', '.888.', '8.8.8', '..8..', '.1.1.', '.1.1.'],
  star: ['...4...', '...4...', '4444444', '.44444.', '..444..', '.44.44.', '44...44'],
  cross: ['8...8', '.8.8.', '..8..', '.8.8.', '8...8'],
  check: ['.....b', '....b.', 'b..b..', '.bb...', '..b...'],
};
const out = document.getElementById('screen'), oc = out.getContext('2d');

function film({ scenes, subs, duration }) {
  function subtitles(time) {
    const s = subs.find(([a, b]) => time >= a && time < b); if (!s) return;
    tg.font = FONT; const maxW = 612; let lines = [s[2]];
    if (tg.measureText(s[2]).width > maxW) { const cs = chars(s[2]); let cut = cs.length >> 1;
      for (let i = 1; i < cs.length; i++) if (tg.measureText(cs.slice(0, i).join('')).width > tg.measureText(s[2]).width / 2) { cut = i; break; }
      lines = [cs.slice(0, cut).join(''), cs.slice(cut).join('')]; }
    tg.fillStyle = '#000'; tg.fillRect(0, 304, 640, 56);
    tg.fillStyle = P[5]; tg.fillRect(0, 304, 640, 2);
    lines.forEach((l, i) => T(l, 320, lines.length === 1 ? 322 : 310 + i * 22, P[7], 'center'));
  }

  function renderFrame(time) {
    FR = Math.floor(time * FPS);
    bg.clearRect(0, 0, W, H); tg.clearRect(0, 0, W * 2, H * 2);
    const sc = scenes.find(([s, d]) => time >= s && time < s + d) || scenes[scenes.length - 1];
    const lt = time - sc[0]; sc[2](lt, sc[1]);
    subtitles(time);
    crisp(bg, W, H); crisp(tg, W * 2, H * 2);
    oc.imageSmoothingEnabled = false;
    oc.drawImage(low, 0, 0, 1280, 720); oc.drawImage(big, 0, 0, 1280, 720); oc.drawImage(txt, 0, 0, 1280, 720);
    // 场景切换：4x4 拜耳抖动淡入淡出
    const f = clamp(Math.max(1 - lt / .4, 1 - (sc[1] - lt) / .4, time > duration - 1.5 ? (time - duration + 1.5) / 1.5 : 0));
    if (f > 0) { oc.fillStyle = '#000'; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bay(x, y) < f) oc.fillRect(x * 4, y * 4, 4, 4); }
  }
  window.renderFrame = renderFrame; window.DURATION = duration;

  // ---------- 浏览器预览播放器 ----------
  const btn = document.getElementById('play'), seek = document.getElementById('seek'), tEl = document.getElementById('time'), music = document.getElementById('music');
  seek.max = duration;
  let playing = false, t0 = 0, base = 0;
  function now() { return playing ? base + (performance.now() - t0) / 1000 : base; }
  function loop() { let t = now(); if (t >= duration) { t = duration - .01; playing = false; base = 0; btn.textContent = '▶ 播放'; music.pause(); }
    renderFrame(t); seek.value = t; tEl.textContent = t.toFixed(1) + 's'; if (playing) requestAnimationFrame(loop); }
  btn.onclick = () => { if (playing) { base = now(); playing = false; music.pause(); btn.textContent = '▶ 播放'; }
    else { playing = true; t0 = performance.now(); try { music.currentTime = base; music.play().catch(() => {}); } catch (e) {} btn.textContent = '❚❚ 暂停'; requestAnimationFrame(loop); } };
  seek.oninput = () => { base = +seek.value; t0 = performance.now(); try { music.currentTime = base; } catch (e) {} if (!playing) loop(); };
  document.fonts.load(FONT, '中').finally(() => { if (!window.__RENDER) renderFrame(0); });
}

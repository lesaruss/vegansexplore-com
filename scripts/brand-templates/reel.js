// A reel of shots on the locked "Stories and reels" template (9:16, 1080 x 1920; /mocks/brand-kit/templates, canon canon-ve-brand-kit-templates):
// the section-color top with its label, the mark and a two-row headline; the 4:5 scene whole below. Only the picture moves (the KJ reel rule):
// each shot is a still with a slow, smooth zoom, a new shot every SEC seconds (canon-video-shot-pace), 0.4 s crossfades.
// Copied from carousel.js / featured.js: the CSS is read from the template page itself.
//
// Usage (the site served at BASE):
//   node scripts/brand-templates/reel.js --spec spec.json --out dir [--sec 3] [--bed path.mp3]
// spec.json: { "shots": [ { "color": "dk|br|or|pink|md|peach|tint", "label": "Directory", "head": "Row one<br>row two", "art": "4x5.jpg" } ] }
// Writes <out>/reel.mp4 (H.264, 30 fps, faststart), <out>/cover.jpg (the first shot whole) and <out>/shot-NN.jpg (each frame, for review).
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const SPEC = JSON.parse(fs.readFileSync(arg('spec'), 'utf8')), OUT = path.resolve(arg('out', '.')), BASE = arg('base', 'http://localhost:8766');
const SEC = parseFloat(arg('sec', '3')), XF = 0.4, BED = arg('bed');
const ROOT = path.join(__dirname, '../..');
const DIR = path.dirname(path.resolve(arg('spec')));
const file = (f) => { for (const p of [path.resolve(DIR, f), path.join(ROOT, f)]) if (fs.existsSync(p)) return p; throw new Error('no file ' + f); };
const data = (f) => 'data:image/jpeg;base64,' + fs.readFileSync(file(f)).toString('base64');
const DARK = { dk: 1 };

const tpl = fs.readFileSync(path.join(ROOT, 'mocks/brand-kit/templates.html'), 'utf8');
const css = [...tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const frame = (s, i, withArt) => { const dark = DARK[s.color];
  return `<div class="tf s916 fx" id="f${i}"><div class="top" style="--c:var(--${s.color});color:${dark ? '#fff' : 'var(--ink)'}"><span class="sl">${s.label}</span>
  <div class="tl2"><img src="/public/logo-ve-mark-${dark ? 'white' : 'ink'}.svg" alt=""><h5>${s.head}</h5></div></div>
  <div class="art">${withArt ? `<img src="${data(s.art)}" alt="">` : ''}</div></div>`; };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'reel-'));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto(BASE + '/mocks/brand-kit/templates', { waitUntil: 'domcontentloaded' });
  const page = (withArt) => `<!doctype html><html><head><meta charset="utf-8"><base href="${BASE}/"><style>${css}
    html,body{background:transparent!important;padding:0;margin:0} .fx{width:1080px;border-radius:0!important;box-shadow:none!important;margin:0}
    .s916 .art,.fx,.tf{background:transparent!important}</style></head><body>${SPEC.shots.map((s, i) => frame(s, i, withArt)).join('')}</body></html>`;
  // 1. Each shot's frame with the picture (for review and the cover), then the same frame with an empty picture box (the overlay).
  for (const withArt of [true, false]) {
    await p.setContent(page(withArt), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    if (withArt) {
      const bad = await p.evaluate(() => [...document.querySelectorAll('.fx h5')].filter((h) => { const lh = parseFloat(getComputedStyle(h).fontSize) * 1.05;
        return h.scrollWidth > h.clientWidth + 1 || h.getBoundingClientRect().height > lh * 2.2; }).map((h) => h.textContent));
      if (bad.length) { console.error('headline runs over, not written:', bad.join(' | ')); await b.close(); process.exit(2); }
      const top = await p.evaluate(() => { const a = document.querySelector('.fx .art').getBoundingClientRect(), f = document.querySelector('.fx').getBoundingClientRect();
        return { y: Math.round(a.top - f.top), h: Math.round(a.height), w: Math.round(a.width) }; });
      fs.writeFileSync(path.join(tmp, 'art.json'), JSON.stringify(top));
    }
    for (let i = 0; i < SPEC.shots.length; i++) {
      const el = await p.$('#f' + i);
      if (withArt) await el.screenshot({ path: path.join(OUT, `shot-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 88 });
      else await el.screenshot({ path: path.join(tmp, `ov-${i}.png`), omitBackground: true });
    }
  }
  await b.close();
  fs.copyFileSync(path.join(OUT, 'shot-01.jpg'), path.join(OUT, 'cover.jpg'));
  // 2. Each shot: the picture drawn at 2x, a slow zoom (1.00 to 1.06) sampled down so it is smooth, placed in its box, the overlay on top.
  const A = JSON.parse(fs.readFileSync(path.join(tmp, 'art.json'), 'utf8'));
  const D = SEC + XF, F = Math.round(D * 30);
  SPEC.shots.forEach((s, i) => {
    const vf = `[0:v]scale=${A.w * 2}:${A.h * 2}:force_original_aspect_ratio=increase,crop=${A.w * 2}:${A.h * 2},` +
      `zoompan=z='1+0.06*on/${F}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${F}:s=${A.w * 2}x${A.h * 2}:fps=30,scale=${A.w}:${A.h}:flags=lanczos[a];` +
      `color=white:s=1080x1920:r=30:d=${D}[bg];[bg][a]overlay=0:${A.y}[b];[b][1:v]overlay=0:0,format=yuv420p[v]`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-loop', '1', '-t', String(D), '-i', file(s.art), '-loop', '1', '-t', String(D), '-i', path.join(tmp, `ov-${i}.png`),
      '-filter_complex', vf, '-map', '[v]', '-t', String(D), '-r', '30', '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', path.join(tmp, `s${i}.mp4`)]);
  });
  // 3. Crossfade the shots, then the bed under it (fade in and out), web encode.
  const n = SPEC.shots.length, ins = [];
  for (let i = 0; i < n; i++) ins.push('-i', path.join(tmp, `s${i}.mp4`));
  let fc = '', last = '[0:v]';
  for (let i = 1; i < n; i++) { const o = i === n - 1 ? '[v]' : `[x${i}]`; fc += `${last}[${i}:v]xfade=transition=fade:duration=${XF}:offset=${(i * SEC).toFixed(2)}${o};`; last = o; }
  const total = n * SEC + XF;
  const args = ['-v', 'error', '-y', ...ins];
  if (BED) args.push('-i', file(BED));
  fc = n === 1 ? '[0:v]null[v]' : fc.replace(/;$/, '');
  if (BED) fc += `;[${n}:a]atrim=0:${total},afade=t=in:d=0.5,afade=t=out:st=${total - 1.2}:d=1.2,volume=0.55[a]`;
  args.push('-filter_complex', fc, '-map', '[v]');
  if (BED) args.push('-map', '[a]', '-c:a', 'aac', '-b:a', '160k');
  args.push('-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-t', String(total), path.join(OUT, 'reel.mp4'));
  execFileSync('ffmpeg', args);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', path.join(OUT, 'reel.mp4'), total.toFixed(1) + ' s,', n, 'shots');
})();

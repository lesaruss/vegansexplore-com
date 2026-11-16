#!/usr/bin/env node
/* look-check.js: the old look cannot ship (brand kit part 5, Web; /mocks/brand-kit/web; canon canon-ve-brand-kit-web;
 * error registry UI-BUILT-IN-OLD-LOOK). Sean, 2026-11-16: "this is happening a lot. And I think it's just because we don't have
 * anything locked into place to enforce it."
 *
 * Checks every page changed against main (commits not yet on main, staged, unstaged and new files):
 *   1. A NEW page is on the kit: it links /public/ve-kit.css, or names its kit parent with data-kit-parent="<parent>"
 *      (welcome-guide, listing, business-dashboard, claim: the parents on the kit that do not use ve-kit.css themselves).
 *   2. A NEW page loads /public/nav.js and /public/footer.js (unless it is on the CLAUDE.md exceptions list).
 *   3. No changed site file ADDS a line with an old-look green (#1f5f22, #16a34a, #2d7d31).
 * Redirect stubs, the archive and the pages that are off nav.js by design are skipped.
 *
 * Run:   node scripts/look-check.js            (exit 1 and the reasons when something fails)
 * Hook:  node scripts/look-check.js --hook     (Claude Code PreToolUse on Bash: blocks a `git push` that fails, exit 2)
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = (() => { try { return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim(); } catch (e) { return process.cwd(); } })();
const KIT_PARENTS = ['welcome-guide', 'listing', 'business-dashboard', 'claim'];
const OLD_GREENS = /#(1f5f22|16a34a|2d7d31)\b/i;
// Off nav.js by design (CLAUDE.md, Nav and footer on every page) or not site pages at all.
const SKIP = [/^archive\//, /^ads\//, /^partners\/pitches\//, /^partners\/community-partner\.html$/, /^app\/index\.html$/, /^offline\.html$/,
  /^business\/site\.html$/, /^business\/podcast-frame\.html$/, /^branddesk-sites\//, /^scripts\//, /^supabase\//, /^docs\//, /node_modules\//,
  /^public\/ve-look(-hubs)?\.css$/, /^email-templates?\//];
const SITE_EXT = /\.(html|js|css)$/i;

function sh(cmd) { try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return ''; } }

function base() {
  for (const ref of ['origin/main', 'main']) {
    const b = sh(`git merge-base HEAD ${ref}`).trim();
    if (b) return b;
  }
  return '';
}

function changed() {
  const b = base();
  const out = new Map(); // path -> 'A' | 'M'
  if (b) {
    sh(`git diff --name-status ${b}`).split('\n').filter(Boolean).forEach(l => {
      const parts = l.split('\t'); const st = parts[0][0]; const p = parts[parts.length - 1];
      if (st === 'D') return;
      out.set(p, st === 'A' || st === 'C' || st === 'R' ? 'A' : 'M');
    });
  }
  sh('git ls-files --others --exclude-standard').split('\n').filter(Boolean).forEach(p => out.set(p, 'A'));
  return { base: b, files: out };
}

function addedLines(file, b, status) {
  if (status === 'A' || !b) {
    try { return fs.readFileSync(path.join(ROOT, file), 'utf8').split('\n').map((t, i) => ({ n: i + 1, t })); } catch (e) { return []; }
  }
  const diff = sh(`git diff -U0 ${b} -- "${file}"`);
  const lines = []; let n = 0;
  diff.split('\n').forEach(l => {
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (h) { n = parseInt(h[1], 10); return; }
    if (l.startsWith('+') && !l.startsWith('+++')) { lines.push({ n, t: l.slice(1) }); n++; }
  });
  return lines;
}

function isStub(src) {
  return src.length < 4000 && /(http-equiv=["']refresh|location\.replace\(|location\.href\s*=)/i.test(src);
}

function check() {
  const { base: b, files } = changed();
  const problems = [];
  for (const [file, st] of files) {
    if (!SITE_EXT.test(file) || SKIP.some(r => r.test(file))) continue;
    let src = '';
    try { src = fs.readFileSync(path.join(ROOT, file), 'utf8'); } catch (e) { continue; }
    if (/\.html$/i.test(file) && st === 'A' && !isStub(src)) {
      const parent = (src.match(/data-kit-parent=["']([^"']+)["']/) || [])[1];
      if (!src.includes('/public/ve-kit.css') && !(parent && KIT_PARENTS.includes(parent))) {
        problems.push(`${file}: a new page that is not on the kit. Link /public/ve-kit.css and build it from /mocks/brand-kit/web` +
          (parent ? ` ("${parent}" is not a kit parent; use one of ${KIT_PARENTS.join(', ')})` : '') + '.');
      }
      if (!src.includes('/public/nav.js') || !src.includes('/public/footer.js')) {
        problems.push(`${file}: a new page without /public/nav.js and /public/footer.js (CLAUDE.md, Nav and footer on every page).`);
      }
    }
    addedLines(file, b, st).forEach(({ n, t }) => {
      const m = t.match(OLD_GREENS);
      if (m) problems.push(`${file}:${n}: adds the old-look green ${m[0]}. Use the kit colors (/public/ve-kit.css, --k-dk #2D5C27 and the rest).`);
    });
  }
  return problems;
}

function report(problems) {
  return ['The look check refused this (brand kit part 5, /mocks/brand-kit/web; canon canon-ve-brand-kit-web):', ...problems.slice(0, 40).map(p => '  - ' + p),
    problems.length > 40 ? `  ...and ${problems.length - 40} more` : '', 'Fix these, then push again.'].filter(Boolean).join('\n');
}

if (process.argv.includes('--hook')) {
  let raw = '';
  process.stdin.on('data', d => { raw += d; });
  process.stdin.on('end', () => {
    let cmd = '';
    try { cmd = (JSON.parse(raw).tool_input || {}).command || ''; } catch (e) { process.exit(0); }
    if (!/\bgit\s+push\b/.test(cmd)) process.exit(0);
    const problems = check();
    if (!problems.length) process.exit(0);
    process.stderr.write(report(problems) + '\n');
    process.exit(2);
  });
} else {
  const problems = check();
  if (problems.length) { console.error(report(problems)); process.exit(1); }
  console.log('Look check: every changed page is on the kit.');
}

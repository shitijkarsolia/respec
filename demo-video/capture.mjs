// Captures the real Respec app as per-scene clips for the HyperFrames demo video.
// Drives http://localhost:3000 in light mode, suppresses the guided tour for clean
// canvases, injects a visible cursor + click ripples, and hides the Next dev badge.
//
// Run: THEME=light RAWDIR=assets/raw-light node capture.mjs
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire('/home/user/respec/respec/node_modules/_.js');
const { chromium } = require('playwright');

const BASE = 'http://localhost:3000';
const THEME = process.env.THEME === 'dark' ? 'dark' : 'light';
const OUT = path.resolve(process.env.RAWDIR || 'assets/raw-light');
fs.mkdirSync(OUT, { recursive: true });
const SIZE = { width: 1920, height: 1080 };

// NOTE: addInitScript runs before <html> exists, so all DOM work is deferred to
// an `ensure()` that also re-runs on an interval — this keeps dark mode on (React
// strips the class on the home route), keeps the tour-hiding CSS + cursor present.
const initScript = (theme) => {
  try {
    sessionStorage.setItem('respec-demo-tour-dismissed', 'true');
    localStorage.setItem('respec-theme', theme);
  } catch (e) {}
  const CSS = `
    nextjs-portal,[data-nextjs-toolbar],#__next-build-watcher,[data-next-mark],[data-nextjs-dev-tools-button]{display:none!important}
    [class~="z-[70]"],[data-tour="demo-guide"]{display:none!important}
    #hf-cursor{position:fixed;z-index:2147483647;width:24px;height:24px;margin:-2px 0 0 -2px;pointer-events:none;left:-100px;top:-100px}
    #hf-cursor svg{filter:drop-shadow(0 3px 5px rgba(0,0,0,.5))}
    .hf-ripple{position:fixed;z-index:2147483646;border:2px solid rgba(16,185,129,.95);border-radius:50%;pointer-events:none;width:10px;height:10px;margin:-5px 0 0 -5px;animation:hfr .55s ease-out forwards}
    @keyframes hfr{from{transform:scale(1);opacity:.95}to{transform:scale(8);opacity:0}}`;
  const curFill = theme === 'dark' ? '#fff' : '#111';
  const curStroke = theme === 'dark' ? '#111' : '#fff';
  const ensure = () => {
    const de = document.documentElement;
    if (!de) return;
    if (theme === 'dark') de.classList.add('dark'); else de.classList.remove('dark');
    if (!document.getElementById('hf-style')) {
      const s = document.createElement('style');
      s.id = 'hf-style';
      s.textContent = CSS;
      (document.head || de).appendChild(s);
    }
    if (document.body && !document.getElementById('hf-cursor')) {
      const cur = document.createElement('div');
      cur.id = 'hf-cursor';
      cur.innerHTML =
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="' + curFill + '" stroke="' + curStroke + '" stroke-width="1.4" stroke-linejoin="round"><path d="M4 2l16 8-7 1.8L9.5 20z"/></svg>';
      document.body.appendChild(cur);
    }
  };
  ensure();
  document.addEventListener('DOMContentLoaded', ensure);
  setInterval(ensure, 200);
  addEventListener('mousemove', (e) => {
    const c = document.getElementById('hf-cursor');
    if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; }
  }, true);
  addEventListener('mousedown', (e) => {
    if (!document.body) return;
    const r = document.createElement('div');
    r.className = 'hf-ripple';
    r.style.left = e.clientX + 'px';
    r.style.top = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 560);
  }, true);
};

const ONLY = process.argv.slice(2); // e.g. `node capture.mjs review` runs one scene
let browser;
async function scene(name, demoId, fn) {
  if (ONLY.length && !ONLY.includes(name)) return;
  const ctx = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: OUT, size: SIZE },
    deviceScaleFactor: 1,
    colorScheme: THEME,
  });
  await ctx.addInitScript(initScript, THEME);
  if (demoId) await ctx.addInitScript((id) => { try { sessionStorage.setItem('respec-demo-id', id); } catch (e) {} }, demoId);
  const page = await ctx.newPage();
  page.setDefaultTimeout(9000); // fail fast so a missed selector can't hang 30s
  // start cursor centered
  await page.mouse.move(SIZE.width / 2, SIZE.height / 2);
  try {
    await fn(page);
  } catch (e) {
    console.log(`  [${name}] WARN:`, e.message.split('\n')[0]);
  }
  await ctx.close();
  const dest = path.join(OUT, `${name}.webm`);
  await page.video().saveAs(dest);
  console.log('captured:', name, '→', dest);
}

const glide = async (page, x, y, steps = 28) => { await page.mouse.move(x, y, { steps }); };
const toEl = async (page, sel, { steps = 28, dx = 0, dy = 0 } = {}) => {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error('no box for ' + sel);
  await glide(page, b.x + b.width / 2 + dx, b.y + b.height / 2 + dy, steps);
  return b;
};
const dwell = (page, ms) => page.waitForTimeout(ms);

(async () => {
  browser = await chromium.launch();

  // 1) HOME — hero + picker -------------------------------------------------
  await scene('home', 'url-shortener', async (page) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await dwell(page, 1200);
    await glide(page, 1180, 470, 30);            // drift toward the "Launch demo" CTA
    await dwell(page, 1200);
    await page.evaluate(() => window.scrollTo({ top: 380, behavior: 'smooth' }));
    await dwell(page, 1100);
    await page.getByRole('radio', { name: /URL Shortener/ }).hover().catch(() => {});
    await dwell(page, 1400);
    await page.getByRole('radio', { name: /Realtime Chat/ }).hover().catch(() => {});
    await dwell(page, 1500);
  });

  // 2) CANVAS REVEAL (clean, streams in) ------------------------------------
  await scene('reveal', 'url-shortener', async (page) => {
    await page.goto(BASE + '/canvas', { waitUntil: 'domcontentloaded' });
    await dwell(page, 8500);                      // wait through load + streaming reveal
    await glide(page, 960, 540, 24);
    await dwell(page, 900);
  });

  // 3) HOVER-TO-TRACE -------------------------------------------------------
  await scene('trace', 'url-shortener', async (page) => {
    await page.goto(BASE + '/canvas', { waitUntil: 'domcontentloaded' });
    await dwell(page, 4200);
    await toEl(page, '.react-flow__node[data-id="FR-1.1"]', { steps: 34 });
    await dwell(page, 2600);                      // links light up, rest dims
    await toEl(page, '.react-flow__node[data-id="FR-2.1"]', { steps: 30 }).catch(() => {});
    await dwell(page, 2400);
  });

  // 4) AGENT RAIL + FLAG ----------------------------------------------------
  await scene('rail', 'realtime-chat', async (page) => {
    await page.goto(BASE + '/canvas', { waitUntil: 'domcontentloaded' });
    await dwell(page, 4200);
    await glide(page, 1760, 360, 30);             // into the agent rail
    await dwell(page, 2200);
    await toEl(page, '.react-flow__node[data-id="T-7"]', { steps: 30 }).catch(() => {}); // flagged task
    await dwell(page, 2400);
  });

  // 5) REVIEW LOOP: annotate -> request changes -> approve -> handoff --------
  await scene('review', 'pomodoro', async (page) => {
    await page.goto(BASE + '/canvas', { waitUntil: 'domcontentloaded' });
    await dwell(page, 3600);
    // Fit the whole graph so the flagged task T-8 (lower in the column) is on-screen.
    await page.locator('.react-flow__controls-fitview').click().catch(() => {});
    await dwell(page, 1400);
    // click the flagged task T-8
    const b = await toEl(page, '.react-flow__node[data-id="T-8"]', { steps: 32 });
    await dwell(page, 500);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await dwell(page, 1100);                      // annotation popover opens
    await page.getByRole('button', { name: 'clarify' }).click().catch(() => {});
    await dwell(page, 700);
    const ta = await page.getByPlaceholder('Add your annotation...').boundingBox().catch(() => null);
    if (ta) { await glide(page, ta.x + 120, ta.y + 24, 22); await page.getByPlaceholder('Add your annotation...').click(); }
    await page.keyboard.type('Should streak badges map to a requirement, or move to a later milestone?', { delay: 26 });
    await dwell(page, 700);
    await page.getByRole('button', { name: 'Submit' }).click().catch(() => {});
    await dwell(page, 1300);
    // request changes -> feedback modal
    await page.getByRole('button', { name: /Request Changes/ }).click().catch(() => {});
    await dwell(page, 2600);                      // feedback reveals line-by-line
    await page.getByRole('button', { name: 'Close' }).first().click().catch(() => {});
    await dwell(page, 800);
    // approve -> confetti -> handoff modal
    const ap = await page.getByRole('button', { name: 'Approve' }).first().boundingBox().catch(() => null);
    if (ap) { await glide(page, ap.x + ap.width / 2, ap.y + ap.height / 2, 24); }
    await page.getByRole('button', { name: 'Approve' }).first().click().catch(() => {});
    await dwell(page, 3200);                      // confetti + handoff modal
  });

  await browser.close();
  console.log('ALL SCENES CAPTURED');
})().catch((e) => { console.error(e); process.exit(1); });

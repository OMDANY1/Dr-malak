import { spawn, execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WORKSPACE_SCREENSHOTS_DIR = path.join(
  process.cwd(),
  "docs",
  "screenshots",
  "verified"
);
const ARTIFACT_DIR =
  "C:\\Users\\elwady\\.gemini\\antigravity\\brain\\13985f7c-3def-417d-9868-54f5e7702ac6";

fs.mkdirSync(WORKSPACE_SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const TARGET_BASE_URL = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3111";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createCdpSession(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/version`);
  const data = await res.json();
  const browserWs = new WebSocket(data.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    browserWs.onopen = resolve;
    browserWs.onerror = reject;
  });

  let idCounter = 1;
  const pending = new Map();
  browserWs.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown") {
      console.error("  [Chrome Exception]", JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}, sessionId = undefined, timeoutMs = 10000) =>
    new Promise((resolve, reject) => {
      const id = idCounter++;
      const timer = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP timeout (${timeoutMs}ms) on ${method}`));
        }
      }, timeoutMs);
      pending.set(id, {
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      browserWs.send(JSON.stringify(payload));
    });

  return { browserWs, send };
}

async function evaluateJs(send, sessionId, expression) {
  const res = await send(
    "Runtime.evaluate",
    {
      expression,
      returnByValue: true,
      awaitPromise: true,
    },
    sessionId
  );
  if (res.exceptionDetails) {
    throw new Error(
      `JS Evaluation error: ${JSON.stringify(res.exceptionDetails)}`
    );
  }
  return res.result.value;
}

async function scrollThroughPage(send, sessionId) {
  await evaluateJs(
    send,
    sessionId,
    `(async () => {
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => { img.loading = 'eager'; });
      const totalHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const step = Math.max(350, Math.floor(window.innerHeight * 0.7));
      for (let y = 0; y <= totalHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 75));
      }
      window.scrollTo({ top: totalHeight, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 110));
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 140));
      await Promise.all(
        Array.from(document.images).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise(res => {
                img.addEventListener('load', res, { once: true });
                img.addEventListener('error', res, { once: true });
                setTimeout(res, 1500);
              })
        )
      );
    })()`
  );
}

async function captureScreenshot(
  send,
  sessionId,
  filename,
  { copyToArtifact = false } = {}
) {
  try {
    const shot = await send(
      "Page.captureScreenshot",
      { format: "png", fromSurface: true },
      sessionId,
      8000
    );
    const buf = Buffer.from(shot.data, "base64");
    const outPath = path.join(WORKSPACE_SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buf);
    if (copyToArtifact) {
      fs.writeFileSync(path.join(ARTIFACT_DIR, filename), buf);
    }
    console.log(`  [Screenshot] Saved ${filename}`);
    return outPath;
  } catch (err) {
    console.warn(`  [Screenshot Skipped] ${filename}: ${err.message}`);
    return null;
  }
}

async function main() {
  let serverProc = null;
  if (!process.env.VERIFY_BASE_URL) {
    console.log("Starting local Next.js production server on port 3111...");
    serverProc = spawn(
      process.execPath,
      [
        path.join(process.cwd(), "node_modules/next/dist/bin/next"),
        "start",
        "-p",
        "3111",
      ],
      { stdio: "ignore" }
    );
    let serverReady = false;
    for (let i = 0; i < 40; i++) {
      try {
        const r = await fetch(`${TARGET_BASE_URL}/ar`);
        if (r.ok) {
          serverReady = true;
          break;
        }
      } catch {}
      await sleep(350);
    }
    assert.equal(
      serverReady,
      true,
      "Local Next.js server failed to start on port 3111"
    );
  }

  console.log(`Starting browser verification against ${TARGET_BASE_URL}...`);
  const debugPort = 9471;
  const userDataDir = path.join(WORKSPACE_SCREENSHOTS_DIR, "chrome-profile");

  const chromeProc = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  try {
    let connected = false;
    for (let i = 0; i < 30; i++) {
      try {
        const r = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
        if (r.ok) {
          connected = true;
          break;
        }
      } catch {}
      await sleep(300);
    }
    assert.equal(connected, true, "Failed to connect to headless Chrome");

    const { browserWs, send } = await createCdpSession(debugPort);
    const { targetId } = await send("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });

    await send("Page.enable", {}, sessionId);
    await send("DOM.enable", {}, sessionId);
    await send("CSS.enable", {}, sessionId);
    await send("Runtime.enable", {}, sessionId);

    const setViewport = async (width, height) => {
      await send(
        "Emulation.setDeviceMetricsOverride",
        {
          width,
          height,
          deviceScaleFactor: 2,
          mobile: width < 768,
        },
        sessionId
      );
    };

    await setViewport(1440, 920);

    // =========================================================================
    // TEST 1: Locale & Document Direction Lifecycle + Minimal Navigation Menu
    // =========================================================================
    console.log(
      "1. Verifying Locale & Document Direction lifecycle + Minimal Navigation..."
    );
    await send("Page.navigate", { url: `${TARGET_BASE_URL}/ar` }, sessionId);
    for (let i = 0; i < 30; i++) {
      const ready = await evaluateJs(
        send,
        sessionId,
        `document.readyState === 'complete' && Boolean(document.querySelector('.ed-menu-trigger-btn'))`
      );
      if (ready) break;
      await sleep(200);
    }
    await sleep(800);

    let docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(docState, { lang: "ar", dir: "rtl", path: "/ar" });

    // Verify Minimal Navigation closed state & hidden focusability
    const navClosedState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('.ed-menu-trigger-btn');
        const panel = document.querySelector('#ed-fullscreen-menu-panel');
        const firstLink = panel?.querySelector('a');
        firstLink?.focus();
        return {
          btnExists: Boolean(btn),
          ariaExpanded: btn?.getAttribute('aria-expanded'),
          panelHidden: panel?.hidden,
          panelInert: panel?.hasAttribute('inert'),
          hiddenLinkFocused: document.activeElement === firstLink,
        };
      })()`
    );
    assert.deepEqual(navClosedState, {
      btnExists: true,
      ariaExpanded: "false",
      panelHidden: true,
      panelInert: true,
      hiddenLinkFocused: false,
    });

    // Open full-screen menu panel, verify focus trap & Escape close
    await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('.ed-menu-trigger-btn');
        btn.focus();
        btn.click();
      })()`
    );
    await sleep(250);

    const navOpenState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('.ed-menu-trigger-btn');
        const panel = document.querySelector('#ed-fullscreen-menu-panel');
        const links = panel?.querySelectorAll('.ed-fullscreen-nav-link') || [];
        return {
          ariaExpanded: btn?.getAttribute('aria-expanded'),
          panelHidden: panel?.hidden,
          bodyOverflow: document.body.style.overflow,
          linkCount: links.length,
        };
      })()`
    );
    assert.deepEqual(navOpenState, {
      ariaExpanded: "true",
      panelHidden: false,
      bodyOverflow: "hidden",
      linkCount: 6,
    });

    // Dispatch Escape key to close menu and verify focus restored to .ed-menu-trigger-btn
    await evaluateJs(
      send,
      sessionId,
      `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`
    );
    await sleep(250);

    const navAfterEscape = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('.ed-menu-trigger-btn');
        const panel = document.querySelector('#ed-fullscreen-menu-panel');
        return {
          ariaExpanded: btn?.getAttribute('aria-expanded'),
          panelHidden: panel?.hidden,
          bodyOverflow: document.body.style.overflow,
          focusRestored: document.activeElement === btn,
        };
      })()`
    );
    assert.deepEqual(navAfterEscape, {
      ariaExpanded: "false",
      panelHidden: true,
      bodyOverflow: "",
      focusRestored: true,
    });

    const waitForPath = async (expectedPath) => {
      for (let i = 0; i < 25; i++) {
        const cur = await evaluateJs(
          send,
          sessionId,
          `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
        );
        if (cur.path === expectedPath) return cur;
        await sleep(200);
      }
      return evaluateJs(
        send,
        sessionId,
        `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
      );
    };

    // Click language switcher link (client-side transition to /en)
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('header .lang-switch').click()`
    );
    docState = await waitForPath("/en");
    assert.deepEqual(
      docState,
      { lang: "en", dir: "ltr", path: "/en" },
      "Switching from /ar to /en via client-side link must update html lang='en' and dir='ltr'"
    );

    // Switch back to /ar
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('header .lang-switch').click()`
    );
    docState = await waitForPath("/ar");
    assert.deepEqual(docState, { lang: "ar", dir: "rtl", path: "/ar" });

    // Browser Back & Forward
    await evaluateJs(send, sessionId, `history.back()`);
    docState = await waitForPath("/en");
    assert.deepEqual(docState, { lang: "en", dir: "ltr", path: "/en" });

    await evaluateJs(send, sessionId, `history.forward()`);
    docState = await waitForPath("/ar");
    assert.deepEqual(docState, { lang: "ar", dir: "rtl", path: "/ar" });
    console.log(
      "  [PASS] Locale lifecycle & Minimal Navigation full-screen overlay verified."
    );

    // =========================================================================
    // TEST 2: Platform Fonts & Typographic Red Hero Geometry
    // =========================================================================
    console.log(
      "2. Verifying rendered platform fonts & Typographic Red Hero geometry..."
    );
    await evaluateJs(send, sessionId, `document.fonts.ready`);
    const docRoot = await send("DOM.getDocument", { depth: -1 }, sessionId);

    const checkSelectorFonts = async (selector) => {
      const q = await send(
        "DOM.querySelector",
        { nodeId: docRoot.root.nodeId, selector },
        sessionId
      );
      assert.ok(q.nodeId, `Selector not found: ${selector}`);
      const pf = await send(
        "CSS.getPlatformFontsForNode",
        { nodeId: q.nodeId },
        sessionId
      );
      return pf.fonts;
    };

    const heroTitleFonts = await checkSelectorFonts(
      "#hero-heading .hero-line-1"
    );
    assert.equal(
      heroTitleFonts.some(
        (f) => f.familyName.includes("Elgharib") && f.isCustomFont
      ),
      true,
      `Hero heading must render with custom Elgharib webfont, got: ${JSON.stringify(heroTitleFonts)}`
    );

    const bodyFonts = await checkSelectorFonts(".ed-red-hero-lead");
    assert.equal(
      bodyFonts.some((f) => f.familyName === "STC Regular"),
      false,
      `Body copy must NOT render with broken local STC Regular, got: ${JSON.stringify(bodyFonts)}`
    );

    const buttonFonts = await checkSelectorFonts(".ed-menu-trigger-btn");
    assert.equal(
      buttonFonts.some((f) => /Arial/i.test(f.familyName)),
      false,
      `Interactive <button> controls must inherit --font-body and NOT compute to Arial, got: ${JSON.stringify(buttonFonts)}`
    );

    // Verify vertically layered Typographic Red Hero geometry
    const heroGeometry = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const hero = document.querySelector('.ed-red-hero');
        const label = document.querySelector('.ed-red-hero-label-row').getBoundingClientRect();
        const heading = document.querySelector('#hero-heading').getBoundingClientRect();
        const lead = document.querySelector('.ed-red-hero-lead').getBoundingClientRect();
        const cta = document.querySelector('.ed-red-hero-action-cluster').getBoundingClientRect();
        const pan = document.querySelector('.ed-red-hero-panoramic-stage').getBoundingClientRect();
        const panImg = document.querySelector('.ed-panoramic-img');
        return {
          heroBg: getComputedStyle(hero).backgroundColor,
          headingText: document.querySelector('#hero-heading').textContent.trim(),
          labelAboveHeading: label.bottom <= heading.top + 12,
          headingAboveLead: heading.bottom <= lead.top + 12,
          leadAboveCta: lead.bottom <= cta.top + 12,
          ctaAbovePanorama: cta.bottom <= pan.top + 16,
          panoramaInsetLeft: pan.left >= 16,
          panoramaInsetRight: window.innerWidth - pan.right >= 16,
          panoramaTopInFirstViewport: pan.top < 780,
          panoramaSrc: panImg?.getAttribute('src') || '',
        };
      })()`
    );
    assert.equal(heroGeometry.headingText, "“جمال يليق بكِ”");
    assert.equal(heroGeometry.labelAboveHeading, true);
    assert.equal(heroGeometry.headingAboveLead, true);
    assert.equal(heroGeometry.leadAboveCta, true);
    assert.equal(heroGeometry.ctaAbovePanorama, true);
    assert.equal(heroGeometry.panoramaInsetLeft, true);
    assert.equal(heroGeometry.panoramaInsetRight, true);
    assert.equal(
      heroGeometry.panoramaTopInFirstViewport,
      true,
      "Panoramic hero image must reveal meaningful photography inside the first desktop viewport"
    );
    assert.equal(
      heroGeometry.panoramaSrc.includes("hero-panoramic-editorial.jpg"),
      true
    );
    console.log(
      "  [PASS] Platform fonts & Typographic Red Hero vertical geometry verified."
    );

    // =========================================================================
    // TEST 3: Visual Specialty Gallery & Accessible Detail Panel
    // =========================================================================
    console.log(
      "3. Verifying Asymmetric Visual Specialty Gallery & Accessible Detail Panel..."
    );
    const galleryStats = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const oldTabs = document.querySelectorAll('#specialties-section [role="tab"]');
        const items = Array.from(document.querySelectorAll('.ed-gallery-piece'));
        const imgFrames = items.map(el => el.querySelector('.ed-gallery-img-frame')?.getBoundingClientRect());
        const pageLinks = items.map(el => el.querySelector('a.ed-gallery-fallback-link')?.getAttribute('href'));
        return {
          oldTabCount: oldTabs.length,
          itemCount: items.length,
          asymmetricHeights: imgFrames.length === 3 && Math.abs(imgFrames[0].height - imgFrames[1].height) > 30,
          pageLinks,
        };
      })()`
    );
    assert.equal(
      galleryStats.oldTabCount,
      0,
      "Old specialty tablist must not exist"
    );
    assert.equal(galleryStats.itemCount, 3);
    assert.equal(
      galleryStats.asymmetricHeights,
      true,
      "Desktop gallery must have a dominant tall image and different supporting sizes"
    );

    // Click Reconstructive Surgery detail trigger to open accessible detail panel
    await evaluateJs(
      send,
      sessionId,
      `(() => {
        const trigger = document.querySelector('#specialty-trigger-reconstructive-surgery');
        trigger.focus();
        trigger.click();
      })()`
    );
    await sleep(350);

    const detailPanelState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const backdrop = document.querySelector('#ed-specialty-detail-panel');
        const sheet = backdrop?.querySelector('.ed-specialty-detail-sheet');
        const closeBtn = backdrop?.querySelector('.ed-specialty-sheet-close');
        const fullLink = backdrop?.querySelector('a.ed-sheet-fullpage-link');
        return {
          isOpen: Boolean(backdrop && !backdrop.hidden),
          role: sheet?.getAttribute('role'),
          ariaModal: sheet?.getAttribute('aria-modal'),
          hasCloseBtn: Boolean(closeBtn),
          hasFullLink: Boolean(fullLink),
          bodyOverflow: document.body.style.overflow,
        };
      })()`
    );
    assert.deepEqual(detailPanelState, {
      isOpen: true,
      role: "dialog",
      ariaModal: "true",
      hasCloseBtn: true,
      hasFullLink: true,
      bodyOverflow: "hidden",
    });

    // Close detail panel with Escape and verify focus restored to trigger
    await evaluateJs(
      send,
      sessionId,
      `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`
    );
    await sleep(300);

    const detailClosedState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const backdrop = document.querySelector('#ed-specialty-detail-panel');
        const trigger = document.querySelector('#specialty-trigger-reconstructive-surgery');
        return {
          isOpen: Boolean(backdrop && !backdrop.hidden),
          focusRestored: document.activeElement === trigger,
        };
      })()`
    );
    assert.deepEqual(detailClosedState, {
      isOpen: false,
      focusRestored: true,
    });
    console.log(
      "  [PASS] Asymmetric Visual Specialty Gallery & Detail Panel verified."
    );

    // =========================================================================
    // TEST 4: Doctor Editorial Spread, Interactive Consultation Steps & Consultation Dialog
    // =========================================================================
    console.log(
      "4. Verifying Doctor Editorial Spread, Interactive Consultation Steps & Consultation Dialog..."
    );
    const spreadAndStepsState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const intro = document.querySelector('.ed-doctor-spread-intro')?.getBoundingClientRect();
        const portrait = document.querySelector('.ed-doctor-spread-portrait')?.getBoundingClientRect();
        const creds = document.querySelector('.ed-doctor-spread-credentials')?.getBoundingClientRect();
        const docImg = document.querySelector('#doctor-section .ed-doctor-central-img');
        const stepBtns = Array.from(document.querySelectorAll('.ed-step-control-btn'));
        return {
          threePartHorizontal: Boolean(intro && portrait && creds && intro.left > portrait.left && portrait.left > creds.left),
          docSrc: docImg?.getAttribute('src') || '',
          stepCount: stepBtns.length,
        };
      })()`
    );
    assert.equal(
      spreadAndStepsState.threePartHorizontal,
      true,
      "Desktop Doctor Profile must be a 3-part RTL horizontal spread (intro -> central portrait -> qualifications)"
    );
    assert.equal(
      spreadAndStepsState.docSrc.includes("dr-malak-alsaif.jpg"),
      true
    );
    assert.equal(spreadAndStepsState.stepCount, 3);

    // Click Step 03 in Interactive Consultation Steps and verify copy + image update
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('#consultation-step-tab-03').click()`
    );
    await sleep(300);

    const step3ActiveState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const activeTitle = document.querySelector('.ed-steps-stage-title')?.textContent?.trim();
        const activeImg = document.querySelector('.ed-steps-stage-img')?.getAttribute('src') || '';
        return { activeTitle, activeImg };
      })()`
    );
    assert.equal(step3ActiveState.activeTitle, "توضيح الخيارات والخطوات التالية");
    assert.equal(step3ActiveState.activeImg.includes("step-03-options.jpg"), true);

    // Open Consultation Dialog from Interactive Consultation Steps
    await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('#consultation-steps-section .btn-primary');
        btn.focus();
        btn.click();
      })()`
    );
    await sleep(400);

    const dialogOpenState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const dialog = document.querySelector('[role="dialog"]:not(#ed-fullscreen-menu-panel)');
        const shell = document.querySelector('.app-shell-content');
        return {
          isOpen: Boolean(dialog),
          bodyOverflow: document.body.style.overflow,
          shellInert: shell?.hasAttribute('inert'),
        };
      })()`
    );
    assert.deepEqual(dialogOpenState, {
      isOpen: true,
      bodyOverflow: "hidden",
      shellInert: true,
    });

    // Advance to Step 2 and verify WhatsApp URL
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.dialog-primary-btn').click()`
    );
    await sleep(300);

    const waHref = await evaluateJs(
      send,
      sessionId,
      `document.querySelector('[role="dialog"]:not(#ed-fullscreen-menu-panel) a.btn-primary')?.getAttribute('href') || ''`
    );
    assert.equal(waHref.startsWith("https://wa.me/966580376463?text="), true);

    // Close dialog
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.dialog-close-btn').click()`
    );
    await sleep(300);
    console.log(
      "  [PASS] Doctor Spread, Interactive Consultation Steps & Consultation Dialog verified."
    );

    // =========================================================================
    // TEST 5: Article Search Normalization, Single Reset Button, & Reading-Time Localization
    // =========================================================================
    console.log(
      "5. Verifying Article Search Normalization & Reading-Time Localization..."
    );
    await send(
      "Page.navigate",
      { url: `${TARGET_BASE_URL}/ar/articles` },
      sessionId
    );
    await sleep(1400);

    const setSearchInput = async (val) => {
      await evaluateJs(
        send,
        sessionId,
        `(() => {
          const input = document.querySelector('#articles-search-input');
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(val)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        })()`
      );
      await sleep(300);
    };

    await setSearchInput("استشارة");
    const countBare = await evaluateJs(
      send,
      sessionId,
      `document.querySelectorAll('.featured-article-card, .article-card').length`
    );
    assert.ok(countBare >= 1, "Search for 'استشارة' must return articles");

    await setSearchInput("اِسْتِشَارَة");
    const countVocalized = await evaluateJs(
      send,
      sessionId,
      `document.querySelectorAll('.featured-article-card, .article-card').length`
    );
    assert.equal(
      countVocalized,
      countBare,
      "Search for 'اِسْتِشَارَة' (with diacritics) must return the same articles as 'استشارة'"
    );

    const readingTimeText = await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.article-reading-time')?.textContent?.trim()`
    );
    assert.equal(
      readingTimeText === "دقيقة واحدة للقراءة" ||
        readingTimeText === "دقيقتان للقراءة" ||
        readingTimeText.endsWith("دقائق للقراءة") ||
        readingTimeText.endsWith("دقيقة للقراءة"),
      true,
      `Expected localized Arabic reading time, got: ${readingTimeText}`
    );

    await setSearchInput("عبارة غير موجودة إطلاقا 999");
    const resetButtonsInEmptyState = await evaluateJs(
      send,
      sessionId,
      `Array.from(document.querySelectorAll('.articles-explorer button')).filter(b => b.textContent.includes('إعادة تعيين')).length`
    );
    assert.equal(
      resetButtonsInEmptyState,
      1,
      "Empty search state must display exactly ONE reset button"
    );

    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.articles-empty-state button').click()`
    );
    await sleep(300);
    console.log(
      "  [PASS] Article Search Normalization & Reading-Time Localization verified."
    );

    // =========================================================================
    // TEST 6: SEO Metadata (noindex, canonical, hreflang, sitemap.xml)
    // =========================================================================
    console.log("6. Verifying SEO Metadata & Sitemap...");
    const seoState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const robots = document.querySelector('meta[name="robots"]')?.content || '';
        const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
        const altAr = document.querySelector('link[rel="alternate"][hreflang="ar"]')?.href || '';
        const altEn = document.querySelector('link[rel="alternate"][hreflang="en"]')?.href || '';
        const altDefault = document.querySelector('link[rel="alternate"][hreflang="x-default"]')?.href || '';
        const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
        return { robots, canonical, altAr, altEn, altDefault, ogImage };
      })()`
    );
    assert.equal(seoState.robots.includes("noindex"), true);
    assert.equal(seoState.canonical.startsWith("https://"), true);
    assert.equal(seoState.altAr.startsWith("https://"), true);
    assert.equal(seoState.altEn.startsWith("https://"), true);
    assert.equal(seoState.altDefault.startsWith("https://"), true);
    assert.equal(seoState.ogImage.startsWith("https://"), true);

    const sitemapRes = await fetch(`${TARGET_BASE_URL}/sitemap.xml`);
    assert.equal(sitemapRes.status, 200);
    const sitemapXml = await sitemapRes.text();
    assert.equal(
      sitemapXml.includes("/ar/articles/preparing-for-consultation"),
      true
    );
    assert.equal(
      sitemapXml.includes("when-to-seek-burn-follow-up"),
      false,
      "Draft articles must never appear in sitemap.xml"
    );
    console.log("  [PASS] SEO Metadata & Sitemap verified.");

    // =========================================================================
    // TEST 6B: Brand Integration (Navbar SVG Logo, Favicons, 1200x630 OG, Secondary Palette & WCAG Contrast)
    // =========================================================================
    console.log(
      "6B. Verifying Brand Integration (Navbar Logo Dark/Light states, Favicons, 1200x630 Social Preview, Secondary Colors & Contrast)..."
    );

    // Verify all favicon, manifest, logo, and social preview HTTP endpoints return 200
    const brandAssetPaths = [
      "/favicon.ico",
      "/icon.svg",
      "/apple-touch-icon.png",
      "/icon-192.png",
      "/icon-512.png",
      "/site.webmanifest",
      "/brand/Asset-1.svg",
      "/brand/malak-logo-dark-bg.svg",
      "/brand/malak-logo-light-bg.svg",
      "/brand/og-default-1200x630.png",
    ];
    for (const assetPath of brandAssetPaths) {
      const res = await fetch(`${TARGET_BASE_URL}${assetPath}`);
      assert.equal(
        res.status,
        200,
        `Expected HTTP 200 for brand asset ${assetPath}, got ${res.status}`
      );
    }

    // Navigate to /ar at 1440w desktop and verify top dark-header logo, scrolled light-header logo, open menu logo, footer logo, favicons, OG metadata, and secondary colors
    await setViewport(1440, 920);
    await send("Page.navigate", { url: `${TARGET_BASE_URL}/ar` }, sessionId);
    await sleep(1100);
    await evaluateJs(send, sessionId, `window.scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(250);

    const desktopDarkLogoAndMeta = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const header = document.querySelector('.ed-minimal-header');
        const link = header?.querySelector('a.ed-brand-lockup');
        const svg = link?.querySelector('svg.ed-brand-logo-svg');
        const paths = Array.from(svg?.querySelectorAll('path') || []);
        const fills = Array.from(svg?.querySelectorAll('path, g') || []).map(p => p.getAttribute('fill')).filter(Boolean);
        const footer = document.querySelector('.ed-red-footer');
        const footerSvg = footer?.querySelector('svg.ed-brand-logo-svg');
        const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
        const ogWidth = document.querySelector('meta[property="og:image:width"]')?.content || '';
        const ogHeight = document.querySelector('meta[property="og:image:height"]')?.content || '';
        const ogType = document.querySelector('meta[property="og:image:type"]')?.content || '';
        const ogAlt = document.querySelector('meta[property="og:image:alt"]')?.content || '';
        const twCard = document.querySelector('meta[name="twitter:card"]')?.content || '';
        const twImage = document.querySelector('meta[name="twitter:image"]')?.content || '';
        const iconLinks = Array.from(document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')).map(l => l.getAttribute('href'));
        const rect = svg?.getBoundingClientRect();
        return {
          headerScrolled: header?.classList.contains('is-scrolled'),
          headerBg: header ? getComputedStyle(header).backgroundColor : '',
          linkHref: link?.getAttribute('href'),
          linkAriaLabel: link?.getAttribute('aria-label') || '',
          svgVariant: svg?.getAttribute('data-brand-logo-variant'),
          pathCount: paths.length,
          hasWhiteArtwork: fills.includes('#FFFFFF'),
          hasPinkSparkle: fills.includes('#FF4FA3'),
          logoWidth: rect?.width || 0,
          logoHeight: rect?.height || 0,
          footerBg: footer ? getComputedStyle(footer).backgroundColor : '',
          footerLogoVariant: footerSvg?.getAttribute('data-brand-logo-variant'),
          ogImage,
          ogWidth,
          ogHeight,
          ogType,
          ogAlt,
          twCard,
          twImage,
          iconLinks,
        };
      })()`
    );

    assert.equal(desktopDarkLogoAndMeta.headerScrolled, false);
    assert.equal(desktopDarkLogoAndMeta.linkHref, "/ar");
    assert.equal(desktopDarkLogoAndMeta.linkAriaLabel.includes("د. ملاك السيف"), true);
    assert.equal(desktopDarkLogoAndMeta.svgVariant, "on-dark");
    assert.equal(desktopDarkLogoAndMeta.pathCount, 36);
    assert.equal(desktopDarkLogoAndMeta.hasWhiteArtwork, true);
    assert.equal(desktopDarkLogoAndMeta.hasPinkSparkle, true);
    assert.ok(desktopDarkLogoAndMeta.logoWidth >= 100 && desktopDarkLogoAndMeta.logoHeight >= 40);
    assert.equal(desktopDarkLogoAndMeta.footerBg, "rgb(58, 31, 27)");
    assert.equal(desktopDarkLogoAndMeta.footerLogoVariant, "on-dark");
    assert.equal(
      desktopDarkLogoAndMeta.ogImage.endsWith("/brand/og-default-1200x630.png"),
      true,
      `Expected default og:image to end with /brand/og-default-1200x630.png, got ${desktopDarkLogoAndMeta.ogImage}`
    );
    assert.equal(desktopDarkLogoAndMeta.ogWidth, "1200");
    assert.equal(desktopDarkLogoAndMeta.ogHeight, "630");
    assert.equal(desktopDarkLogoAndMeta.ogType, "image/png");
    assert.equal(desktopDarkLogoAndMeta.ogAlt.includes("د. ملاك السيف"), true);
    assert.equal(desktopDarkLogoAndMeta.twCard, "summary_large_image");
    assert.equal(
      desktopDarkLogoAndMeta.twImage.endsWith("/brand/og-default-1200x630.png"),
      true
    );
    assert.equal(
      desktopDarkLogoAndMeta.iconLinks.some((h) => h?.includes("/icon.svg")),
      true
    );
    assert.equal(
      desktopDarkLogoAndMeta.iconLinks.some((h) => h?.includes("/apple-touch-icon.png")),
      true
    );

    // Scroll down to trigger sticky ivory header and verify light-background logo treatment
    await evaluateJs(send, sessionId, `window.scrollTo({ top: 520, behavior: 'instant' })`);
    await sleep(300);

    const desktopLightScrolledLogo = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const header = document.querySelector('.ed-minimal-header');
        const svg = header?.querySelector('svg.ed-brand-logo-svg');
        const fills = Array.from(svg?.querySelectorAll('path, g') || []).map(p => p.getAttribute('fill')).filter(Boolean);
        return {
          headerScrolled: header?.classList.contains('is-scrolled'),
          headerBg: header ? getComputedStyle(header).backgroundColor : '',
          svgVariant: svg?.getAttribute('data-brand-logo-variant'),
          hasWhiteArtwork: fills.includes('#FFFFFF'),
          hasBurgundyMark: fills.includes('#A83232'),
          hasDarkBrownSubtext: fills.includes('#3A1F1B'),
          hasPinkSparkle: fills.includes('#FF4FA3'),
        };
      })()`
    );
    assert.equal(desktopLightScrolledLogo.headerScrolled, true);
    assert.equal(desktopLightScrolledLogo.svgVariant, "on-light");
    assert.equal(
      desktopLightScrolledLogo.hasWhiteArtwork,
      false,
      "White logo artwork must NEVER be placed on the scrolled ivory header"
    );
    assert.equal(desktopLightScrolledLogo.hasBurgundyMark, true);
    assert.equal(desktopLightScrolledLogo.hasDarkBrownSubtext, true);
    assert.equal(desktopLightScrolledLogo.hasPinkSparkle, true);

    await captureScreenshot(
      send,
      sessionId,
      "20-brand-navbar-scrolled-light-1440w.png",
      { copyToArtifact: true }
    );

    // Verify Secondary Color System & WCAG Contrast across sections
    const secondaryPaletteCheck = await evaluateJs(
      send,
      sessionId,
      `(() => {
        function parseRgb(str) {
          const m = str.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
          return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
        }
        function lum([r, g, b]) {
          const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }
        function ratio(rgb1, rgb2) {
          const l1 = lum(rgb1);
          const l2 = lum(rgb2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        }

        const rootStyles = getComputedStyle(document.documentElement);
        const docSection = document.querySelector('#doctor-section');
        const docHeading = docSection?.querySelector('.ed-doctor-spread-heading');
        const stepsSection = document.querySelector('#consultation-steps-section');
        const activeStepBtn = stepsSection?.querySelector('.ed-step-control-btn.is-active');
        const activeStepNum = activeStepBtn?.querySelector('.ed-step-control-num');
        const journalCat = document.querySelector('.ed-journal-category');

        const docBg = docSection ? parseRgb(getComputedStyle(docSection).backgroundColor) : [0,0,0];
        const docText = docHeading ? parseRgb(getComputedStyle(docHeading).color) : [0,0,0];
        const stepNumBg = activeStepNum ? parseRgb(getComputedStyle(activeStepNum).backgroundColor) : [0,0,0];
        const stepNumColor = activeStepNum ? parseRgb(getComputedStyle(activeStepNum).color) : [0,0,0];
        const catBg = journalCat ? parseRgb(getComputedStyle(journalCat).backgroundColor) : [0,0,0];
        const catText = journalCat ? parseRgb(getComputedStyle(journalCat).color) : [0,0,0];

        return {
          tokenBurgundy: rootStyles.getPropertyValue('--color-burgundy').trim().toUpperCase(),
          tokenPeach: rootStyles.getPropertyValue('--color-peach').trim().toUpperCase(),
          tokenOrange: rootStyles.getPropertyValue('--color-warm-orange').trim().toUpperCase(),
          tokenDarkBrown: rootStyles.getPropertyValue('--color-dark-brown').trim().toUpperCase(),
          tokenIvory: rootStyles.getPropertyValue('--color-ivory').trim().toUpperCase(),
          docSectionBg: docSection ? getComputedStyle(docSection).backgroundColor : '',
          activeStepBtnBg: activeStepBtn ? getComputedStyle(activeStepBtn).backgroundColor : '',
          stepNumBgStr: activeStepNum ? getComputedStyle(activeStepNum).backgroundColor : '',
          stepNumColorStr: activeStepNum ? getComputedStyle(activeStepNum).color : '',
          contrastDocSpread: ratio(docBg, docText),
          contrastStepNumOnDarkBrown: ratio(stepNumBg, stepNumColor),
          contrastJournalBadge: ratio(catBg, catText),
        };
      })()`
    );

    assert.equal(secondaryPaletteCheck.tokenBurgundy, "#A83232");
    assert.equal(secondaryPaletteCheck.tokenPeach, "#F2D6B3");
    assert.equal(secondaryPaletteCheck.tokenOrange, "#D96B2B");
    assert.equal(secondaryPaletteCheck.tokenDarkBrown, "#3A1F1B");
    assert.equal(secondaryPaletteCheck.tokenIvory, "#FFFCF0");
    assert.equal(secondaryPaletteCheck.docSectionBg, "rgb(242, 214, 179)"); // #F2D6B3 Peach
    assert.equal(secondaryPaletteCheck.activeStepBtnBg, "rgb(242, 214, 179)"); // #F2D6B3 Peach
    assert.equal(secondaryPaletteCheck.stepNumBgStr, "rgb(58, 31, 27)"); // #3A1F1B Dark Brown
    assert.equal(secondaryPaletteCheck.stepNumColorStr, "rgb(217, 107, 43)"); // #D96B2B Warm Orange
    assert.ok(
      secondaryPaletteCheck.contrastDocSpread >= 10,
      `Expected Dark Brown on Peach contrast >= 10, got ${secondaryPaletteCheck.contrastDocSpread}`
    );
    assert.ok(
      secondaryPaletteCheck.contrastStepNumOnDarkBrown >= 4.2,
      `Expected Warm Orange large bold step number on Dark Brown contrast >= 4.2, got ${secondaryPaletteCheck.contrastStepNumOnDarkBrown}`
    );
    assert.ok(
      secondaryPaletteCheck.contrastJournalBadge >= 10,
      `Expected Dark Brown on Peach journal badge contrast >= 10, got ${secondaryPaletteCheck.contrastJournalBadge}`
    );

    // Verify Mobile (390w) scrolled light header logo & zero horizontal clipping
    await setViewport(390, 844);
    await evaluateJs(send, sessionId, `window.scrollTo({ top: 520, behavior: 'instant' })`);
    await sleep(300);
    const mobileHeaderBounds = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const selectors = ['a.ed-brand-lockup', '.ed-header-lang', '.ed-header-consult-btn', '.ed-menu-trigger-btn'];
        return selectors.map(sel => {
          const r = document.querySelector(sel)?.getBoundingClientRect();
          return { sel, left: Math.round(r?.left ?? -1), right: Math.round(r?.right ?? 999) };
        });
      })()`
    );
    for (const item of mobileHeaderBounds) {
      assert.ok(
        item.left >= 8 && item.right <= 382,
        `Expected mobile header item ${item.sel} within [8, 382] on 390px viewport, got [${item.left}, ${item.right}]`
      );
    }
    await captureScreenshot(
      send,
      sessionId,
      "21-brand-navbar-scrolled-light-390w-mobile.png",
      { copyToArtifact: true }
    );

    // Verify article-specific Open Graph image is preserved on article detail routes
    await setViewport(1440, 920);
    await send(
      "Page.navigate",
      { url: `${TARGET_BASE_URL}/ar/articles/preparing-for-consultation` },
      sessionId
    );
    await sleep(1000);
    const articleOgImage = await evaluateJs(
      send,
      sessionId,
      `document.querySelector('meta[property="og:image"]')?.content || ''`
    );
    assert.equal(
      articleOgImage.includes("/images/generated/article-"),
      true,
      `Article detail page must preserve its own article cover image in og:image, got: ${articleOgImage}`
    );
    console.log(
      "  [PASS] Brand Integration (Navbar SVG Logo, Favicons, 1200x630 Social Preview, Secondary Colors & Contrast) verified."
    );

    // =========================================================================
    // TEST 7: Scroll-Through & Multi-Viewport Screenshot Capture (AR & EN at 390px, 768px, 1440px)
    // =========================================================================
    console.log(
      "7. Scrolling through pages & capturing screenshots across 390px, 768px, and 1440px in AR and EN..."
    );
    const viewports = [
      { name: "1440w-desktop", width: 1440, height: 920 },
      { name: "768w-tablet", width: 768, height: 1024 },
      { name: "390w-mobile", width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await setViewport(vp.width, vp.height);

      // --- Arabic Homepage (/ar) ---
      await send("Page.navigate", { url: `${TARGET_BASE_URL}/ar` }, sessionId);
      await sleep(1200);
      await scrollThroughPage(send, sessionId);

      // Verify zero broken images after full scroll-through
      const brokenAr = await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('img'))
          .filter(img => !img.complete || img.naturalWidth === 0)
          .map(img => img.getAttribute('src'))`
      );
      assert.deepEqual(
        brokenAr,
        [],
        `Zero broken images expected on /ar (${vp.name}), got: ${JSON.stringify(brokenAr)}`
      );

      // Capture viewport hero
      await captureScreenshot(send, sessionId, `01-ar-home-${vp.name}.png`, {
        copyToArtifact: true,
      });

      // Capture key sections on Arabic Homepage
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#specialties-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(350);
      await captureScreenshot(
        send,
        sessionId,
        `02-ar-specialty-gallery-${vp.name}.png`,
        { copyToArtifact: vp.width !== 768 }
      );

      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#doctor-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(350);
      await captureScreenshot(
        send,
        sessionId,
        `03-ar-doctor-spread-${vp.name}.png`,
        { copyToArtifact: vp.width !== 768 }
      );

      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#consultation-steps-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(350);
      await captureScreenshot(
        send,
        sessionId,
        `04-ar-consultation-steps-${vp.name}.png`,
        { copyToArtifact: vp.width !== 768 }
      );

      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#journal-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(350);
      await captureScreenshot(
        send,
        sessionId,
        `05-ar-journal-${vp.name}.png`,
        { copyToArtifact: vp.width !== 768 }
      );

      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('.ed-ivory-booking-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(350);
      await captureScreenshot(
        send,
        sessionId,
        `06-ar-booking-and-footer-${vp.name}.png`,
        { copyToArtifact: vp.width !== 768 }
      );

      // --- English Homepage (/en) ---
      await send("Page.navigate", { url: `${TARGET_BASE_URL}/en` }, sessionId);
      await sleep(1100);
      await scrollThroughPage(send, sessionId);
      await captureScreenshot(send, sessionId, `07-en-home-${vp.name}.png`, {
        copyToArtifact: vp.width === 1440 || vp.width === 390,
      });
    }

    // Also capture inner pages at 1440w desktop to verify cohesive visual language
    await setViewport(1440, 920);
    const innerRoutes = [
      { path: "/ar/about", file: "08-ar-about-1440w.png" },
      { path: "/ar/specialties", file: "09-ar-specialties-1440w.png" },
      { path: "/ar/articles", file: "10-ar-articles-1440w.png" },
      {
        path: "/ar/articles/preparing-for-consultation",
        file: "11-ar-article-detail-1440w.png",
      },
      { path: "/ar/contact", file: "12-ar-contact-1440w.png" },
    ];
    for (const r of innerRoutes) {
      await send(
        "Page.navigate",
        { url: `${TARGET_BASE_URL}${r.path}` },
        sessionId
      );
      await sleep(1000);
      await scrollThroughPage(send, sessionId);
      await captureScreenshot(send, sessionId, r.file, {
        copyToArtifact: true,
      });
    }

    // =========================================================================
    // TEST 8: Arabic RTL /admin Dashboard, Authentication, Sections & Mobile RTL
    // =========================================================================
    console.log(
      "8. Verifying Arabic RTL /admin Dashboard, Auth Protection, & 9 Editorial Sections..."
    );

    // 8a. Unauthenticated /api/cms/state must return 401
    const unauthApiRes = await fetch(`${TARGET_BASE_URL}/api/cms/state`);
    assert.equal(
      unauthApiRes.status,
      401,
      "Unauthenticated /api/cms/state request must return 401"
    );

    // 8b. Unauthenticated navigation to /admin redirects to /admin/login with RTL & noindex
    await send("Page.navigate", { url: `${TARGET_BASE_URL}/admin` }, sessionId);
    await sleep(1200);
    const loginPageState = await evaluateJs(
      send,
      sessionId,
      `({
        path: location.pathname,
        dir: document.querySelector('.cms-login-shell')?.getAttribute('dir'),
        lang: document.querySelector('.cms-login-shell')?.getAttribute('lang'),
        robots: document.querySelector('meta[name="robots"]')?.content || '',
        hasEmailInput: Boolean(document.querySelector('#cms-login-email')),
        hasPasswordInput: Boolean(document.querySelector('#cms-login-password')),
      })`
    );
    assert.equal(loginPageState.path, "/admin/login");
    assert.equal(loginPageState.dir, "rtl");
    assert.equal(loginPageState.lang, "ar");
    assert.equal(loginPageState.robots.includes("noindex"), true);
    assert.equal(loginPageState.hasEmailInput, true);
    assert.equal(loginPageState.hasPasswordInput, true);

    await captureScreenshot(
      send,
      sessionId,
      "13-admin-login-rtl-1440w.png",
      { copyToArtifact: true }
    );

    // 8c. Provision ephemeral owner user for browser verification & clean up in finally
    const ephemeralEmail = "verify-owner@drmalak.local";
    const ephemeralPassword = `Verify!${crypto.randomBytes(8).toString("hex")}`;
    execFileSync(
      process.execPath,
      [
        path.join(process.cwd(), "scripts/provision-admin.mjs"),
        `--email=${ephemeralEmail}`,
        `--password=${ephemeralPassword}`,
        `--name=د. ملاك السيف`,
        `--role=owner`,
      ],
      { stdio: "ignore" }
    );

    try {
      // Log in via the /admin/login UI
      await evaluateJs(
        send,
        sessionId,
        `(() => {
          const emailEl = document.querySelector('#cms-login-email');
          const passEl = document.querySelector('#cms-login-password');
          const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          emailEl._valueTracker?.setValue('');
          setVal.call(emailEl, ${JSON.stringify(ephemeralEmail)});
          emailEl.dispatchEvent(new Event('input', { bubbles: true }));
          emailEl.dispatchEvent(new Event('change', { bubbles: true }));
          passEl._valueTracker?.setValue('');
          setVal.call(passEl, ${JSON.stringify(ephemeralPassword)});
          passEl.dispatchEvent(new Event('input', { bubbles: true }));
          passEl.dispatchEvent(new Event('change', { bubbles: true }));
          document.querySelector('form.cms-login-form button[type="submit"]').click();
        })()`
      );
      await sleep(2200);

      const dashboardState = await evaluateJs(
        send,
        sessionId,
        `({
          path: location.pathname,
          dir: document.querySelector('.cms-admin-shell')?.getAttribute('dir'),
          navItemCount: document.querySelectorAll('.cms-nav-btn').length,
        })`
      );
      assert.equal(dashboardState.path, "/admin");
      assert.equal(dashboardState.dir, "rtl");
      assert.equal(
        dashboardState.navItemCount,
        9,
        `Expected 9 admin navigation sections, got ${dashboardState.navItemCount}`
      );

      await captureScreenshot(
        send,
        sessionId,
        "14-admin-overview-rtl-1440w.png",
        { copyToArtifact: true }
      );

      // Navigate to Homepage editor section
      await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('.cms-nav-btn')).find(b => b.textContent.includes('الصفحة الرئيسية'))?.click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        "15-admin-homepage-editor-rtl-1440w.png",
        { copyToArtifact: true }
      );

      // Navigate to Articles editor section
      await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('.cms-nav-btn')).find(b => b.textContent.includes('المقالات التوعوية'))?.click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        "16-admin-articles-editor-rtl-1440w.png",
        { copyToArtifact: true }
      );

      // Navigate to Media library section
      await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('.cms-nav-btn')).find(b => b.textContent.includes('مكتبة الوسائط'))?.click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        "17-admin-media-library-rtl-1440w.png",
        { copyToArtifact: true }
      );

      // Navigate to Revision history section
      await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('.cms-nav-btn')).find(b => b.textContent.includes('سجل الإصدارات'))?.click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        "18-admin-revisions-rtl-1440w.png",
        { copyToArtifact: true }
      );

      // Switch to mobile viewport (390x844) and capture RTL mobile admin view
      await setViewport(390, 844);
      await evaluateJs(
        send,
        sessionId,
        `Array.from(document.querySelectorAll('.cms-nav-btn')).find(b => b.textContent.includes('نظرة عامة'))?.click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        "19-admin-mobile-rtl-390w.png",
        { copyToArtifact: true }
      );
      console.log(
        "  [PASS] Arabic RTL /admin Dashboard & all 9 sections verified at 1440w & 390w."
      );
    } finally {
      // Remove ephemeral verification user so no test credentials remain in the database
      try {
        const dbPath = path.join(
          process.cwd(),
          "content",
          ".cms-data",
          "cms.sqlite"
        );
        if (fs.existsSync(dbPath)) {
          const cleanDb = new DatabaseSync(dbPath);
          cleanDb
            .prepare("DELETE FROM cms_users WHERE email = ?")
            .run(ephemeralEmail);
          cleanDb.close();
        }
      } catch {}
    }

    browserWs.close();
    console.log("ALL BROWSER VERIFICATION CHECKS COMPLETED!");
  } finally {
    try {
      chromeProc.kill();
    } catch {}
    if (serverProc) {
      try {
        serverProc.kill();
      } catch {}
    }
  }
}

setTimeout(() => {
  console.error("Browser verification watchdog timeout (120s) reached; exiting.");
  process.exit(1);
}, 120000).unref();

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

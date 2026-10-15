import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SCREENSHOTS_DIR =
  "C:\\Users\\elwady\\.gemini\\antigravity\\brain\\b05b6ecf-65f0-45b0-82a0-a86862c63c50\\scratch\\screenshots\\verified";
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const TARGET_BASE_URL = process.env.VERIFY_BASE_URL || "http://127.0.0.1:3099";

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
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}, sessionId = undefined, timeoutMs = 8000) =>
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

async function captureScreenshot(send, sessionId, filename) {
  try {
    const shot = await send(
      "Page.captureScreenshot",
      { format: "png", fromSurface: true },
      sessionId,
      5000
    );
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
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
    console.log("Starting local Next.js production server on port 3099...");
    serverProc = spawn(
      process.execPath,
      [
        path.join(process.cwd(), "node_modules/next/dist/bin/next"),
        "start",
        "-p",
        "3099",
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
      "Local Next.js server failed to start on port 3099"
    );
  }

  console.log(`Starting browser verification against ${TARGET_BASE_URL}...`);
  const debugPort = 9455;
  const userDataDir = path.join(SCREENSHOTS_DIR, "chrome-profile");

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
    // TEST 1: Locale & Document Direction Lifecycle (Direct, Client Link, Back/Forward, Refresh)
    // =========================================================================
    console.log("1. Verifying Locale & Document Direction lifecycle...");
    await send("Page.navigate", { url: `${TARGET_BASE_URL}/ar` }, sessionId);
    await sleep(1600);

    let docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(docState, { lang: "ar", dir: "rtl", path: "/ar" });

    // Click language switcher link (client-side transition to /en)
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('header .lang-switch').click()`
    );
    await sleep(1200);

    docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(
      docState,
      { lang: "en", dir: "ltr", path: "/en" },
      "Switching from /ar to /en via client-side link must update html lang='en' and dir='ltr'"
    );

    // Click language switcher link back to /ar
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('header .lang-switch').click()`
    );
    await sleep(1200);

    docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(
      docState,
      { lang: "ar", dir: "rtl", path: "/ar" },
      "Switching from /en back to /ar via client-side link must update html lang='ar' and dir='rtl'"
    );

    // Test browser Back and Forward (popstate)
    await evaluateJs(send, sessionId, `history.back()`);
    await sleep(900);
    docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(
      docState,
      { lang: "en", dir: "ltr", path: "/en" },
      "Browser Back must synchronize html lang='en' and dir='ltr'"
    );

    await evaluateJs(send, sessionId, `history.forward()`);
    await sleep(900);
    docState = await evaluateJs(
      send,
      sessionId,
      `({ lang: document.documentElement.lang, dir: document.documentElement.dir, path: location.pathname })`
    );
    assert.deepEqual(
      docState,
      { lang: "ar", dir: "rtl", path: "/ar" },
      "Browser Forward must synchronize html lang='ar' and dir='rtl'"
    );
    console.log("  [PASS] Locale & Document Direction lifecycle verified.");

    // =========================================================================
    // TEST 2: Platform Fonts & Control Font Inheritance (No STC Regular, No Arial on controls)
    // =========================================================================
    console.log("2. Verifying rendered platform fonts & button inheritance...");
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

    const bodyFonts = await checkSelectorFonts(".hero-immersive-lead");
    assert.equal(
      bodyFonts.some((f) => f.familyName === "STC Regular"),
      false,
      `Body copy must NOT render with broken local STC Regular, got: ${JSON.stringify(bodyFonts)}`
    );

    const buttonSummaryFonts = await checkSelectorFonts(
      ".specialty-photo-card-summary"
    );
    assert.equal(
      buttonSummaryFonts.some((f) => /Arial/i.test(f.familyName)),
      false,
      `Specialty description inside <button> must inherit --font-body and NOT compute to Arial, got: ${JSON.stringify(buttonSummaryFonts)}`
    );
    console.log(
      "  [PASS] Rendered platform fonts & control inheritance verified."
    );

    // =========================================================================
    // TEST 3: Interactive Specialty Explorer & Inactive Panel Focusability
    // =========================================================================
    console.log(
      "3. Verifying Interactive Specialty Explorer & inactive panel focusability..."
    );
    const tabStats = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
        return {
          tabCount: tabs.length,
          tabLabels: tabs.map(t => t.getAttribute('aria-label')),
          selectedTabs: tabs.filter(t => t.getAttribute('aria-selected') === 'true').map(t => t.id),
          activePanels: panels.filter(p => !p.hidden && !p.hasAttribute('inert') && getComputedStyle(p).display !== 'none').map(p => p.id),
          inactivePanelsHidden: panels.filter(p => p.id !== 'specialty-panel-plastic-surgery').every(p => p.hidden && p.hasAttribute('inert') && getComputedStyle(p).display === 'none'),
        };
      })()`
    );
    assert.equal(tabStats.tabCount, 3);
    assert.deepEqual(tabStats.tabLabels, [
      "جراحة التجميل",
      "جراحة الترميم",
      "جراحة الحروق",
    ]);
    assert.deepEqual(tabStats.selectedTabs, ["specialty-tab-plastic-surgery"]);
    assert.deepEqual(tabStats.activePanels, [
      "specialty-panel-plastic-surgery",
    ]);
    assert.equal(
      tabStats.inactivePanelsHidden,
      true,
      "Inactive specialty panels must be hidden, inert, and display: none"
    );

    // Try focusing a control inside an inactive panel — must NOT become document.activeElement
    const inactiveFocusAttempt = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const inactiveBtn = document.querySelector('#specialty-panel-reconstructive-surgery button, #specialty-panel-reconstructive-surgery a');
        inactiveBtn?.focus();
        return document.activeElement === inactiveBtn;
      })()`
    );
    assert.equal(
      inactiveFocusAttempt,
      false,
      "Controls inside inactive specialty panels must never receive focus"
    );

    // Switch to tab 2 (Reconstructive Surgery) and verify active panel + consultation button topic
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('#specialty-tab-reconstructive-surgery').click()`
    );
    await sleep(400);

    const switchedPanel = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
        return panels.filter(p => !p.hidden && getComputedStyle(p).display !== 'none').map(p => p.id);
      })()`
    );
    assert.deepEqual(switchedPanel, ["specialty-panel-reconstructive-surgery"]);
    console.log(
      "  [PASS] Interactive Specialty Explorer & inactive panel focusability verified."
    );

    // =========================================================================
    // TEST 4: Consultation Dialog Verification (Scroll lock, inert, focus trap, Escape, topic)
    // =========================================================================
    console.log("4. Verifying Consultation Dialog lifecycle...");
    await evaluateJs(
      send,
      sessionId,
      `(() => {
        const btn = document.querySelector('#specialty-panel-reconstructive-surgery .btn-primary');
        btn.focus();
        btn.click();
      })()`
    );
    await sleep(450);

    const dialogOpenState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const dialog = document.querySelector('[role="dialog"]');
        const shell = document.querySelector('.app-shell-content');
        const checkedRadio = dialog?.querySelector('input[type="radio"]:checked');
        return {
          isOpen: Boolean(dialog),
          bodyOverflow: document.body.style.overflow,
          shellInert: shell?.hasAttribute('inert'),
          shellAriaHidden: shell?.getAttribute('aria-hidden'),
          selectedTopic: checkedRadio?.value,
        };
      })()`
    );
    assert.deepEqual(dialogOpenState, {
      isOpen: true,
      bodyOverflow: "hidden",
      shellInert: true,
      shellAriaHidden: "true",
      selectedTopic: "reconstructive-surgery",
    });

    // Advance to Step 2 and verify WhatsApp link
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.dialog-primary-btn').click()`
    );
    await sleep(350);

    const step2State = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const waLink = document.querySelector('[role="dialog"] a.btn-primary');
        return {
          href: waLink?.getAttribute('href') || '',
          text: decodeURIComponent(waLink?.getAttribute('href') || ''),
        };
      })()`
    );
    assert.equal(
      step2State.href.startsWith("https://wa.me/966580376463?text="),
      true
    );
    assert.equal(step2State.text.includes("مجال جراحة الترميم"), true);

    // Close dialog and verify scroll restoration & focus restoration
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.dialog-close-btn').click()`
    );
    await sleep(350);

    const dialogClosedState = await evaluateJs(
      send,
      sessionId,
      `(() => {
        const shell = document.querySelector('.app-shell-content');
        const trigger = document.querySelector('#specialty-panel-reconstructive-surgery .btn-primary');
        return {
          isOpen: Boolean(document.querySelector('[role="dialog"]')),
          bodyOverflow: document.body.style.overflow,
          shellInert: shell?.hasAttribute('inert'),
          focusRestored: document.activeElement === trigger,
        };
      })()`
    );
    assert.deepEqual(dialogClosedState, {
      isOpen: false,
      bodyOverflow: "",
      shellInert: false,
      focusRestored: true,
    });
    console.log("  [PASS] Consultation Dialog lifecycle verified.");

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

    // Reading time check on Arabic card
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

    // Empty state reset button count check
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

    // Click the reset button
    await evaluateJs(
      send,
      sessionId,
      `document.querySelector('.articles-empty-state button').click()`
    );
    await sleep(300);
    const countAfterReset = await evaluateJs(
      send,
      sessionId,
      `document.querySelectorAll('.featured-article-card, .article-card').length`
    );
    assert.equal(
      countAfterReset,
      countBare,
      "Reset must restore all published articles"
    );
    console.log(
      "  [PASS] Article Search Normalization & Reading-Time Localization verified."
    );

    // =========================================================================
    // TEST 6: SEO Metadata (noindex, canonical, hreflang ar/en/x-default, og:image, sitemap.xml)
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
    // TEST 7: Capture Screenshots across 390px, 768px, and 1440px
    // =========================================================================
    console.log(
      "7. Capturing verification screenshots across 390px, 768px, and 1440px..."
    );
    const viewports = [
      { name: "1440w-desktop", width: 1440, height: 920 },
      { name: "768w-tablet", width: 768, height: 1024 },
      { name: "390w-mobile", width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await setViewport(vp.width, vp.height);

      // 1. Homepage (verify Hero, #doctor-section portrait, split specialty explorer, FAQ, deep-red closing section, and zero broken images)
      await send("Page.navigate", { url: `${TARGET_BASE_URL}/ar` }, sessionId);
      await sleep(1400);
      const imageHealth = await evaluateJs(
        send,
        sessionId,
        `(() => {
          const heroSrc = document.querySelector('.hero-immersive-img')?.getAttribute('src') || '';
          const doctorSectionSrc = document.querySelector('#doctor-section .doctor-editorial-img')?.getAttribute('src') || '';
          const hasHeroQualStrip = Boolean(document.querySelector('.hero-doctor-identity-strip'));
          const hasSplitExplorer = Boolean(document.querySelector('.specialty-explorer-split'));
          const hasClosingRed = Boolean(document.querySelector('.closing-red-statement-section'));
          const broken = Array.from(document.querySelectorAll('img'))
            .filter(img => img.loading !== 'lazy' && (!img.complete || img.naturalWidth === 0))
            .map(img => img.getAttribute('src'));
          return { heroSrc, doctorSectionSrc, hasHeroQualStrip, hasSplitExplorer, hasClosingRed, broken };
        })()`
      );
      assert.equal(
        imageHealth.heroSrc.includes("hero-aesthetic-editorial.jpg"),
        true,
        `Homepage Hero must use the editorial photograph (hero-aesthetic-editorial.jpg), got: ${imageHealth.heroSrc}`
      );
      assert.equal(
        imageHealth.doctorSectionSrc.includes("dr-malak-alsaif.jpg"),
        true,
        `Dedicated #doctor-section must feature the real doctor portrait (dr-malak-alsaif.jpg), got: ${imageHealth.doctorSectionSrc}`
      );
      assert.equal(
        imageHealth.hasHeroQualStrip,
        false,
        "Hero qualifications strip must be absent"
      );
      assert.equal(
        imageHealth.hasSplitExplorer,
        true,
        "Interactive split specialty explorer must be present"
      );
      assert.equal(
        imageHealth.hasClosingRed,
        true,
        "Distinctive deep-red closing section must be present"
      );
      assert.deepEqual(
        imageHealth.broken,
        [],
        `All eager images must load cleanly without broken URLs, broken: ${JSON.stringify(imageHealth.broken)}`
      );
      await captureScreenshot(send, sessionId, `01-homepage-${vp.name}.png`);

      // 2. Doctor Editorial Introduction
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#doctor-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(600);
      await captureScreenshot(
        send,
        sessionId,
        `02-doctor-section-${vp.name}.png`
      );

      // 3. Interactive Specialty Explorer
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#specialties-section').scrollIntoView({ behavior: 'instant', block: 'start' })`
      );
      await sleep(600);
      await captureScreenshot(
        send,
        sessionId,
        `03-specialty-explorer-${vp.name}.png`
      );

      // 4. Consultation Dialog
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('#specialty-panel-plastic-surgery .btn-primary').click()`
      );
      await sleep(500);
      await captureScreenshot(
        send,
        sessionId,
        `04-consultation-dialog-${vp.name}.png`
      );
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('.dialog-close-btn')?.click()`
      );
      await sleep(300);

      // 5. Deep-Red Closing Section
      await evaluateJs(
        send,
        sessionId,
        `document.querySelector('.closing-red-statement-section').scrollIntoView({ behavior: 'instant', block: 'center' })`
      );
      await sleep(600);
      await captureScreenshot(
        send,
        sessionId,
        `05-closing-red-section-${vp.name}.png`
      );

      // 6. Article Page
      await send(
        "Page.navigate",
        {
          url: `${TARGET_BASE_URL}/ar/articles/preparing-for-consultation`,
        },
        sessionId
      );
      await sleep(1200);
      await captureScreenshot(send, sessionId, `06-article-page-${vp.name}.png`);
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
  console.error("Browser verification watchdog timeout (45s) reached; exiting.");
  process.exit(1);
}, 45000).unref();

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

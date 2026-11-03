const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const origin = process.env.BLOG_PREVIEW_URL || 'http://127.0.0.1:4010';
const screenshots = '/private/tmp/blog-bilingual-screenshots';
fs.mkdirSync(screenshots, { recursive: true });

async function main() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    let checks = 0;
    try {
        for (const width of [1440, 390, 320]) {
            for (const language of ['zh-CN', 'en']) {
                const context = await browser.newContext({ viewport: { width, height: 900 }, locale: language });
                const page = await context.newPage();
                await page.goto(origin + (language === 'en' ? '/en/' : '/'), { waitUntil: 'networkidle' });
                await page.evaluate(() => document.fonts.ready);
                assert.equal(await page.locator('html').getAttribute('lang'), language);
                await assert.doesNotReject(() => page.locator('.language-switch').waitFor({ state: 'visible' }));
                assert.equal(await page.locator('.skill-card').count(), 10);
                assert.equal(await page.locator('.article-link:not([aria-hidden])').count(), 8);
                const copies = await page.locator('.article-card').evaluateAll(nodes => nodes.map(node => node.outerHTML));
                assert.deepEqual(copies.slice(0, 8), copies.slice(8));
                assert.equal(await page.locator('.time-layer[data-area="study"]').getAttribute('aria-label'), language === 'en' ? 'Study' : '学习');
                const imageFailures = await page.locator('img').evaluateAll(images =>
                    images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src));
                assert.deepEqual(imageFailures, []);
                const geometry = await page.evaluate(() => {
                    const switcher = document.querySelector('.language-switch').getBoundingClientRect();
                    return {
                        switchInside: switcher.left >= 0 && switcher.right <= innerWidth,
                        overflow: document.documentElement.scrollWidth > innerWidth,
                        clipped: [...document.querySelectorAll('.role-list a, .work-overlay h3, .article-title')]
                            .filter(node => node.scrollWidth > node.clientWidth + 1)
                            .map(node => node.textContent.trim())
                    };
                });
                assert.equal(geometry.switchInside, true);
                assert.equal(geometry.overflow, false);
                assert.deepEqual(geometry.clipped, []);
                await page.screenshot({ path: `${screenshots}/home-${language}-${width}.png` });
                if (width === 1440) {
                    await page.screenshot({ path: `${screenshots}/full-${language}.png`, fullPage: true });
                    for (const section of ['articles', 'works', 'statistics']) {
                        await page.locator(`#${section}`).scrollIntoViewIfNeeded();
                        await page.waitForTimeout(1100);
                        await page.screenshot({ path: `${screenshots}/${section}-${language}.png` });
                    }
                }
                await page.goto(origin + (language === 'en' ? '/en/' : '/'));
                await page.locator('.language-switch [data-language="en"]').click();
                await page.waitForURL('**/en/');
                assert.equal(await page.locator('html').getAttribute('lang'), 'en');
                await page.reload({ waitUntil: 'networkidle' });
                assert.equal(await page.evaluate(() => localStorage.getItem('harry-blog-language')), 'en');
                checks += 7;
                await context.close();
            }
        }

        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
        const page = await context.newPage();
        await page.goto(origin + '/?theme=06#articles');
        await page.waitForURL('**/en/?theme=06#articles');
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'morning');
        await page.locator('.language-switch [data-language="zh-CN"]').click();
        await page.waitForURL('**/?theme=06#articles');
        await page.reload();
        assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
        await page.goto(origin + '/en/rag-explained/?theme=01');
        const chineseUrl = await page.locator('.language-switch [data-language="zh-CN"]').getAttribute('href');
        await page.locator('.language-switch [data-language="zh-CN"]').click();
        await page.waitForURL(url => url.pathname !== '/en/rag-explained/');
        assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
        await page.locator('.language-switch [data-language="en"]').click();
        await page.waitForURL('**/en/rag-explained/?theme=01');
        assert.equal(await page.locator('.qzq-post-back').getAttribute('href'), '/en/#articles');
        assert.ok(chineseUrl.includes('theme=01'));
        const articleText = await page.locator('.qzq-post-content').innerText();
        assert.ok(articleText.includes('Retrieval-Augmented Generation'));
        assert.ok(!articleText.includes('今天我们来聊'));
        await page.screenshot({ path: `${screenshots}/article-en-desktop.png` });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: `${screenshots}/article-en-mobile.png` });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        checks += 8;

        const links = await page.locator('.read-next-story').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
        assert.ok(links.every(link => link.startsWith('/en/')));
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(origin + '/en/');
        await page.locator('.site-nav a[href="#works"]').click();
        await page.locator('.language-switch [data-language="zh-CN"]').click();
        await page.waitForURL('**/#works');
        await page.goto(origin + '/en/');
        const articles = await page.locator('.article-link:not([aria-hidden])').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
        for (const article of articles) {
            const response = await context.request.get(origin + article);
            assert.equal(response.status(), 200, article);
            const html = await response.text();
            assert.ok(html.includes('<html lang="en">'), article);
            checks += 1;
        }
        const feed = await context.request.get(origin + '/en/feed.xml');
        assert.equal(feed.status(), 200);
        const englishUrls = await page.evaluate(xml => {
            const document = new DOMParser().parseFromString(xml, 'application/xml');
            if (document.querySelector('parsererror')) throw new Error('Invalid English RSS feed');
            return [...document.querySelectorAll('item > link')].map(link => new URL(link.textContent).pathname);
        }, await feed.text());
        assert.equal(englishUrls.length, 12);
        for (const url of englishUrls) {
            const translated = await context.request.get(origin + url);
            assert.equal(translated.status(), 200, url);
            const chinesePath = await page.evaluate(html => {
                const document = new DOMParser().parseFromString(html, 'text/html');
                return new URL(document.querySelector('link[hreflang="zh-CN"]').href).pathname;
            }, await translated.text());
            const original = await context.request.get(origin + chinesePath);
            assert.equal(original.status(), 200, chinesePath);
            await page.setViewportSize({ width: 320, height: 844 });
            await page.goto(origin + url, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, url);
            assert.equal(await page.locator('html').getAttribute('lang'), 'en');
            checks += 2;
        }
        await page.goto(origin + '/en/rag-explained/');
        await page.evaluate(() => localStorage.setItem('harry-blog-language', 'en'));
        const directChinese = await page.locator('[data-language="zh-CN"]').getAttribute('href');
        await page.goto(directChinese);
        await page.locator('.qzq-post-back').click();
        await page.waitForURL('**/?lang=zh-CN#articles');
        assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN');
        const chineseArticle = await page.locator('.article-link:not([aria-hidden])').first().getAttribute('href');
        await page.goto(origin + chineseArticle);
        const recommendationLabel = await page.locator('.read-next-story .post').first().evaluate(node => getComputedStyle(node, '::before').content);
        assert.ok(recommendationLabel.includes('你可能也喜欢') || recommendationLabel.includes('接着读这一篇'));
        checks += 1;
        await context.close();

        const noStorage = await browser.newContext({ locale: 'en-US' });
        await noStorage.addInitScript(() => {
            Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } });
        });
        const restrictedPage = await noStorage.newPage();
        await restrictedPage.goto(origin + '/en/');
        await restrictedPage.locator('.language-switch [data-language="zh-CN"]').click();
        await restrictedPage.waitForURL('**/?lang=zh-CN');
        assert.equal(await restrictedPage.locator('html').getAttribute('lang'), 'zh-CN');
        await restrictedPage.goto(origin + '/en/rag-explained/');
        await restrictedPage.locator('[data-language="zh-CN"]').click();
        await restrictedPage.locator('.qzq-post-back').click();
        await restrictedPage.waitForURL('**/?lang=zh-CN#articles');
        assert.equal(await restrictedPage.locator('html').getAttribute('lang'), 'zh-CN');
        await noStorage.close();

        const noScript = await browser.newContext({ javaScriptEnabled: false });
        const staticPage = await noScript.newPage();
        await staticPage.goto(origin + '/en/rag-explained/');
        assert.ok((await staticPage.locator('.qzq-post-content').innerText()).includes('Retrieval-Augmented Generation'));
        await staticPage.locator('.language-switch [data-language="zh-CN"]').click();
        assert.equal(await staticPage.locator('html').getAttribute('lang'), 'zh-CN');
        await noScript.close();
        checks += 3;
        console.log(`PASS: ${checks} browser checks; screenshots: ${screenshots}`);
    } finally {
        await browser.close();
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });

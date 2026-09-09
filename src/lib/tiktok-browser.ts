import { chromium } from "playwright";

export type LoginStatus =
  | "ok"
  | "invalid"
  | "captcha"
  | "twofactor"
  | "timeout"
  | "error";

export interface PasswordLoginResult {
  status: LoginStatus;
  sessionCookie?: string;
  detail?: string;
}

/**
 * Direct username/password login through TikTok's real login page using a
 * headless browser (their JS signatures must run — plain HTTP cannot).
 *
 * SECURITY: the password only lives for the duration of this call and is
 * never stored or logged. Only the resulting session cookie is returned.
 */
export async function loginWithPassword(
  username: string,
  password: string
): Promise<PasswordLoginResult> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-gpu",
      ],
    });
  } catch (e) {
    return {
      status: "error",
      detail:
        "مرورگر خودکار روی سرور نصب نیست. دستور  npx playwright install --with-deps chromium  را در پوشه پروژه اجرا کنید.",
    };
  }

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);

    const diagnose = async (): Promise<string> => {
      const title = await page.title().catch(() => "");
      const text = await page
        .evaluate(() => (document.body?.innerText ?? "").slice(0, 160))
        .catch(() => "");
      return `${title} | ${text.replace(/\s+/g, " ").trim()}`;
    };

    // go straight to the login page first
    await page.goto("https://www.tiktok.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    await page.waitForTimeout(3000);

    const hasPassword = async () =>
      page
        .locator('input[type="password"], [data-e2e="login-password"]')
        .first()
        .isVisible({ timeout: 2500 })
        .catch(() => false);

    let formVisible = await hasPassword();

    if (!formVisible) {
      // the login page defaults to the QR tab — switch to credentials method
      const tryClickText = async (texts: string[]): Promise<boolean> => {
        for (const t of texts) {
          try {
            const loc = page.getByText(t, { exact: false }).first();
            if (await loc.isVisible({ timeout: 1500 })) {
              await loc.click({ timeout: 3000 });
              return true;
            }
          } catch {
            /* try next */
          }
        }
        return false;
      };
      await tryClickText(["Use phone / email / username", "phone / email / username"]);
      await page.waitForTimeout(1500);
      formVisible = await hasPassword();
      if (!formVisible) {
        await tryClickText(["Log in with username"]);
        await page.waitForTimeout(1500);
        formVisible = await hasPassword();
      }
    }

    if (!formVisible) {
      // verification wall or SPA not ready — try the home page modal
      const wall = await diagnose();
      await page.goto("https://www.tiktok.com/", {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      await page.waitForTimeout(3000);
      const openSelectors = [
        '[data-e2e="top-login-button"]',
        'button:has-text("Log in")',
        'button:has-text("Log In")',
        '[data-e2e="nav-login"]',
      ];
      let opened = false;
      for (const sel of openSelectors) {
        try {
          await page.click(sel, { timeout: 4000 });
          opened = true;
          break;
        } catch {
          /* try next */
        }
      }
      await page.waitForTimeout(2500);
      formVisible = await page
        .locator('input[type="password"], [data-e2e="login-password"]')
        .first()
        .isVisible({ timeout: 4000 })
        .catch(() => false);
      if (!opened && !formVisible) {
        if (/verify|verification|captcha|drag/i.test(wall)) {
          return {
            status: "captcha",
            detail: `تیک‌تاک از آی‌پی سرور دیوار تأیید نشان داد: ${wall}`,
          };
        }
        return { status: "error", detail: `فرم ورود پیدا نشد. وضعیت صفحه: ${wall}` };
      }
    }

    // switch to username login if a dedicated tab/link exists
    const switchSelectors = [
      'div:has-text("Log in with username")',
      'a:has-text("Log in with username")',
      'div:has-text("Use phone / username / email")',
    ];
    for (const sel of switchSelectors) {
      try {
        await page.click(sel, { timeout: 2500 });
        await page.waitForTimeout(800);
        break;
      } catch {
        /* keep current form */
      }
    }

    // fill username
    const usernameSelectors = [
      '[data-e2e="login-username"]',
      'input[name="username"]',
      'input[placeholder*="username" i]',
      'input[type="text"]',
    ];
    let filledUser = false;
    for (const sel of usernameSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2500 })) {
          await el.fill(username);
          filledUser = true;
          break;
        }
      } catch {
        /* try next */
      }
    }
    if (!filledUser) {
      return { status: "error", detail: "فیلد نام کاربری در فرم ورود پیدا نشد." };
    }

    // fill password
    const pwSelectors = [
      '[data-e2e="login-password"]',
      'input[type="password"]',
    ];
    let filledPass = false;
    for (const sel of pwSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2500 })) {
          await el.fill(password);
          filledPass = true;
          break;
        }
      } catch {
        /* try next */
      }
    }
    if (!filledPass) {
      return { status: "error", detail: "فیلد رمز عبور پیدا نشد." };
    }

    // submit
    const submitSelectors = [
      '[data-e2e="login-submit-button"]',
      'button[type="submit"]',
      'button:has-text("Log in")',
    ];
    let submitted = false;
    for (const sel of submitSelectors) {
      try {
        await page.click(sel, { timeout: 4000 });
        submitted = true;
        break;
      } catch {
        /* try next */
      }
    }
    if (!submitted) {
      return { status: "error", detail: "دکمه تأیید ورود پیدا نشد." };
    }

    // wait for an outcome (session cookie / captcha / error)
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const cookies = await context.cookies();
      const sid = cookies.find((c) => c.name === "sessionid" && c.value);
      if (sid) {
        return { status: "ok", sessionCookie: sid.value };
      }

      const html = await page.content().catch(() => "");
      if (/secsdk|captcha|verify|arecaptcha/i.test(html) && /slider|puzzle|challenge/i.test(html)) {
        return {
          status: "captcha",
          detail: "تیک‌تاک چالش تأیید انسانی (کپچا) نشان داد — از آی‌پی سرور قابل رد شدن نیست.",
        };
      }
      const errEl = await page
        .locator('[data-e2e="login-error"], [class*="error"], [class*="Error"]')
        .first()
        .textContent()
        .catch(() => "");
      if (errEl && errEl.trim().length > 3 && /wrong|match|exist|incorrect|invalid/i.test(errEl)) {
        return { status: "invalid", detail: errEl.trim() };
      }
      const twofa = await page
        .locator('input[placeholder*="code" i], [data-e2e*="code"]')
        .first()
        .isVisible()
        .catch(() => false);
      if (twofa) {
        return {
          status: "twofactor",
          detail: "حساب تأیید دومرحله‌ای دارد — ادامه از این روش ممکن نیست.",
        };
      }
      await page.waitForTimeout(1500);
    }
    return { status: "timeout", detail: "پاسخی از تیک‌تاک گرفته نشد (احتمالاً محدودیت آی‌پی)." };
  } catch (e) {
    return {
      status: "error",
      detail: e instanceof Error ? e.message.slice(0, 200) : "خطای ناشناخته",
    };
  } finally {
    await browser.close().catch(() => {});
  }
}

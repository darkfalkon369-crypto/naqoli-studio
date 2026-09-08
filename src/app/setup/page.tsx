"use client";

import { useState, type ReactNode } from "react";
import {
  IconBook,
  IconCheck,
  IconCopy,
  IconDownload,
  IconKey,
  IconServer,
  IconTelegram,
  IconTerminal,
  IconTiktok,
  IconZap,
} from "@/components/icons";
import { Badge, Btn, Card, cn } from "@/components/ui";
import { toast } from "@/lib/api";

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast("دستور کپی شد 📋");
    } catch {
      toast("کپی ناموفق بود؛ دستی انتخاب کنید");
    }
  };
  return (
    <div dir="ltr" className="relative overflow-hidden rounded-xl bg-ink-900 shadow-soft">
      {label && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
          <span className="text-[10px] font-bold text-cream/50">{label}</span>
          <span className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ruby-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-sun-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-leaf-600/80" />
          </span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-[#ffd9a8]">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-cream transition-colors hover:bg-coral-500"
        title="کپی"
      >
        <IconCopy className="h-4 w-4" />
      </button>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  children,
  id,
}: {
  n: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="animate-pop overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 font-display text-lg text-sun-300">
            {n}
          </span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-coral-100 text-coral-600">
            {icon}
          </span>
          <h2 className="font-display text-xl text-ink-900">{title}</h2>
        </div>
        <div className="space-y-4 p-5 text-sm leading-7 text-ink-700">{children}</div>
      </Card>
    </section>
  );
}

function Note({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "ok" }) {
  const styles = {
    info: "border-aqua-500/30 bg-[#dcecf8]/60 text-ink-800",
    warn: "border-sun-400/40 bg-sun-100 text-ink-800",
    ok: "border-leaf-600/30 bg-leaf-100 text-ink-800",
  };
  const icons = { info: "💡", warn: "⚠️", ok: "✅" };
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border p-3.5 text-xs leading-6", styles[tone])}>
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <div>{children}</div>
    </div>
  );
}

function TRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td dir="ltr" className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] font-bold text-coral-700">
        {k}
      </td>
      <td className="px-3 py-2.5 text-xs leading-6">{v}</td>
    </tr>
  );
}

const TOC = [
  { id: "req", label: "پیش‌نیازها" },
  { id: "s1", label: "۱. انتقال پروژه به سرور" },
  { id: "s2", label: "۲. اجرای اسکریپت راه‌انداز" },
  { id: "s3", label: "۳. بررسی اجرای سرویس" },
  { id: "s4", label: "۴. اتصال ربات تلگرام" },
  { id: "s5", label: "۵. اتصال تیک‌تاک" },
  { id: "manage", label: "دستورات مدیریت" },
  { id: "backup", label: "پشتیبان‌گیری" },
  { id: "trouble", label: "عیب‌یابی" },
];

export default function SetupPage() {
  const [copied] = useState(false);
  void copied;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* hero */}
      <Card className="animate-pop overflow-hidden">
        <div className="bg-ink-900 px-6 py-8 text-center">
          <span className="mx-auto grid h-16 w-16 animate-floaty place-items-center rounded-2xl bg-coral-500 text-3xl shadow-[0_6px_0_0_var(--color-coral-700)]">
            🚀
          </span>
          <h2 className="mt-4 font-display text-3xl text-cream">
            راه‌اندازی روی سرور شخصی در ۵ دقیقه
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-cream/60">
            اسکریپت راه‌انداز همه‌چیز را خودکار نصب می‌کند: Node.js، دیتابیس PostgreSQL،
            اعمال اسکیما، بیلد پروداکشن، سرویس سیستمی پایدار و حتی گواهی SSL رایگان با دامنه شما.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href="/setup.sh" download="setup.sh">
              <Btn variant="primary" className="px-6 py-3">
                <IconDownload className="h-5 w-5" />
                دانلود اسکریپت راه‌انداز (setup.sh)
              </Btn>
            </a>
            <a href="#s1">
              <Btn variant="teal" className="px-6 py-3">
                <IconBook className="h-5 w-5" />
                شروع آموزش قدم‌به‌قدم
              </Btn>
            </a>
          </div>
        </div>
        <div className="p-4">
          <CodeBlock
            label="نصب تک‌خطی — روی سرور اجرا کنید"
            code={`sudo bash setup.sh --domain yourdomain.com`}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* TOC */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-3">
            <p className="px-2 pb-2 text-[11px] font-bold text-ink-500">فهرست آموزش</p>
            <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
              {TOC.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-ink-700 transition-colors hover:bg-coral-50 hover:text-coral-700"
                >
                  {t.label}
                </a>
              ))}
            </nav>
          </Card>
        </div>

        {/* steps */}
        <div className="space-y-6">
          {/* req */}
          <section id="req" className="scroll-mt-24">
            <Card className="animate-pop overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-100 text-teal-600">
                  <IconServer className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl">پیش‌نیازها</h2>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { e: "🖥️", t: "سرور مجازی (VPS)", d: "اوبونتو ۲۲.۰۴ یا دبیان ۱۲ — حداقل ۲ گیگ رم و ۲۰ گیگ دیسک" },
                  { e: "🌐", t: "دامنه", d: "برای وب‌هوک تلگرام و SSL لازم است؛ رکورد A را به آی‌پی سرور وصل کنید" },
                  { e: "🔑", t: "دسترسی روت", d: "ورود با SSH و دسترسی اجرای دستورهای مدیریتی" },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border border-line bg-cream/50 p-4">
                    <span className="text-2xl">{x.e}</span>
                    <p className="mt-2 text-sm font-bold">{x.t}</p>
                    <p className="mt-1 text-[11px] leading-5 text-ink-500">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <Step n="۱" id="s1" icon={<IconTerminal className="h-5 w-5" />} title="انتقال پروژه به سرور">
            <p>
              پوشه پروژه را از کامپیوتر خود به سرور منتقل کنید. ساده‌ترین راه با <b>scp</b> است:
            </p>
            <CodeBlock
              label="روی کامپیوتر خودتان اجرا کنید"
              code={`# از پوشه والدِ پروژه
scp -r naqoli-studio/ root@YOUR_SERVER_IP:/root/naqoli-studio`}
            />
            <p>اگر پروژه روی گیت‌هاست دارید، می‌توانید مستقیم روی سرور کلون کنید:</p>
            <CodeBlock
              label="روی سرور"
              code={`git clone https://github.com/you/naqoli-studio.git /root/naqoli-studio`}
            />
            <Note>
              نیازی به نصب چیزی روی کامپیوتر شخصی نیست؛ همه وابستگی‌ها روی خود سرور نصب می‌شوند.
            </Note>
          </Step>

          <Step n="۲" id="s2" icon={<IconZap className="h-5 w-5" />} title="اجرای اسکریپت راه‌انداز">
            <p>فایل <code dir="ltr" className="rounded bg-coral-50 px-1.5 font-mono text-xs text-coral-700">setup.sh</code> در ریشه پروژه قرار دارد. با یک دستور همه‌چیز نصب می‌شود:</p>
            <CodeBlock
              label="روی سرور — نصب کامل"
              code={`cd /root/naqoli-studio
sudo bash setup.sh --domain yourdomain.com`}
            />
            <p>اسکریپت به‌ترتیب این کارها را انجام می‌دهد:</p>
            <ul className="space-y-1.5 text-xs leading-6">
              {[
                "نصب Node.js نسخه ۲۲ و ابزارهای ساخت",
                "نصب و پیکربندی PostgreSQL + ساخت دیتابیس و رمز امن تصادفی",
                "کپی پروژه به /var/www/naqoli-studio و ساخت فایل .env",
                "نصب وابستگی‌ها، اعمال اسکیما (drizzle-kit push) و درج داده‌های نمونه",
                "بیلد پروداکشن و ساخت سرویس سیستمی که بعد از ری‌استارت سرور هم خودکار بالا می‌آید",
                "در صورت تعیین دامنه: نصب Caddy و صدور خودکار گواهی SSL رایگان",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2">
                  <IconCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-leaf-600" />
                  {li}
                </li>
              ))}
            </ul>
            <p className="pt-1 text-xs font-bold">فلگ‌های اختیاری اسکریپت:</p>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[420px]">
                <tbody>
                  <TRow k="--domain example.com" v="دامنه شما؛ نصب خودکار Caddy + SSL رایگان" />
                  <TRow k="--port 8080" v="پورت دلخواه برای اپ (پیش‌فرض: ۳۰۰۰)" />
                  <TRow k="--app-dir /opt/app" v="محل نصب دلخواه (پیش‌فرض: /var/www/naqoli-studio)" />
                  <TRow k="--db-pass mypass" v="رمز دیتابیس دلخواه (پیش‌فرض: تصادفی امن)" />
                  <TRow k="--update" v="دریافت کد جدید، بیلد مجدد و ری‌استارت سرویس" />
                  <TRow k="--status" v="گزارش سریع وضعیت سرویس و لاگ‌ها" />
                </tbody>
              </table>
            </div>
            <Note tone="warn">
              اگر دامنه ندارید، بدون <span dir="ltr" className="font-mono">--domain</span> اجرا کنید؛ پنل روی{" "}
              <span dir="ltr" className="font-mono">http://IP:3000</span> در دسترس است. برای اتصال واقعی تلگرام، در نهایت به دامنه و HTTPS نیاز دارید.
            </Note>
          </Step>

          <Step n="۳" id="s3" icon={<IconCheck className="h-5 w-5" />} title="بررسی اجرای سرویس">
            <CodeBlock
              label="روی سرور"
              code={`sudo systemctl status naqoli        # باید «active (running)» ببینید
journalctl -fu naqoli                 # مشاهده لاگ زنده`}
            />
            <p>
              حالا پنل را باز کنید:{" "}
              <b dir="ltr">https://yourdomain.com</b> یا بدون دامنه{" "}
              <b dir="ltr">http://YOUR_SERVER_IP:3000</b> — باید داشبورد نقلی‌استودیو را ببینید. 🎉
            </p>
          </Step>

          <Step n="۴" id="s4" icon={<IconTelegram className="h-5 w-5" />} title="اتصال واقعی ربات تلگرام">
            <ol className="space-y-2 text-xs leading-6">
              <li><b>۱.</b> در تلگرام به <span dir="ltr" className="font-mono">@BotFather</span> بروید و با دستور <span dir="ltr" className="font-mono">/newbot</span> یک ربات بسازید؛ یک <b>توکن</b> دریافت می‌کنید.</li>
              <li><b>۲.</b> در همین پنل، بخش «ربات تلگرام ← پیکربندی اتصال ربات»، توکن و شناسه چت خود را وارد و ذخیره کنید.</li>
              <li><b>۳.</b> وب‌هوک را روی سرور تلگرام ثبت کنید تا پیام‌ها به سرور شما برسند:</li>
            </ol>
            <CodeBlock
              label="تنظیم وب‌هوک — جای <TOKEN> توکن ربات خود را بگذارید"
              code={`curl -F "url=https://yourdomain.com/api/webhook" \\
     "https://api.telegram.org/bot<TOKEN>/setWebhook"`}
            />
            <CodeBlock
              label="بررسی ثبت وب‌هوک"
              code={`curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`}
            />
            <Note tone="ok">
              تمام! از این لحظه هر کاربری به ربات پیام دهد، موتور هوش مصنوعی پنل پاسخ می‌دهد و دستورهای{" "}
              <span dir="ltr" className="font-mono">/video</span>،{" "}
              <span dir="ltr" className="font-mono">/stats</span>،{" "}
              <span dir="ltr" className="font-mono">/publish</span> و… واقعاً اجرا می‌شوند. وضعیت هر پیام را در «فعالیت زنده ربات» ببینید.
            </Note>
            <p className="text-[11px] text-ink-500">
              برای پیدا کردن شناسه چت خود، پیامی به <span dir="ltr" className="font-mono">@userinfobot</span> بفرستید یا از «شناسه چت ادمین» در تنظیمات ربات استفاده کنید تا فقط شما پاسخ بگیرید.
            </p>
          </Step>

          <Step n="۵" id="s5" icon={<IconTiktok className="h-5 w-5" />} title="اتصال انتشار تیک‌تاک">
            <p>
              برای آپلود <b>واقعی</b> ویدئوها، ربات به مجوز رسمی «تیک‌تاک برای توسعه‌دهندگان» نیاز دارد:
            </p>
            <ol className="space-y-1.5 text-xs leading-6">
              <li><b>۱.</b> در <span dir="ltr" className="font-mono">developers.tiktok.com</span> حساب بسازید و یک اپلیکیشن با دسترسی <span dir="ltr" className="font-mono">Content Posting API</span> ثبت کنید.</li>
              <li><b>۲.</b> پس از تأیید، توکن دسترسی حساب‌ها را بگیرید و در متغیرهای محیطی سرور قرار دهید:</li>
            </ol>
            <CodeBlock
              label="افزودن به فایل /var/www/naqoli-studio/.env"
              code={`TIKTOK_CLIENT_KEY=xxxx
TIKTOK_CLIENT_SECRET=xxxx
TIKTOK_ACCESS_TOKEN=xxxx`}
            />
            <CodeBlock
              label="سپس سرویس را ری‌استارت کنید"
              code={`sudo systemctl restart naqoli`}
            />
            <Note>
              تا قبل از دریافت توکن، پنل در حالت «شبیه‌سازی انتشار» کار می‌کند: همه مراحل تولید، زمان‌بندی، آپلود و آمار به‌صورت کامل و زنده اجرا می‌شوند تا جریان کاری را ببینید و به مشتری نشان دهید.
            </Note>
          </Step>

          {/* manage */}
          <section id="manage" className="scroll-mt-24">
            <Card className="animate-pop overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-sun-100 text-sun-600">
                  <IconTerminal className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl">دستورات مدیریت روزمره</h2>
              </div>
              <div className="overflow-x-auto p-5">
                <table className="w-full min-w-[480px]">
                  <tbody>
                    <TRow k="sudo systemctl status naqoli" v="وضعیت سرویس" />
                    <TRow k="sudo systemctl restart naqoli" v="ری‌استارت اپلیکیشن" />
                    <TRow k="journalctl -fu naqoli" v="مشاهده لاگ زنده" />
                    <TRow k="sudo bash setup.sh --update" v="به‌روزرسانی کد + بیلد + ری‌استارت" />
                    <TRow k="sudo bash setup.sh --status" v="گزارش سریع سلامت سرویس" />
                    <TRow k="sudo systemctl restart caddy" v="ری‌استارت وب‌سرور (دامنه/SSL)" />
                    <TRow k="sudo systemctl restart postgresql" v="ری‌استارت دیتابیس" />
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* backup */}
          <section id="backup" className="scroll-mt-24">
            <Card className="animate-pop overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ece4f9] text-berry-500">
                  <IconKey className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl">پشتیبان‌گیری از دیتابیس</h2>
                <Badge tone="berry" className="ms-auto">مهم</Badge>
              </div>
              <div className="space-y-4 p-5 text-xs leading-6">
                <p>هر چند وقت یک‌بار از دیتابیس نسخه پشتیبان بگیرید (رمز دیتابیس در <span dir="ltr" className="font-mono">.env</span> ذخیره شده است):</p>
                <CodeBlock
                  label="بکاپ دستی"
                  code={`PGPASSWORD="رمز_دیتابیس" pg_dump -h 127.0.0.1 -U postgres app_db > backup-$(date +%F).sql`}
                />
                <CodeBlock
                  label="بازگردانی بکاپ"
                  code={`PGPASSWORD="رمز_دیتابیس" psql -h 127.0.0.1 -U postgres app_db < backup-2025-01-01.sql`}
                />
                <CodeBlock
                  label="بکاپ خودکار روزانه ساعت ۳ بامداد (کران‌جاب)"
                  code={`echo '0 3 * * * PGPASSWORD="رمز" pg_dump -h 127.0.0.1 -U postgres app_db > /root/backups/db-$(date +\\%F).sql' | crontab -`}
                />
              </div>
            </Card>
          </section>

          {/* troubleshooting */}
          <section id="trouble" className="scroll-mt-24">
            <Card className="animate-pop overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#fde3e1] text-ruby-500">
                  🛠️
                </span>
                <h2 className="font-display text-xl">عیب‌یابی مشکلات رایج</h2>
              </div>
              <div className="divide-y divide-line">
                {[
                  { p: "سرویس بالا نمی‌آید و خطای پورت می‌دهد", s: "پورت ۳۰۰۰ اشغال است: با «sudo bash setup.sh --port 8080 --domain …» روی پورت دیگر نصب کنید یا پروسه قبلی را ببندید." },
                  { p: "خطای اتصال به دیتابیس (ECONNREFUSED)", s: "بررسی کنید سرویس فعال باشد: «sudo systemctl status postgresql» و مقدار DATABASE_URL در فایل .env درست باشد." },
                  { p: "بیلد به‌خاطر کمبود رم شکست می‌خورد", s: "روی سرورهای ۱ گیگ، اول حافظه موقت بسازید: «sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile»" },
                  { p: "آدرس دامنه باز نمی‌شود (502)", s: "مطمئن شوید رکورد A دامنه به آی‌پی سرور وصل است و «journalctl -u naqoli» خطایی ندارد؛ سپس «sudo systemctl restart caddy»." },
                  { p: "ربات تلگرام پاسخ نمی‌دهد", s: "خروجی «getWebhookInfo» را چک کنید؛ آدرس وب‌هوک باید دقیقاً https://دامنه شما + /api/webhook باشد و توکن ربات در پنل ذخیره شده باشد." },
                  { p: "بعد از ری‌استارت سرور، اپ بالا نیامد", s: "سرویس خودکار فعال است (systemctl enable شده)؛ اگر نشد: «sudo systemctl enable --now naqoli»." },
                ].map((x) => (
                  <div key={x.p} className="px-5 py-3.5">
                    <p className="text-xs font-bold text-ruby-500">❓ {x.p}</p>
                    <p className="mt-1.5 text-xs leading-6 text-ink-700">✅ {x.s}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

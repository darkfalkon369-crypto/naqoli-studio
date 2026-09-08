-- Seed: settings
INSERT INTO settings (id, auto_generate, auto_publish, daily_limit, voice_style, watermark, safe_mode, hashtags, bot_token, webhook_url, chat_id)
VALUES (1, true, true, 4, 'شاد و کودکانه', true, true, '#کودک #آموزش_کودکان #قصه_کودکانه #تیک_تاک_کودک', 'YOUR_TELEGRAM_BOT_TOKEN_HERE', 'https://yourdomain.com/api/webhook', '-1009283746512')
ON CONFLICT (id) DO NOTHING;

-- Seed: TikTok accounts
INSERT INTO accounts (username, display_name, followers, videos_count, status, connected_at) VALUES
('naqoli_kids', 'نقلی‌استودیو | دنیای کودک', 48230, 132, 'active', now() - interval '92 days'),
('koodak_shad', 'کودک شاد 🎈 آموزش با بازی', 21540, 64, 'active', now() - interval '45 days')
ON CONFLICT (username) DO NOTHING;

-- Seed: published videos across the last 14 days
INSERT INTO videos (title, category, status, stage, duration_sec, account_id, published_at, views, likes, shares, comments, hashtags, thumbnail, voice_style) VALUES
('شیر کوچولو و دوستانش در جنگل', 'حیوانات', 'published', 5, 32, 1, now() - interval '14 days', 86200, 7400, 1900, 430, '#حیوانات #کودک #قصه_کودکانه', '/thumbs/animals.jpg', 'شاد و کودکانه'),
('شمارش ستاره‌ها از ۱ تا ۱۰ ✨', 'اعداد', 'published', 5, 28, 1, now() - interval '13 days', 54100, 4900, 1100, 260, '#آموزش_اعداد #کودک #شمارش', '/thumbs/numbers.jpg', 'آرام و مهربان'),
('رنگ‌های رنگین‌کمان را بشناس 🌈', 'رنگ‌ها', 'published', 5, 30, 2, now() - interval '11 days', 112400, 9800, 2600, 540, '#رنگ_ها #آموزش_کودکان #رنگین_کمان', '/thumbs/colors.jpg', 'شاد و کودکانه'),
('سفر به سیاره‌ها با ربات نقلی 🚀', 'سیارات', 'published', 5, 40, 1, now() - interval '10 days', 38900, 3200, 800, 190, '#فضا #سیارات #کودک', '/thumbs/space.jpg', 'هیجانی و ماجراجو'),
('صدای ماشین‌ها را حدس بزن 🚒', 'وسایل نقلیه', 'published', 5, 26, 2, now() - interval '8 days', 96700, 8100, 2100, 480, '#ماشین #حدس_بزن #کودک', '/thumbs/vehicles.jpg', 'شاد و کودکانه'),
('الفبای فارسی با حیوانات بامزه', 'الفبا', 'published', 5, 35, 1, now() - interval '7 days', 61200, 5300, 1300, 310, '#الفبا #آموزش_کودکان #حیوانات', '/thumbs/alphabet.jpg', 'شاد و کودکانه'),
('جوجه‌تیغی مهربان و قصه دوستی', 'حیوانات', 'published', 5, 44, 2, now() - interval '5 days', 143800, 12900, 3400, 720, '#قصه_کودکانه #دوستی #کودک', '/thumbs/animals.jpg', 'آرام و مهربان'),
('جمع و تفریق با سیب‌های قرمز 🍎', 'اعداد', 'published', 5, 30, 1, now() - interval '4 days', 47600, 4100, 950, 240, '#ریاضی_کودک #آموزش #اعداد', '/thumbs/numbers.jpg', 'شاد و کودکانه'),
('ترانه رنگ‌ها: قرمز، آبی، زرد 🎨', 'رنگ‌ها', 'published', 5, 27, 1, now() - interval '2 days', 88300, 7600, 1800, 410, '#ترانه_کودکانه #رنگ_ها #کودک', '/thumbs/colors.jpg', 'شاد و کودکانه'),
('موشک نقلی به ماه می‌رود 🌙', 'سیارات', 'published', 5, 38, 2, now() - interval '1 day', 29400, 2600, 610, 150, '#فضا #ماه #کودک', '/thumbs/space.jpg', 'هیجانی و ماجراجو');

-- Seed: scheduled (future), queued, generating
INSERT INTO videos (title, category, status, stage, duration_sec, account_id, scheduled_at, hashtags, thumbnail, voice_style) VALUES
('قطار شاد حروف الفبا 🚂', 'الفبا', 'scheduled', 5, 33, 1, now() + interval '3 hours', '#الفبا #قطار #کودک', '/thumbs/alphabet.jpg', 'شاد و کودکانه'),
('ماشین آتش‌نشانی قهرمان شهر 🚒', 'وسایل نقلیه', 'queued', 5, 29, 2, NULL, '#ماشین #آتش_نشانی #کودک', '/thumbs/vehicles.jpg', 'شاد و کودکانه'),
('رقص رنگ‌ها با مداد شمعی 🖍️', 'رنگ‌ها', 'generating', 2, 31, NULL, NULL, '#رنگ_ها #خلاقیت #کودک', '/thumbs/colors.jpg', 'شاد و کودکانه');

-- Backdate creation times so the daily counter stays honest
UPDATE videos SET created_at = COALESCE(published_at, now() - interval '1 day')
WHERE published_at IS NOT NULL OR status IN ('queued','scheduled');
UPDATE settings SET daily_limit = 6 WHERE id = 1;

-- Seed: bot activity logs
INSERT INTO bot_logs (source, level, message, created_at) VALUES
('engine', 'info', 'استودیو خودکار راه‌اندازی شد؛ موتور تولید نسخه ۲.۴ فعال است.', now() - interval '6 hours'),
('telegram', 'info', 'کاربر @maryam_mommy دستور /start را ارسال کرد و به کانال معرفی شد.', now() - interval '5 hours'),
('engine', 'info', 'ویدئوی «ترانه رنگ‌ها» با موفقیت رندر شد و در صف انتشار قرار گرفت.', now() - interval '4 hours'),
('tiktok', 'info', 'ویدئوی «موشک نقلی به ماه می‌رود» روی حساب @koodak_shad منتشر شد.', now() - interval '1 day'),
('moderation', 'info', 'بررسی ایمنی محتوای کودک برای ۳ ویدئو انجام شد؛ هیچ مورد مشکوکی یافت نشد.', now() - interval '3 hours'),
('telegram', 'info', 'دستور /stats پاسخ داده شد؛ گزارش هفتگی برای ادمین ارسال گردید.', now() - interval '2 hours');

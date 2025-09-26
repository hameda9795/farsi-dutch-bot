# راهنمای تنظیم CI/CD برای Deploy خودکار

## مرحله 1: تنظیم GitHub Secrets

برای اینکه GitHub Actions بتواند به سرور شما متصل شود، باید این اطلاعات را در GitHub Secrets قرار دهید:

### 1. رفتن به تنظیمات Repository
1. برید به repository خودتان در GitHub
2. کلیک کنید روی **Settings**
3. در منوی سمت چپ، **Secrets and variables** → **Actions**
4. کلیک کنید روی **New repository secret**

### 2. اضافه کردن Secrets

این سه secret را اضافه کنید:

| نام Secret | مقدار | توضیح |
|------------|--------|--------|
| `HETZNER_HOST` | `91.99.49.208` | IP سرور شما |
| `HETZNER_USER` | `root` | نام کاربری SSH |
| `HETZNER_PASSWORD` | `your_ssh_password` | پسورد SSH سرور |

### 3. نحوه اضافه کردن هر Secret:
1. **Name**: نام secret (مثل `HETZNER_HOST`)
2. **Value**: مقدار secret (مثل `91.99.49.208`)  
3. کلیک روی **Add secret**

## مرحله 2: تست سیستم

### 1. Push کردن تغییرات
```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin master
```

### 2. بررسی نتیجه
1. برید به tab **Actions** در GitHub repository
2. باید workflow جدید را ببینید که در حال اجراست
3. کلیک کنید روی آن تا جزئیات را ببینید

## مرحله 3: نحوه کار سیستم

### چه وقت اجرا می‌شود:
- هر وقت که روی branch `master` یا `main` push کنید
- Pull Request ساخته شود

### چه کاری انجام می‌دهد:
1. ✅ کد جدید را از GitHub می‌گیرد
2. ✅ Dependencies را نصب می‌کند  
3. ✅ تست‌ها را اجرا می‌کند (اگر وجود داشته باشد)
4. ✅ فایل‌ها را روی سرور کپی می‌کند
5. ✅ بات را با PM2 restart می‌کند
6. ✅ گزارش وضعیت می‌دهد

### فایل‌هایی که کپی نمی‌شود:
- `node_modules/` (چون روی سرور `npm install` اجرا می‌شود)
- `.git/` 
- `*.log`
- `.env` (تا اطلاعات شما محفوظ بماند)

## مرحله 4: مانیتورینگ

### بررسی وضعیت Deploy
```bash
# در GitHub Actions tab
- سبز ✅ = موفق
- قرمز ❌ = ناموفق
- زرد 🟡 = در حال اجرا
```

### بررسی بات روی سرور
```bash
ssh root@91.99.49.208
pm2 status
pm2 logs farsi-dutch-bot
```

## مرحله 5: رفع مشکلات متداول

### 1. خطای اتصال SSH
- بررسی کنید IP، username و password درست وارد شده
- مطمئن شوید سرور روشن است

### 2. خطای PM2
```bash
# در سرور
pm2 kill
pm2 start ecosystem.config.js
```

### 3. خطای Dependencies  
```bash
# در سرور
cd /home/farsi-dutch-bot
rm -rf node_modules package-lock.json
npm install
```

## مرحله 6: ویژگی‌های اضافی

### Backup خودکار
سیستم قبل از هر deploy یک backup می‌سازد در:
```
/home/backups/farsi-dutch-bot-YYYYMMDD_HHMMSS/
```

### Rollback در صورت مشکل
```bash
# برگشت به نسخه قبلی
cd /home
cp -r backups/farsi-dutch-bot-[latest_backup]/* farsi-dutch-bot/
cd farsi-dutch-bot
pm2 restart farsi-dutch-bot
```

---

## 🎉 حالا هر وقت تغییری در کد بدهید و push کنید، خودکار روی سرور اعمال می‌شود!

### تست کردن:
1. یک تغییر کوچک در کد بدهید
2. `git add . && git commit -m "test auto deploy" && git push`
3. در GitHub Actions ببینید که deploy انجام شده
4. بات تلگرام شما با تغییرات جدید کار می‌کند! 🤖
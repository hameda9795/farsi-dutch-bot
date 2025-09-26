# سیستم تولید محتوای خودکار برای آموزش زبان هلندی

## نصب و راه‌اندازی

### پیش‌نیازها:
1. Node.js (نسخه 16 یا بالاتر)
2. npm یا yarn
3. اکانت API Claude
4. ربات تلگرام
5. دسترسی ادمین به کانال @parsibrug

### نصب dependency های جدید:
```bash
npm install @anthropic-ai/sdk
```

### تنظیمات محیط (.env):
```
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY
```

### تنظیمات کانال:
در فایل `config.js`:
```javascript
CHANNEL_MEMBERSHIP: {
    REQUIRED: true,
    CHANNEL_USERNAME: '@parsibrug',
    CHANNEL_LINK: 'https://t.me/parsibrug',
    // ...
}
```

## ویژگی‌های سیستم

### 1. تولید خودکار محتوا
- **فرکانس**: هر ۲ ساعت یک پست
- **کانال هدف**: @parsibrug
- **انواع محتوا**: ۳۰ نوع مختلف آموزشی

### 2. الگوریتم انتخاب محتوا
سیستم بر اساس این اصول عمل می‌کند:
- **عدم تکرار در ۲۴ ساعت**: هیچ نوع محتوایی در روز تکرار نمی‌شود
- **ترکیب متعادل روزانه**:
  - ۴ محتوای گرامری
  - ۴ محتوای واژگان/تلفظ
  - ۲ محتوای مکالمه/کوییز
  - ۲ محتوای کاربردی

### 3. انواع محتوا (۳۰ نوع)

#### گرامر (Grammar):
- `verbs` - افعال پرکاربرد
- `separable_verbs` - افعال جداشدنی
- `inseparable_verbs` - افعال غیرجداشدنی
- `word_order` - ترتیب واژه‌ها (V2)
- `bijzin` - جملات وابسته
- `niet_geen` - منفی‌سازی
- `pronouns` - ضمایر
- `prepositions` - حروف اضافه
- `adjectives` - صفت‌ها
- `te_infinitive` - ساختار te + infinitive
- `modal_verbs` - افعال وجهی
- `irregular_verbs` - افعال نامنظم
- `adverbs` - قیدها

#### واژگان (Vocabulary):
- `vocabulary` - واژگان روزمره
- `de_het` - اسم‌های با de/het
- `diminutive` - مصغرسازی
- `confusing_words` - کلمات گیج‌کننده
- `topic_vocabulary` - واژگان موضوعی
- `collocations` - ترکیبات رایج

#### تلفظ (Pronunciation):
- `pronunciation` - ترکیبات صوتی
- `intonation` - آهنگ جمله

#### مکالمه/تعامل (Interactive):
- `mini_conversation` - مکالمات کوتاه
- `quiz` - کوییز ۳گزینه‌ای
- `dictation` - دیکته

#### کاربردی (Practical):
- `numbers` - اعداد و تاریخ
- `particles` - ذرات محاوره‌ای
- `formal_communication` - ارتباط رسمی
- `idioms` - اصطلاحات
- `common_mistakes` - اشتباهات رایج
- `simplified_news` - اخبار ساده‌شده

### 4. سطوح آموزشی
هر نوع محتوا برای سطوح مختلف قابل تولید است:
- A1 (مبتدی)
- A2 (پایه)
- B1 (متوسط)
- B2 (متوسط پیشرفته)
- C1 (پیشرفته)
- C2 (تسلط)

## قالب خروجی

تمام محتواها با این قالب تولید می‌شوند:

```
################################
#  {ایموجی} [{سطح}] {عنوان کوتاه} #
################################
{متن آموزشی ۳–۶ خط، شفاف و ساده}

💬 چگونه بگوییم؟
• فارسی: «{جملهٔ فارسی کوتاه}»
• هلندی: "{جملهٔ هلندی دقیق}"

📌 مثال‌ها:
1) {مثال ۱}
2) {مثال ۲}

{یکی از این‌ها: 🔎 نکته: … | ⚠️ هشدار: … | 💡 راه میانبر: …}
🏷️ هشتگ‌ها: #{سطح} #{دسته} #{کلیدواژه}
```

## دستورات مدیریتی

### برای ادمین فقط:

#### `/contentstats`
نمایش آمار تولید محتوا:
- آخرین پست
- تعداد پست‌های امروز
- نوع محتواهای امروز
- تاریخچه پست‌ها

#### `/forcepost [نوع] [سطح]`
انتشار اجباری محتوا:
```bash
/forcepost                    # محتوای تصادفی
/forcepost vocabulary A2      # واژگان سطح A2
/forcepost quiz               # کوییز سطح تصادفی
```

#### `/contenttypes`
نمایش لیست کامل انواع محتوا و سطوح

## فایل‌های داده

### `data/content_schedule.json`
ذخیره برنامه‌زمانی و وضعیت تولید محتوا:
```json
{
  "lastPostTime": 1640995200000,
  "dailyContentUsed": ["vocabulary", "verbs"],
  "lastResetDate": "2024-01-01"
}
```

### `data/last_posts.json`
تاریخچه ۵۰ پست آخر:
```json
[
  {
    "timestamp": 1640995200000,
    "type": "vocabulary",
    "level": "A2",
    "content": "################################..."
  }
]
```

## مدیریت خطا

سیستم دارای مکانیزم‌های خطایابی است:
1. **خطای API Claude**: بازگشت به محتوای پیش‌فرض
2. **خطای ارسال تلگرام**: لاگ خطا و ادامه عملیات
3. **خطای فایل داده**: ایجاد مجدد فایل‌ها

## مانیتورینگ

### لاگ‌ها:
```
✅ New content posted successfully
❌ Error in content generation: [خطا]
🤖 Starting automatic content generation system...
```

### بررسی وضعیت:
```bash
# در کنسول
node -e "
const ContentService = require('./services/contentService');
const cs = new ContentService({});
console.log(cs.getContentStats());
"
```

## نکات مهم

1. **دسترسی ادمین**: فقط ادمین تعریف‌شده در `config.js` می‌تواند از دستورات مدیریتی استفاده کند

2. **عضویت کانال**: سیستم تولید محتوا مستقل از سیستم بررسی عضویت عمل می‌کند

3. **تنظیم زمان**: فرکانس ۲ ساعته قابل تنظیم است در `contentService.js`

4. **محدودیت Claude**: API Claude محدودیت درخواست دارد، سیستم خطاها را مدیریت می‌کند

5. **بک‌آپ**: فایل‌های JSON به‌طور خودکار بک‌آپ می‌شوند

## عیب‌یابی

### ربات محتوا پست نمی‌کند:
```bash
# بررسی لاگ‌ها در کنسول
# بررسی فایل content_schedule.json
# تست دستی با /forcepost
```

### خطای API Claude:
```bash
# بررسی CLAUDE_API_KEY در .env
# بررسی کریدیت API Claude
```

### مشکل دسترسی کانال:
```bash
# بررسی @parsibrug در config.js
# اطمینان از دسترسی ادمین ربات به کانال
```

## توسعه

برای اضافه کردن نوع محتوای جدید:

1. در `contentService.js` به آرایه `contentTypes` اضافه کنید
2. در تابع `buildContentPrompt` prompt جدید تعریف کنید
3. ربات را مجدداً راه‌اندازی کنید

مثال:
```javascript
{ 
    type: 'new_content_type', 
    category: 'grammar', 
    weight: 4, 
    level: ['A1', 'A2'] 
}
```

---

*سیستم طراحی‌شده توسط GitHub Copilot برای آموزش خودکار زبان هلندی* 🇳🇱
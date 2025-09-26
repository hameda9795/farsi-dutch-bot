/**
 * Content Service for Dutch Learning Content Generation
 * Generates educational content every 2 hours for @parsibrug channel
 */

const ClaudeService = require('./claudeService');
const fs = require('fs');
const path = require('path');

class ContentService {
    constructor(claudeService) {
        this.claudeService = claudeService;
        this.contentTypes = [
            // Basic content types
            { type: 'vocabulary', category: 'vocabulary', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'verbs', category: 'grammar', weight: 4, level: ['A1', 'A2', 'B1', 'B2'] },
            { type: 'separable_verbs', category: 'grammar', weight: 4, level: ['A2', 'B1', 'B2'] },
            { type: 'inseparable_verbs', category: 'grammar', weight: 4, level: ['B1', 'B2'] },
            { type: 'word_order', category: 'grammar', weight: 4, level: ['A2', 'B1', 'B2'] },
            { type: 'bijzin', category: 'grammar', weight: 4, level: ['B1', 'B2'] },
            { type: 'niet_geen', category: 'grammar', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'pronouns', category: 'grammar', weight: 4, level: ['A1', 'A2'] },
            { type: 'prepositions', category: 'grammar', weight: 4, level: ['A2', 'B1', 'B2'] },
            { type: 'adjectives', category: 'grammar', weight: 4, level: ['A2', 'B1'] },
            { type: 'de_het', category: 'vocabulary', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'diminutive', category: 'vocabulary', weight: 4, level: ['A2', 'B1'] },
            { type: 'pronunciation', category: 'pronunciation', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'intonation', category: 'pronunciation', weight: 4, level: ['A2', 'B1', 'B2'] },
            { type: 'numbers', category: 'practical', weight: 2, level: ['A1', 'A2'] },
            { type: 'confusing_words', category: 'vocabulary', weight: 4, level: ['A2', 'B1', 'B2'] },
            { type: 'topic_vocabulary', category: 'vocabulary', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'te_infinitive', category: 'grammar', weight: 4, level: ['A2', 'B1'] },
            { type: 'modal_verbs', category: 'grammar', weight: 4, level: ['A2', 'B1'] },
            { type: 'particles', category: 'practical', weight: 2, level: ['B1', 'B2', 'C1'] },
            { type: 'formal_communication', category: 'practical', weight: 2, level: ['A2', 'B1'] },
            { type: 'irregular_verbs', category: 'grammar', weight: 4, level: ['A1', 'A2', 'B1'] },
            { type: 'adverbs', category: 'grammar', weight: 4, level: ['A2', 'B1'] },
            { type: 'collocations', category: 'vocabulary', weight: 4, level: ['B1', 'B2', 'C1'] },
            { type: 'idioms', category: 'practical', weight: 2, level: ['B2', 'C1'] },
            { type: 'dictation', category: 'conversation', weight: 2, level: ['A2', 'B1'] },
            { type: 'mini_conversation', category: 'conversation', weight: 2, level: ['A1', 'A2', 'B1'] },
            { type: 'common_mistakes', category: 'practical', weight: 2, level: ['A2', 'B1', 'B2'] },
            { type: 'quiz', category: 'conversation', weight: 2, level: ['A1', 'A2', 'B1', 'B2'] },
            { type: 'simplified_news', category: 'practical', weight: 2, level: ['B1', 'B2', 'C1'] },
            
            // CREATIVE & SPECIAL CONTENT TYPES 🎨
            { type: 'dutch_riddles', category: 'creative', weight: 1, level: ['B1', 'B2', 'C1'] },
            { type: 'word_stories', category: 'creative', weight: 1, level: ['A2', 'B1', 'B2'] },
            { type: 'rhyme_learning', category: 'creative', weight: 1, level: ['A1', 'A2', 'B1'] },
            { type: 'visual_memory', category: 'creative', weight: 1, level: ['A1', 'A2', 'B1'] },
            { type: 'tongue_twisters', category: 'creative', weight: 1, level: ['A2', 'B1', 'B2'] },
            { type: 'dutch_memes', category: 'creative', weight: 1, level: ['B1', 'B2', 'C1'] },
            { type: 'cultural_insights', category: 'creative', weight: 1, level: ['B1', 'B2', 'C1'] },
            { type: 'word_games', category: 'creative', weight: 1, level: ['A2', 'B1', 'B2'] },
            { type: 'etymology_fun', category: 'creative', weight: 1, level: ['B2', 'C1'] },
            { type: 'sound_associations', category: 'creative', weight: 1, level: ['A1', 'A2', 'B1'] },
            { type: 'interactive_challenge', category: 'creative', weight: 1, level: ['A2', 'B1', 'B2'] },
            { type: 'dutch_humor', category: 'creative', weight: 1, level: ['B2', 'C1'] },
            { type: 'street_smart_dutch', category: 'creative', weight: 1, level: ['B1', 'B2'] },
            { type: 'emotion_expressions', category: 'creative', weight: 1, level: ['A2', 'B1', 'B2'] },
            { type: 'daily_life_hacks', category: 'creative', weight: 1, level: ['A2', 'B1'] }
        ];
        
        this.scheduleFilePath = path.join(__dirname, '../data/content_schedule.json');
        this.lastPostsFilePath = path.join(__dirname, '../data/last_posts.json');
        this.initializeSchedule();
    }

    initializeSchedule() {
        // Create data directory if it doesn't exist
        const dataDir = path.dirname(this.scheduleFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Initialize schedule file if it doesn't exist
        if (!fs.existsSync(this.scheduleFilePath)) {
            const initialSchedule = {
                lastPostTime: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
                dailyContentUsed: [],
                lastResetDate: new Date().toDateString()
            };
            fs.writeFileSync(this.scheduleFilePath, JSON.stringify(initialSchedule, null, 2));
        }

        // Initialize last posts file
        if (!fs.existsSync(this.lastPostsFilePath)) {
            fs.writeFileSync(this.lastPostsFilePath, JSON.stringify([], null, 2));
        }
    }

    loadSchedule() {
        return JSON.parse(fs.readFileSync(this.scheduleFilePath, 'utf8'));
    }

    saveSchedule(schedule) {
        fs.writeFileSync(this.scheduleFilePath, JSON.stringify(schedule, null, 2));
    }

    loadLastPosts() {
        return JSON.parse(fs.readFileSync(this.lastPostsFilePath, 'utf8'));
    }

    saveLastPosts(posts) {
        fs.writeFileSync(this.lastPostsFilePath, JSON.stringify(posts.slice(-50), null, 2)); // Keep last 50 posts
    }

    /**
     * Check if it's time to post new content
     */
    shouldPostContent() {
        const schedule = this.loadSchedule();
        const now = Date.now();
        const timeSinceLastPost = now - schedule.lastPostTime;
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

        return timeSinceLastPost >= twoHours;
    }

    /**
     * Reset daily content if it's a new day
     */
    resetDailyContentIfNeeded(schedule) {
        const today = new Date().toDateString();
        if (schedule.lastResetDate !== today) {
            schedule.dailyContentUsed = [];
            schedule.lastResetDate = today;
            return true;
        }
        return false;
    }

    /**
     * Select next content type based on daily requirements
     */
    selectNextContentType(schedule) {
        // Count current daily usage by category
        const dailyStats = {
            grammar: 0,
            vocabulary: 0,
            pronunciation: 0,
            conversation: 0,
            practical: 0,
            creative: 0 // New creative category
        };

        schedule.dailyContentUsed.forEach(contentType => {
            const typeInfo = this.contentTypes.find(t => t.type === contentType);
            if (typeInfo) {
                dailyStats[typeInfo.category]++;
            }
        });

        // Check daily requirements (minimum per 24 hours = 12 posts)
        const requirements = {
            grammar: 3, // Reduced from 4
            vocabulary: 3, // Reduced from 4 (includes pronunciation)
            conversation: 2,
            practical: 2,
            creative: 2 // New creative requirement! 🎨
        };

        // 20% chance to force creative content if not used enough
        const creativeChance = Math.random();
        const needsMoreCreative = dailyStats.creative < requirements.creative;
        const shouldForceCreative = needsMoreCreative && creativeChance < 0.3; // 30% chance

        // Find content types that meet requirements and haven't been used in 24 hours
        let availableTypes = this.contentTypes.filter(contentType => {
            const category = contentType.category === 'pronunciation' ? 'vocabulary' : contentType.category;
            const currentCount = dailyStats[category] || 0;
            const requirement = requirements[category] || 0;
            
            // Force creative if needed
            if (shouldForceCreative && contentType.category === 'creative') {
                return true;
            }
            
            // Don't use if already used today (unless all categories are satisfied)
            const notUsedToday = !schedule.dailyContentUsed.includes(contentType.type);
            const categoryNeedsMore = currentCount < requirement;
            
            return notUsedToday || categoryNeedsMore;
        });

        // If forcing creative, filter to only creative types
        if (shouldForceCreative) {
            const creativeTypes = availableTypes.filter(ct => ct.category === 'creative');
            if (creativeTypes.length > 0) {
                availableTypes = creativeTypes;
            }
        }

        // If no available types, reset (all requirements met)
        if (availableTypes.length === 0) {
            availableTypes = this.contentTypes;
        }

        // Prioritize by requirements
        const priorityTypes = availableTypes.filter(contentType => {
            const category = contentType.category === 'pronunciation' ? 'vocabulary' : contentType.category;
            const currentCount = dailyStats[category] || 0;
            const requirement = requirements[category] || 0;
            return currentCount < requirement;
        });

        const finalTypes = priorityTypes.length > 0 ? priorityTypes : availableTypes;
        
        // Select random from available types
        const selected = finalTypes[Math.floor(Math.random() * finalTypes.length)];
        
        // Log creative content selection
        if (selected.category === 'creative') {
            console.log(`🎨 Creative content selected: ${selected.type}`);
        }
        
        return selected;
    }

    /**
     * Generate content based on type
     */
    async generateContent(contentType, level) {
        const prompt = this.buildContentPrompt(contentType, level);
        
        try {
            const response = await this.claudeService.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                temperature: 0.8, // More creative
                system: `تو یک دستیار خلاق و باهوش تولید محتوای آموزش زبان هلندی برای فارسی‌زبان‌ها هستی. 

ویژگی‌های شما:
🎨 خلاقیت بالا: محتوا باید منحصربه‌فرد، جذاب و قابل‌یادآوری باشد
🧠 هوش آموزشی: همیشه جنبه آموزشی حفظ کن اما با روش‌های نوآورانه
🎯 تأثیرگذاری: محتوا باید برای مدت طولانی در ذهن بماند
🌟 تنوع: از روش‌های متفاوت استفاده کن (داستان، بازی، معما، طنز)

⚠️ مهم: در تیترها سطح (A1, A2, B1, B2 و غیره) را ذکر نکن!

حتماً قالب دقیق زیر را رعایت کن:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ {ایموجی} {عنوان جذاب بدون ذکر سطح} ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

{متن آموزشی خلاقانه}

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «{جمله فارسی}»
★ هلندی: "{جمله هلندی}"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی  
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: {چالش آموزشی}

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #{هشتگ1} #{هشتگ2} #{هشتگ3}

اصول مهم:
- محتوا خاص و منحصربه‌فرد باشد
- از تکنیک‌های حافظه و یادگیری استفاده کن
- عنصر سرگرمی داشته باشد
- لحن دوستانه و انرژی‌بخش
- اطلاعات فرهنگی جالب اضافه کن
- سطح (${level}) در تیتر ذکر نشود!`,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return response.content[0].text.trim();
        } catch (error) {
            console.error('Error generating creative content:', error);
            return this.getFallbackContent(contentType, level);
        }
    }

    buildContentPrompt(contentType, level) {
        const prompts = {
            vocabulary: `محتوای واژگان روزمره سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 📚 واژگان روزمره: [موضوع واژگان] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی واژگان]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [یک چالش یادگیری کوتاه]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #واژگان #هلندی #یادگیری`,
            
            verbs: `محتوای افعال پرکاربرد سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🔄 افعال پرکاربرد: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی افعال]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ فعل1 [تلفظ] = معنی
✪ فعل2 [تلفظ] = معنی
✪ فعل3 [تلفظ] = معنی

🎯 چالش: [یک چالش صرف فعل]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #افعال #گرامر #هلندی`,
            
            separable_verbs: `محتوای افعال جداشدنی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ ↔️ افعال جداشدنی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی افعال جداشدنی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ فعل1 [تلفظ] = معنی
✪ فعل2 [تلفظ] = معنی
✪ فعل3 [تلفظ] = معنی

🎯 چالش: [یک چالش افعال جداشدنی]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #افعال_جداشدنی #گرامر #هلندی`,
            
            inseparable_verbs: `محتوای افعال غیرجداشدنی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ ⭐ افعال غیرجداشدنی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی افعال غیرجداشدنی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ فعل1 [تلفظ] = معنی
✪ فعل2 [تلفظ] = معنی
✪ فعل3 [تلفظ] = معنی

🎯 چالش: [یک چالش افعال غیرجداشدنی]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #افعال_غیرجداشدنی #گرامر #هلندی`,
            
            word_order: `محتوای ترتیب واژه‌ها سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🔄 ترتیب کلمات: قانون V2 ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی ترتیب کلمات]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ مفهوم1 [تلفظ] = معنی
✪ مفهوم2 [تلفظ] = معنی
✪ مفهوم3 [تلفظ] = معنی

🎯 چالش: [یک چالش ترتیب کلمات]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #ترتیب_کلمات #گرامر #هلندی`,
            
            bijzin: `محتوای جمله وابسته سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🔗 جمله وابسته (Bijzin) ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی bijzin]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ ربط1 [تلفظ] = معنی
✪ ربط2 [تلفظ] = معنی
✪ ربط3 [تلفظ] = معنی

🎯 چالش: [یک چالش bijzin]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #bijzin #جمله_وابسته #گرامر`,
            
            niet_geen: `محتوای منفی‌سازی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ ❌ منفی‌سازی: niet vs geen ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی niet و geen]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ niet [نیت] = نه/نمی
✪ geen [خین] = هیچ
✪ نکته3 [تلفظ] = معنی

🎯 چالش: [یک چالش niet/geen]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #منفی_سازی #niet_geen #گرامر`,
            
            pronouns: `محتوای ضمایر سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 👤 ضمایر شخصی و مؤدبانه ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی ضمایر]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ jij/je [یِی/یِ] = تو
✪ u [او] = شما (مؤدبانه)
✪ ضمیر3 [تلفظ] = معنی

🎯 چالش: [یک چالش ضمایر]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #ضمایر #مؤدب #هلندی`,
            
            prepositions: `محتوای حروف اضافه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🔗 حروف اضافه دردسرساز ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی حروف اضافه]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ op [اُپ] = روی
✪ in [این] = در
✪ naar [نار] = به سمت

🎯 چالش: [یک چالش حروف اضافه]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #حروف_اضافه #گرامر #هلندی`,
            
            adjectives: `محتوای صفت‌ها سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🎨 صفت‌ها و پسوند -e ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی صفت‌ها]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ صفت1 [تلفظ] = معنی
✪ صفت2 [تلفظ] = معنی
✪ صفت3 [تلفظ] = معنی

🎯 چالش: [یک چالش صفت‌ها]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #صفت_ها #de_het #گرامر`,
            
            de_het: `محتوای جنسیت اسم‌ها سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ ⚖️ de یا het: راز جنسیت اسم‌ها ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی de/het]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ de + اسم1 [تلفظ] = معنی
✪ het + اسم2 [تلفظ] = معنی
✪ نکته [تلفظ] = معنی

🎯 چالش: [یک چالش de/het]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #de_het #اسم_ها #هلندی`,
            
            pronunciation: `محتوای تلفظ سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🗣️ تلفظ هلندی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای آموزشی تلفظ]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ دقیق] = معنی
✪ کلمه2 [تلفظ دقیق] = معنی
✪ کلمه3 [تلفظ دقیق] = معنی

🎯 چالش: [یک چالش تلفظ]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #تلفظ #pronunciation #هلندی`,
            
            quiz: `یک کوییز ۳گزینه‌ای سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🧩 کوییز هلندی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[سؤال کوییز]

أ) گزینه اول
ب) گزینه دوم  
ج) گزینه سوم

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 پاسخ: [پاسخ صحیح + توضیح]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #کوییز #quiz #هلندی`,
            
            mini_conversation: `یک مکالمه مینی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 💬 مکالمه روزمره: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[مکالمه ۲-۴ خطی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله کلیدی فارسی]»
★ هلندی: "[جمله کلیدی هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ عبارت1 [تلفظ] = معنی
✪ عبارت2 [تلفظ] = معنی
✪ عبارت3 [تلفظ] = معنی

🎯 چالش: [تمرین مکالمه]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #مکالمه #conversation #هلندی`,
            
            simplified_news: `یک خبر ساده سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 📰 خبر امروز: [موضوع خبر] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[خبر ساده شده]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله خبری فارسی]»
★ هلندی: "[جمله خبری هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [چالش ساخت جمله خبری]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #خبر #اخبار #هلند`,
            
            common_mistakes: `محتوای اشتباهات رایج سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ ⚠️ اشتباهات رایج فارسی‌زبان‌ها ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

❌ اشتباه: [جمله اشتباه]
✅ درست: [جمله درست]

[توضیح اشتباه]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ نکته1 [تلفظ] = معنی
✪ نکته2 [تلفظ] = معنی
✪ نکته3 [تلفظ] = معنی

🎯 چالش: [چالش اصلاح اشتباه]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #اشتباهات_رایج #نکات #گرامر`,
            
            // CREATIVE CONTENT PROMPTS 🎨
            dutch_riddles: `یک معما هلندی خلاقانه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🧩 معمای هلندی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

🤔 [معمای آموزشی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 پاسخ: [پاسخ معما + توضیح]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #معما #riddle #خلاقیت`,
            
            word_stories: `یک داستان کلمه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 📚 داستان کلمه: [کلمه هلندی] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[داستان کوتاه و جذاب]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه اصلی [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [چالش مرتبط با داستان]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #داستان #story #یادگیری`,
            
            rhyme_learning: `محتوای یادگیری با قافیه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🎵 یادگیری با قافیه: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[شعر یا ترانه آموزشی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [چالش قافیه‌سازی]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #قافیه #rhyme #حفظ`,
            
            visual_memory: `تکنیک حافظه تصویری سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🖼️ حافظه تصویری: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[تکنیک ارتباط تصویری]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی + [ارتباط تصویری]
✪ کلمه2 [تلفظ] = معنی + [ارتباط تصویری]
✪ کلمه3 [تلفظ] = معنی + [ارتباط تصویری]

🎯 چالش: [چالش حافظه تصویری]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #حافظه_تصویری #visual #یادگیری`,
            
            tongue_twisters: `جمله سخت‌التفظ هلندی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🗣️ سخت‌التفظ هلندی ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[جمله سخت‌التفظ]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[ترجمه فارسی]»
★ هلندی: "[جمله سخت‌التفظ]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ دقیق] = معنی
✪ کلمه2 [تلفظ دقیق] = معنی
✪ کلمه3 [تلفظ دقیق] = معنی

🎯 چالش: سه بار پشت سر هم بگویید!

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #تلفظ #tongue_twister #تمرین`,
            
            dutch_memes: `محتوای طنز و میم فرهنگی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 😄 طنز هلندی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای طنز و فرهنگی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی + [توضیح فرهنگی]
✪ کلمه2 [تلفظ] = معنی + [توضیح فرهنگی]
✪ کلمه3 [تلفظ] = معنی + [توضیح فرهنگی]

🎯 نکته فرهنگی: [نکته جالب]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #طنز #فرهنگ #هلند`,
            
            cultural_insights: `بینش فرهنگی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🏛️ فرهنگ هلند: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[بینش فرهنگی جالب]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی + [زمینه فرهنگی]
✪ کلمه2 [تلفظ] = معنی + [زمینه فرهنگی]
✪ کلمه3 [تلفظ] = معنی + [زمینه فرهنگی]

🎯 نکته: [نکته فرهنگی مهم]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #فرهنگ #culture #هلند`,
            
            word_games: `یک بازی کلمات خلاقانه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🎮 بازی کلمات هلندی ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[بازی کلمات خلاقانه]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [قوانین بازی و چالش]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #بازی #word_game #سرگرمی`,
            
            etymology_fun: `تاریخچه کلمه سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 📜 سفر در تاریخ کلمه: [کلمه] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[داستان تاریخی کلمه]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه اصلی [تلفظ] = معنی + [ریشه تاریخی]
✪ کلمه مرتبط1 [تلفظ] = معنی
✪ کلمه مرتبط2 [تلفظ] = معنی

🎯 نکته تاریخی: [نکته جالب]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #تاریخ #etymology #ریشه_کلمات`,
            
            sound_associations: `تکنیک انجمن صوتی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🔊 یادگیری با انجمن صوتی ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[تکنیک ربط صوتی با فارسی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی + [شباهت صوتی]
✪ کلمه2 [تلفظ] = معنی + [شباهت صوتی]
✪ کلمه3 [تلفظ] = معنی + [شباهت صوتی]

🎯 چالش: [چالش انجمن صوتی]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #انجمن_صوتی #sound #یادگیری`,
            
            interactive_challenge: `چالش تعاملی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🎯 چالش تعاملی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[چالش سرگرم‌کننده]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی
✪ کلمه2 [تلفظ] = معنی
✪ کلمه3 [تلفظ] = معنی

🎯 چالش: [دستورالعمل چالش]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #چالش #interactive #تعامل`,
            
            dutch_humor: `طنز هلندی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 😂 طنز هلندی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[محتوای طنز آموزشی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه طنز1 [تلفظ] = معنی + [چرا خنده‌داره]
✪ کلمه طنز2 [تلفظ] = معنی + [چرا خنده‌داره]
✪ کلمه طنز3 [تلفظ] = معنی + [چرا خنده‌داره]

🎯 نکته طنز: [توضیح طنز]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #طنز #humor #خنده`,
            
            street_smart_dutch: `عبارات خیابانی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🛣️ هلندی خیابانی: [موضوع] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[عبارات محاوره‌ای واقعی]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ عبارت1 [تلفظ] = معنی + [کی استفاده می‌شه]
✪ عبارت2 [تلفظ] = معنی + [کی استفاده می‌شه]
✪ عبارت3 [تلفظ] = معنی + [کی استفاده می‌شه]

🎯 نکته: در کتاب‌ها نیست!

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #محاوره #street #واقعی`,
            
            emotion_expressions: `راه‌های ابراز احساسات سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 💭 ابراز احساسات: [نوع احساس] ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[راه‌های مختلف ابراز احساس]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله احساسی فارسی]»
★ هلندی: "[جمله احساسی هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ احساس1 [تلفظ] = معنی + [درجه شدت]
✪ احساس2 [تلفظ] = معنی + [درجه شدت]
✪ احساس3 [تلفظ] = معنی + [درجه شدت]

🎯 چالش: [تمرین ابراز احساس]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #احساسات #emotions #ابراز`,
            
            daily_life_hacks: `ترفند زندگی سطح ${level} بساز به شکل پست تلگرامی جذاب:

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 💡 ترفند زندگی در هلند ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

[ترفند عملی + آموزش زبان]

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «[جمله فارسی]»
★ هلندی: "[جمله هلندی]"

✦ 📌 واژه‌های کلیدی ✦
✪ کلمه1 [تلفظ] = معنی + [کاربرد عملی]
✪ کلمه2 [تلفظ] = معنی + [کاربرد عملی]
✪ کلمه3 [تلفظ] = معنی + [کاربرد عملی]

🎯 نکته: [نکته مفید برای زندگی]

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #ترفند #life_hack #هلند`
        };

        return prompts[contentType.type] || `محتوای آموزشی خلاقانه ${contentType.type} سطح ${level} بساز. محتوا باید منحصربه‌فرد، جذاب و قابل‌یادآوری باشد.`;
    }

    getFallbackContent(contentType, level) {
        const creativeFallbacks = [
            {
                content: `✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🎨 چالش خلاقانه: وقت خلاقیت! ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

وقتی کامپیوتر خسته می‌شود، انسان‌ها باید خلاقیت به‌خرج دهند! 🧠✨ بیایید با کلمات هلندی بازی کنیم و یادگیری را سرگرم‌کننده کنیم.

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «بیا بازی کنیم»
★ هلندی: "Laten we spelen"

✦ 📌 واژه‌های کلیدی ✦
✪ creativiteit [کری‌آتی‌فی‌تِیت] = خلاقیت، چیزی که هیچ ماشینی نداره!
✪ verbeelding [فِر‌بیل‌دینگ] = تصور، قدرت شگفت‌انگیز ذهن انسان
✪ spelen [اسپی‌لِن] = بازی کردن

🎯 چالش: یک کلمه هلندی پیدا کن که با حرف آخر "spelen" شروع شود!

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #خلاقیت #بازی #سرگرمی`
            },
            {
                content: `✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
✧ 🌟 لحظه جادویی: الهام ناگهانی! ✧
✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦

گاهی بهترین درس‌ها در لحظات غیرمنتظره اتفاق می‌افتند! ✨🎭 همین الان یک کلمه هلندی تصادفی رو انتخاب کن و با دوستت تمرین کن.

✦ 💬 چگونه بگوییم؟ ✦
★ فارسی: «این لحظه جادوییه»
★ هلندی: "Dit is een magisch moment"

✦ 📌 واژه‌های کلیدی ✦
✪ spontaan [اسپُن‌تان] = خودجوش، مثل همین لحظه!
✪ verrassing [فِر‌راسینگ] = سورپرایز، چیزی که انتظارش نداری
✪ gezellig [خِ‌زِلیخ] = دنج و صمیمی (کلمه بی‌نظیر هلندی!)

🎯 نکته جالب: هلندی‌ها عاشق کلمه "gezellig" هستند که معادل فارسی نداره!

✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦✧✦
🏷️ #جادو #لحظه #کشف`
            }
        ];
        
        const randomFallback = creativeFallbacks[Math.floor(Math.random() * creativeFallbacks.length)];
        return randomFallback.content;
    }

    /**
     * Generate and post content if needed
     */
    async checkAndPostContent(bot, channelUsername) {
        if (!this.shouldPostContent()) {
            return false;
        }

        try {
            const schedule = this.loadSchedule();
            this.resetDailyContentIfNeeded(schedule);
            
            const contentType = this.selectNextContentType(schedule);
            const availableLevels = contentType.level;
            const selectedLevel = availableLevels[Math.floor(Math.random() * availableLevels.length)];
            
            const content = await this.generateContent(contentType, selectedLevel);
            
            // Post to channel (no markdown to avoid parsing issues)
            await bot.sendMessage(channelUsername, content);
            
            // Update schedule
            schedule.lastPostTime = Date.now();
            schedule.dailyContentUsed.push(contentType.type);
            this.saveSchedule(schedule);
            
            // Save to last posts
            const lastPosts = this.loadLastPosts();
            lastPosts.push({
                timestamp: Date.now(),
                type: contentType.type,
                level: selectedLevel,
                content: content.substring(0, 200) + '...' // Store preview
            });
            this.saveLastPosts(lastPosts);
            
            console.log(`✅ Posted ${contentType.type} content (${selectedLevel}) to ${channelUsername}`);
            return true;
            
        } catch (error) {
            console.error('Error posting content:', error);
            return false;
        }
    }

    /**
     * Get content statistics
     */
    getContentStats() {
        const schedule = this.loadSchedule();
        const lastPosts = this.loadLastPosts();
        
        return {
            lastPostTime: new Date(schedule.lastPostTime).toLocaleString('fa-IR'),
            dailyContentUsed: schedule.dailyContentUsed,
            totalPostsToday: schedule.dailyContentUsed.length,
            lastFivePosts: lastPosts.slice(-5).map(post => ({
                time: new Date(post.timestamp).toLocaleString('fa-IR'),
                type: post.type,
                level: post.level
            }))
        };
    }

    /**
     * Force post content (admin command)
     */
    async forcePostContent(bot, channelUsername, contentType = null, level = null) {
        try {
            const schedule = this.loadSchedule();
            
            let selectedContentType;
            if (contentType) {
                selectedContentType = this.contentTypes.find(t => t.type === contentType);
                if (!selectedContentType) {
                    throw new Error(`نوع محتوای "${contentType}" یافت نشد`);
                }
            } else {
                selectedContentType = this.selectNextContentType(schedule);
            }
            
            const availableLevels = selectedContentType.level;
            const selectedLevel = level && availableLevels.includes(level) 
                ? level 
                : availableLevels[Math.floor(Math.random() * availableLevels.length)];
            
            const content = await this.generateContent(selectedContentType, selectedLevel);
            
            // Post to channel (no markdown to avoid parsing issues)
            await bot.sendMessage(channelUsername, content);
            
            // Update schedule
            schedule.lastPostTime = Date.now();
            if (!schedule.dailyContentUsed.includes(selectedContentType.type)) {
                schedule.dailyContentUsed.push(selectedContentType.type);
            }
            this.saveSchedule(schedule);
            
            return {
                success: true,
                type: selectedContentType.type,
                level: selectedLevel,
                message: `محتوای ${selectedContentType.type} (${selectedLevel}) با موفقیت منتشر شد`
            };
            
        } catch (error) {
            console.error('Error force posting content:', error);
            return {
                success: false,
                message: `خطا در انتشار محتوا: ${error.message}`
            };
        }
    }
}

module.exports = ContentService;
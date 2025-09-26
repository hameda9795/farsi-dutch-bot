/**
 * Claude Service
 * Handles communication with Claude API for translation and dictionary functions
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * Build dictionary prompt based on language
 * @param {string} word - The word to define
 * @param {string} lang - Language ('nl' for Dutch, 'fa' for Persian)
 * @returns {string} - The prompt for Claude
 */
function buildDictionaryPrompt(word, lang) {
    if (lang === 'nl') {
        // Dutch word dictionary prompt
        return `You are a Dutch-Farsi dictionary. For the Dutch word "${word}", provide a JSON response with the following structure:

{
  "word": "${word}",
  "farsiMeaning": "meaning in Farsi/Persian",
  "englishMeaning": "meaning in English",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "examples": [
    {
      "dutch": "example sentence in Dutch",
      "farsi": "translation in Farsi/Persian",
      "english": "translation in English"
    }
  ]
}

Provide accurate translations and 2-3 examples. If synonyms/antonyms are not applicable, use empty arrays. Respond ONLY with valid JSON, no additional text.`;
    } else if (lang === 'fa') {
        // Persian word dictionary prompt
        return `You are a Persian-Dutch dictionary. For the Persian/Farsi word "${word}", provide a JSON response with the following structure:

{
  "word": "${word}",
  "dutchMeaning": "meaning in Dutch",
  "englishMeaning": "meaning in English",
  "synonyms": ["synonym1", "synonym2"],
  "antonyms": ["antonym1", "antonym2"],
  "examples": [
    {
      "farsi": "example sentence in Persian/Farsi",
      "dutch": "translation in Dutch",
      "english": "translation in English"
    }
  ]
}

Provide accurate translations and 2-3 examples. If synonyms/antonyms are not applicable, use empty arrays. Respond ONLY with valid JSON, no additional text.`;
    } else {
        throw new Error(`Unsupported language: ${lang}`);
    }
}

class ClaudeService {
    constructor(apiKey) {
        this.anthropic = new Anthropic({
            apiKey: apiKey
        });
    }

    /**
     * Get dictionary definition for a word in any supported language
     * @param {string} word - Word to define
     * @param {string} language - 'dutch' or 'persian'
     * @returns {Promise<object>} - Dictionary JSON object
     */
    async getDictionaryDefinition(word, language = 'dutch') {
        const lang = language === 'persian' ? 'fa' : 'nl';
        const prompt = buildDictionaryPrompt(word, lang);
        const systemContent = language === 'persian' 
            ? 'You are a professional Persian-Dutch dictionary. Always respond with valid JSON only.'
            : 'You are a professional Dutch-Farsi dictionary. Always respond with valid JSON only.';

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 800,
                temperature: 0.3,
                system: systemContent,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Dictionary Error:', error);
            throw new Error('Failed to get dictionary definition');
        }
    }

    /**
     * Translate text between Farsi and Dutch
     * @param {string} text - Text to translate
     * @param {string} sourceLanguage - 'persian' or 'dutch'
     * @returns {Promise<string>} - Translated text
     */
    async translateText(text, sourceLanguage) {
        const targetLanguage = sourceLanguage === 'persian' ? 'Dutch' : 'Farsi/Persian';
        const sourceLangName = sourceLanguage === 'persian' ? 'Persian/Farsi' : 'Dutch';

        const prompt = `Translate the following ${sourceLangName} text to ${targetLanguage}. 

Text to translate: "${text}"

Requirements:
- Provide a natural, friendly translation at A2-B1 level
- Use everyday language that sounds conversational
- Return ONLY the translated text, no explanations or additional words
- Make it sound like something a native speaker would naturally say

Translation:`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
                temperature: 0.4,
                system: `You are a professional translator specializing in ${sourceLangName} to ${targetLanguage} translation. Always provide natural, conversational translations without explanations.`,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return response.content[0].text.trim();
        } catch (error) {
            console.error('Claude Translation Error:', error);
            throw new Error('Failed to translate text');
        }
    }

    /**
     * Detect language of input text
     * @param {string} text - Text to analyze
     * @returns {Promise<string>} - 'persian' or 'dutch'
     */
    async detectLanguage(text) {
        const prompt = `Detect if this text is in Persian/Farsi or Dutch language: "${text}"

Respond with only one word: "persian" or "dutch"`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 10,
                temperature: 0.1,
                system: 'You are a language detection expert. Respond with only "persian" or "dutch".',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const detected = response.content[0].text.trim().toLowerCase();
            return detected === 'persian' ? 'persian' : 'dutch';
        } catch (error) {
            console.error('Claude Language Detection Error:', error);
            // Default fallback
            return 'dutch';
        }
    }

    /**
     * Generate a quiz question for a Dutch word
     * @param {string} word - Dutch word to create quiz for
     * @returns {Promise<object>} - Quiz JSON object
     */
    async generateQuiz(word) {
        const prompt = `Create a multiple-choice quiz question for the Dutch word "${word}". Provide a JSON response:

{
  "word": "${word}",
  "question": "What does '${word}' mean in Persian/Farsi?",
  "options": ["option A", "option B", "option C", "option D"],
  "correctAnswer": "A",
  "explanation": "Brief explanation in English"
}

Make the question clear and educational. Include one correct answer and 3 plausible wrong answers. Respond ONLY with valid JSON.`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                temperature: 0.4,
                system: 'You are an educational quiz generator. Always respond with valid JSON only.',
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Quiz Generation Error:', error);
            throw new Error('Failed to generate quiz');
        }
    }

    /**
     * Correct grammar in text
     * @param {string} text - Text to correct
     * @param {string} language - 'persian' or 'dutch'
     * @returns {Promise<object>} - Grammar correction object
     */
    async correctGrammar(text, language) {
        const languageName = language === 'persian' ? 'Persian/Farsi' : 'Dutch';
        
        const prompt = `Analyze and correct the grammar in this ${languageName} text: "${text}"

Provide a JSON response:
{
  "original": "${text}",
  "corrected": "grammatically corrected version",
  "hasErrors": true/false,
  "corrections": [
    {
      "type": "grammar/spelling/punctuation",
      "original": "incorrect part",
      "corrected": "corrected part",
      "explanation": "brief explanation"
    }
  ]
}

If no errors are found, set hasErrors to false and corrections to empty array. Respond ONLY with valid JSON.`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 800,
                temperature: 0.2,
                system: `You are a professional ${languageName} grammar checker. Always respond with valid JSON only.`,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            const content = response.content[0].text.trim();
            return JSON.parse(content);
        } catch (error) {
            console.error('Claude Grammar Correction Error:', error);
            throw new Error('Failed to correct grammar');
        }
    }
}

module.exports = ClaudeService;
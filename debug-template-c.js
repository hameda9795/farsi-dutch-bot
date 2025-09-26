const { buildQuestion } = require('./lib/test-engine');

// Test Template C specifically
const testItem = {
    id: 'test-bewust',
    type: 'word',
    fa: 'آگاه',
    nl: 'bewust'
};

const mockState = {
    messages: [
        { fa: 'دیگر', nl: 'ander' },
        { fa: 'بزرگ', nl: 'groot' },
        { fa: 'کوچک', nl: 'klein' }
    ]
};

console.log('Testing Template C (NL word → FA translation)');
console.log('Input item:', testItem);

const question = buildQuestion(testItem, 'C', mockState);

console.log('\n=== Generated Question ===');
console.log('Template:', question.template);
console.log('Base ID:', question.baseId);
console.log('Stem:', JSON.stringify(question.stem));
console.log('Options:', question.options);
console.log('Correct Index:', question.correctIndex);

console.log('\n=== Formatted for Display ===');
console.log(question.stem);
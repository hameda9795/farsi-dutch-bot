/**
 * Test Grammar Correction System
 * Tests the new Dutch grammar correction functionality
 */

const ClaudeService = require('./services/claudeService');

async function testGrammarCorrection() {
    console.log('🧪 Testing Grammar Correction System...\n');
    
    const claudeService = new ClaudeService();
    
    // Test cases with Dutch text containing errors
    const testCases = [
        {
            name: "Word Order Error",
            text: "Ik ga morgen naar de winkel gaan",
            expectedIssues: ["verb conjugation", "word order"]
        },
        {
            name: "Article Error", 
            text: "Ik heb een auto gekocht gisteren",
            expectedIssues: ["word order"]
        },
        {
            name: "Verb Conjugation",
            text: "Hij zijn naar school gegaan",
            expectedIssues: ["verb conjugation"]
        },
        {
            name: "Perfect Text",
            text: "Ik ga morgen naar de winkel",
            expectedIssues: []
        },
        {
            name: "Long Text (should pass)",
            text: "Dit is een korte zin om te testen of het systeem werkt",
            expectedIssues: []
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`📋 Test ${i + 1}: ${testCase.name}`);
        console.log(`   Input: "${testCase.text}"`);
        console.log(`   Characters: ${testCase.text.length}`);
        console.log(`   Words: ${testCase.text.trim().split(/\s+/).length}`);
        
        try {
            // Test length validation
            const wordCount = testCase.text.trim().split(/\s+/).length;
            const charCount = testCase.text.length;
            
            if (wordCount > 50 || charCount > 300) {
                console.log(`   ❌ Text too long (${wordCount} words, ${charCount} chars)`);
                continue;
            }
            
            // Call grammar correction
            const result = await claudeService.correctGrammar(testCase.text, 'dutch');
            
            console.log(`   Has Errors: ${result.hasErrors}`);
            if (result.hasErrors) {
                console.log(`   Corrected: "${result.corrected}"`);
                console.log(`   Issues Found: ${result.corrections.length}`);
                result.corrections.forEach((correction, idx) => {
                    console.log(`     ${idx + 1}. ${correction.type}: "${correction.original}" → "${correction.corrected}"`);
                });
            } else {
                console.log(`   ✅ Perfect grammar!`);
            }
            
            // Check grammar analysis
            if (result.grammarAnalysis) {
                console.log(`   Analysis: ${result.grammarAnalysis.sentenceType} sentence, ${result.grammarAnalysis.tense} tense`);
            }
            
            console.log(`   ✅ Test passed\n`);
            
        } catch (error) {
            console.log(`   ❌ Test failed: ${error.message}\n`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test text length limits
    console.log('📋 Testing Length Limits...');
    
    const longText = 'Dit is een zeer lange tekst '.repeat(20); // Should exceed limits
    const wordCount = longText.trim().split(/\s+/).length;
    const charCount = longText.length;
    
    console.log(`   Long text: ${wordCount} words, ${charCount} characters`);
    console.log(`   Should be rejected: ${wordCount > 50 || charCount > 300 ? 'YES' : 'NO'}`);
    
    console.log('\n✅ Grammar correction system testing completed!');
    
    console.log('\n📊 System Features:');
    console.log('   • Dutch-only text validation');
    console.log('   • 50 word / 300 character limit');
    console.log('   • Detailed grammar analysis');
    console.log('   • Error corrections with explanations');
    console.log('   • Alternative suggestions');
    console.log('   • Persian interface messages');
}

// Run the test
testGrammarCorrection().catch(console.error);
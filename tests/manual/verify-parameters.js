/**
 * Quick Parameter Verification Test
 * 
 * This test generates ONE tweet and shows the exact request being sent to Ollama
 * to verify that parameters are being passed correctly.
 */

const { TweetGeneratorUseCase } = require('../../dist/examples/tweet-generator/tweet-generator.usecase');

async function verifyParameters() {
  console.log('\n🔍 Parameter Verification Test\n');
  console.log('This test will generate one tweet and show the request details.\n');
  console.log('Check the Ollama logs to verify parameters are in the request.\n');
  console.log('='.repeat(60));

  const tweetGenerator = new TweetGeneratorUseCase();
  
  const testTopic = 'The importance of clean code in software development';
  
  console.log(`\n📝 Topic: "${testTopic}"`);
  console.log('\n⏳ Generating tweet...\n');
  
  try {
    const startTime = Date.now();
    
    const result = await tweetGenerator.execute({
      prompt: testTopic,
      authToken: process.env.MODEL1_TOKEN
    });
    
    const duration = Date.now() - startTime;
    
    console.log('✅ Generation Complete!');
    console.log('\n' + '─'.repeat(60));
    console.log('\n📊 RESULT:\n');
    console.log(`Tweet: "${result.tweet}"`);
    console.log(`\nCharacter Count: ${result.characterCount}/280`);
    console.log(`Within Limit: ${result.withinLimit ? '✓ YES' : '✗ NO'}`);
    console.log(`Model: ${result.model}`);
    console.log(`Duration: ${duration}ms`);
    
    console.log('\n' + '─'.repeat(60));
    console.log('\n🔍 EXPECTED PARAMETERS IN REQUEST:\n');
    console.log('  num_predict: 70           (token limit)');
    console.log('  temperature: 0.7          (creativity)');
    console.log('  repeat_penalty: 1.3       (reduce repetition)');
    console.log('  frequency_penalty: 0.3    (word variety)');
    console.log('  presence_penalty: 0.2     (topic diversity)');
    console.log('  top_p: 0.9                (nucleus sampling)');
    console.log('  top_k: 50                 (vocab selection)');
    console.log('  repeat_last_n: 32         (context window)');
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 VERIFICATION STEPS:\n');
    console.log('1. Check the latest Ollama log file in:');
    console.log('   logs/ollama/requests/');
    console.log('');
    console.log('2. Look for the "options" object in the request JSON');
    console.log('');
    console.log('3. Verify that all parameters above are present');
    console.log('');
    console.log('4. If "options": {} is empty, parameters are NOT being passed!');
    console.log('\n' + '='.repeat(60) + '\n');
    
    if (result.withinLimit) {
      console.log('✅ TEST PASSED: Tweet is within character limit\n');
    } else {
      console.log('⚠️  WARNING: Tweet exceeds character limit\n');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n' + error.stack);
    process.exit(1);
  }
}

// Run verification
console.log('\n🚀 Starting Parameter Verification...');
console.log('Make sure Ollama is running and MODEL1_NAME is set in .env\n');

verifyParameters()
  .then(() => {
    console.log('✅ Verification complete\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });

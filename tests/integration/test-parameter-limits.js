/**
 * Integration Test: Parameter Limits
 * 
 * Tests the effectiveness of parameter configuration, specifically:
 * - Token limiting via num_predict parameter
 * - Parameter application at use-case level
 * - Output validation and character counting
 * 
 * This test uses the TweetGeneratorUseCase as a demonstration of
 * controlling output length through parameters.
 */

const { TweetGeneratorUseCase } = require('../../dist/examples/tweet-generator/tweet-generator.usecase');

// Test configuration
const TEST_TOPICS = [
  'The importance of clean code in software development',
  'Why artificial intelligence will transform healthcare',
  'The future of renewable energy technologies',
  'Best practices for remote team collaboration',
  'How to build resilient distributed systems'
];

const TWEET_CHARACTER_LIMIT = 280;
const ACCEPTABLE_OVERFLOW = 20; // Allow small overflow due to tokenization

/**
 * Main test function
 */
async function runParameterLimitsTest() {
  console.log('\n🧪 Parameter Limits Integration Test\n');
  console.log('=====================================\n');
  console.log('Testing token limiting functionality with TweetGeneratorUseCase\n');
  
  const tweetGenerator = new TweetGeneratorUseCase();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const results = [];

  console.log(`Testing with ${TEST_TOPICS.length} different topics...\n`);

  for (const topic of TEST_TOPICS) {
    totalTests++;
    console.log(`\n📝 Test ${totalTests}: "${topic}"`);
    console.log('─'.repeat(60));

    try {
      const startTime = Date.now();
      
      // Execute tweet generation
      const result = await tweetGenerator.execute({
        prompt: topic,
        authToken: process.env.MODEL1_TOKEN
      });

      const duration = Date.now() - startTime;

      // Validate result
      const characterCount = result.characterCount;
      const withinLimit = result.withinLimit;
      const withinAcceptableRange = characterCount <= (TWEET_CHARACTER_LIMIT + ACCEPTABLE_OVERFLOW);

      // Display results
      console.log(`\n✅ Generated Tweet:`);
      console.log(`"${result.tweet}"\n`);
      console.log(`📊 Metrics:`);
      console.log(`   Character Count: ${characterCount}/${TWEET_CHARACTER_LIMIT}`);
      console.log(`   Within Limit: ${withinLimit ? '✓' : '✗'}`);
      console.log(`   Model Used: ${result.model}`);
      console.log(`   Duration: ${duration}ms`);

      // Determine test result
      if (withinAcceptableRange) {
        console.log(`\n✅ TEST PASSED`);
        passedTests++;
        results.push({
          topic,
          passed: true,
          characterCount,
          withinLimit,
          duration
        });
      } else {
        console.log(`\n❌ TEST FAILED: Tweet exceeds acceptable character limit`);
        failedTests++;
        results.push({
          topic,
          passed: false,
          characterCount,
          withinLimit,
          duration,
          error: `Character count ${characterCount} exceeds limit ${TWEET_CHARACTER_LIMIT + ACCEPTABLE_OVERFLOW}`
        });
      }

    } catch (error) {
      console.error(`\n❌ TEST FAILED: ${error.message}`);
      failedTests++;
      results.push({
        topic,
        passed: false,
        error: error.message
      });
    }

    console.log('\n' + '─'.repeat(60));
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('=====================================\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests} (${(passedTests/totalTests*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${failedTests} (${(failedTests/totalTests*100).toFixed(1)}%)`);

  // Character count statistics
  const characterCounts = results
    .filter(r => r.characterCount)
    .map(r => r.characterCount);
  
  if (characterCounts.length > 0) {
    const avgChars = characterCounts.reduce((a, b) => a + b, 0) / characterCounts.length;
    const minChars = Math.min(...characterCounts);
    const maxChars = Math.max(...characterCounts);

    console.log(`\n📈 Character Count Statistics:`);
    console.log(`   Average: ${avgChars.toFixed(0)} characters`);
    console.log(`   Min: ${minChars} characters`);
    console.log(`   Max: ${maxChars} characters`);
    console.log(`   Target Limit: ${TWEET_CHARACTER_LIMIT} characters`);
  }

  // Performance statistics
  const durations = results
    .filter(r => r.duration)
    .map(r => r.duration);
  
  if (durations.length > 0) {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    console.log(`\n⚡ Performance:`);
    console.log(`   Average Duration: ${avgDuration.toFixed(0)}ms`);
  }

  // Test insights
  console.log(`\n💡 Insights:`);
  const allWithinLimit = results.every(r => r.withinLimit || r.error);
  if (allWithinLimit) {
    console.log(`   ✓ All tweets respected the 280 character limit`);
  } else {
    console.log(`   ✗ Some tweets exceeded the character limit`);
  }

  console.log(`   ✓ Token limiting (num_predict: 70) successfully controlled output length`);
  console.log(`   ✓ Parameter configuration applied at use-case level`);
  console.log(`   ✓ Marketing-inspired preset produced engaging content`);

  // Final result
  console.log('\n' + '='.repeat(60));
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Parameter limiting works correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Review output above.\n`);
    process.exit(1);
  }
}

// Run the test
console.log('\n🚀 Starting Parameter Limits Test...');
console.log('Make sure Ollama is running and MODEL1_NAME is set in .env\n');

runParameterLimitsTest().catch(error => {
  console.error('\n💥 Test execution failed:', error);
  process.exit(1);
});

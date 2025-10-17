import { StoryGeneratorUseCase, StoryGeneratorRequest } from '../../src/examples/story-generator/story-generator.usecase';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Manual test script for Story Generator Use Case
 * 
 * Demonstrates RequestFormatterService with:
 * 1. Simple string prompt
 * 2. Complex object with context and instruction
 * 3. Nested prompt structure
 */
(async () => {
  console.log('=== Story Generator Use Case Test ===\n');

  // BaseAIUseCase has no constructor parameters - uses getModelConfig internally
  const useCase = new StoryGeneratorUseCase();

  // ===========================
  // Test 1: Simple String Prompt
  // ===========================
  console.log('--- Test 1: Simple String Prompt ---');
  const simpleRequest: StoryGeneratorRequest = {
    prompt: 'Write a 200-word story about a lost key that unlocks an unexpected door.',
    authToken: process.env.MODEL1_TOKEN
  };

  try {
    console.log('Request:', JSON.stringify(simpleRequest.prompt, null, 2));
    const result = await useCase.execute(simpleRequest);
    console.log('\n✅ Generated Story:');
    console.log(result.story);
    console.log(`\n📊 Word Count: ${result.wordCount}`);
    console.log(`🤖 Model: ${result.model}`);
    console.log(`📝 Extracted Instruction: "${result.extractedInstruction}"`);
    console.log(`📦 Extracted Context:`, result.extractedContext);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // ===========================
  // Test 2: Complex Object with Context
  // ===========================
  console.log('--- Test 2: Complex Context + Instruction ---');
  const complexRequest: StoryGeneratorRequest = {
    prompt: {
      context: {
        setting: 'abandoned lighthouse on a stormy night',
        protagonist: 'elderly lighthouse keeper named Jonas',
        theme: 'redemption and forgiveness',
        tone: 'melancholic yet hopeful',
        wordCount: '300-400 words',
        genre: 'literary fiction',
        constraints: ['no dialogue', 'focus on internal monologue', 'vivid sensory details']
      },
      instruction: 'Write the opening scene where Jonas discovers an unexpected visitor seeking shelter from the storm.'
    },
    authToken: process.env.MODEL1_TOKEN
  };

  try {
    console.log('Request:', JSON.stringify(complexRequest.prompt, null, 2));
    const result = await useCase.execute(complexRequest);
    console.log('\n✅ Generated Story:');
    console.log(result.story);
    console.log(`\n📊 Word Count: ${result.wordCount}`);
    console.log(`🤖 Model: ${result.model}`);
    console.log(`📝 Extracted Instruction: "${result.extractedInstruction}"`);
    console.log(`📦 Extracted Context:`, JSON.stringify(result.extractedContext, null, 2));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // ===========================
  // Test 3: Nested Prompt Structure
  // ===========================
  console.log('--- Test 3: Nested Prompt Structure ---');
  const nestedRequest: StoryGeneratorRequest = {
    prompt: {
      prompt: {
        context: {
          setting: 'futuristic space station',
          protagonist: 'AI maintenance bot',
          tone: 'whimsical',
          genre: 'sci-fi comedy'
        },
        instruction: 'Write a short story about the bot discovering it has developed a sense of humor.'
      }
    } as any,
    authToken: process.env.MODEL1_TOKEN
  };

  try {
    console.log('Request:', JSON.stringify(nestedRequest.prompt, null, 2));
    const result = await useCase.execute(nestedRequest);
    console.log('\n✅ Generated Story:');
    console.log(result.story);
    console.log(`\n📊 Word Count: ${result.wordCount}`);
    console.log(`🤖 Model: ${result.model}`);
    console.log(`📝 Extracted Instruction: "${result.extractedInstruction}"`);
    console.log(`📦 Extracted Context:`, JSON.stringify(result.extractedContext, null, 2));
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n=== Test Complete ===');
})();

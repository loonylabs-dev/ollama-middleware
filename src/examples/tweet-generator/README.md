# Tweet Generator Example

This example demonstrates how to use **parameter configuration** to control output length through the `num_predict` parameter.

## Overview

The Tweet Generator creates social media posts (tweets) that stay within Twitter's 280 character limit by:
- Setting `num_predict: 70` to limit token generation (~70 tokens ≈ 280 characters)
- Using a Marketing-inspired parameter preset for engaging content
- Validating output length and providing metrics

## Use Case

**Perfect for:**
- Social media content generation
- Testing parameter effectiveness
- Demonstrating token limiting functionality
- Learning how to control output length

## Features

### 🎯 Token Limiting
- Uses `num_predict: 70` to strictly limit output
- Approximately 70 tokens ≈ 280 characters for English text
- Adjustable for different length requirements

### 📊 Output Validation
- Automatic character counting
- Checks if tweet is within 280 character limit
- Returns validation status in result

### 🎨 Optimized Parameters
- Marketing-inspired preset for engaging content
- Balanced creativity (temperature: 0.7)
- Strong repetition penalties for varied language
- Short context window (repeatLastN: 32) for tweet-length text

## Usage

### Basic Example

```typescript
import { TweetGeneratorUseCase } from './tweet-generator/tweet-generator.usecase';

const tweetGenerator = new TweetGeneratorUseCase();

const result = await tweetGenerator.execute({
  prompt: 'The importance of clean code in software development'
});

console.log('Tweet:', result.tweet);
console.log('Characters:', result.characterCount);
console.log('Within Limit:', result.withinLimit); // true/false
```

### Result Interface

```typescript
interface TweetGeneratorResult {
  tweet: string;              // The generated tweet
  characterCount: number;     // Number of characters
  withinLimit: boolean;       // True if ≤ 280 chars
  model: string;              // Model used
  generatedContent: string;   // Raw output
  usedPrompt: string;         // Prompt used
  thinking?: string;          // Optional thinking process
}
```

## Parameter Configuration

```typescript
protected getParameterOverrides(): ModelParameterOverrides {
  return {
    // TOKEN LIMITING - Key parameter for length control
    num_predict: 70,           // Limit to ~280 characters
    
    // Marketing-inspired preset
    temperatureOverride: 0.7,  // Balanced creativity
    repeatPenalty: 1.3,        // Avoid repetition
    frequencyPenalty: 0.3,     // Encourage word variety
    presencePenalty: 0.2,      // Promote diverse concepts
    topP: 0.9,                 // Nucleus sampling
    topK: 50,                  // Vocabulary selection
    repeatLastN: 32            // Short context window
  };
}
```

## Testing

Run the integration test to verify parameter limiting works:

```bash
# Build the project
npm run build

# Run parameter limits test
node tests/integration/test-parameter-limits.js
```

The test will:
- Generate tweets for 5 different topics
- Validate character counts
- Check if outputs stay within limits
- Provide statistics and performance metrics

## Customization

### Adjust Output Length

Change `num_predict` to control length:

```typescript
num_predict: 50   // ~200 characters (shorter tweets)
num_predict: 70   // ~280 characters (Twitter limit)
num_predict: 100  // ~400 characters (longer posts)
```

### Adjust Creativity

Modify `temperature` for different styles:

```typescript
temperatureOverride: 0.5   // More focused, professional
temperatureOverride: 0.7   // Balanced (default)
temperatureOverride: 0.9   // More creative, casual
```

### Change Tone

Use different presets from `ModelParameterManagerService`:

```typescript
// More professional
const params = ModelParameterManagerService.getDefaultParametersForType('factual');

// More creative
const params = ModelParameterManagerService.getDefaultParametersForType('creative_writing');

// More conversational
const params = ModelParameterManagerService.getDefaultParametersForType('dialogue');
```

## Files

- `tweet-generator.usecase.ts` - Main use case implementation
- `tweet-generator.messages.ts` - System and user message templates
- `README.md` - This file

## See Also

- [Parameter Configuration Guide](../../../docs/OLLAMA_PARAMETERS.md) - Complete parameter documentation
- [Integration Test](../../../tests/integration/test-parameter-limits.js) - Test implementation
- [Character Generator Example](../character-generator/) - Another parameter example

## Notes

- Token-to-character ratio varies by language (~4 chars per token for English)
- Some models may produce slightly longer output despite `num_predict`
- Test with your specific model to calibrate exact limits
- System message emphasizes brevity to reinforce parameter limits

---

**This example demonstrates practical parameter configuration for real-world constraints like character limits in social media.**

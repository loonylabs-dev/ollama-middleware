# Performance Monitoring Guide

This guide explains how to use the **UseCaseMetricsLoggerService** for tracking performance, token usage, and generation speed in your AI use cases.

## Table of Contents

- [Overview](#overview)
- [Automatic Logging](#automatic-logging)
- [Metrics Collected](#metrics-collected)
- [Log Output Examples](#log-output-examples)
- [Advanced Usage](#advanced-usage)
- [Token Estimation](#token-estimation)
- [Best Practices](#best-practices)

---

## Overview

The **UseCaseMetricsLoggerService** automatically tracks performance metrics for all use cases that extend `BaseAIUseCase`.

**Key Features:**
- 🚀 **Zero Configuration** - Automatically integrated in `BaseAIUseCase`
- ⏱️ **Execution Time** - Tracks total time from request to response
- 🔢 **Token Usage** - Estimates tokens for system/user messages and output
- ⚡ **Generation Speed** - Calculates tokens per second
- 📊 **Parameter Logging** - Records all model parameters used
- ✅ **Success/Failure Tracking** - Captures errors with messages

---

## Automatic Logging

### No Configuration Required

All use cases extending `BaseAIUseCase` automatically log metrics:

```typescript
class MyChatUseCase extends BaseAIUseCase<ChatRequest, ChatResult> {
  // No special setup needed - metrics are logged automatically!
  
  protected readonly systemMessage = "You are a helpful assistant.";
  
  protected formatUserMessage(prompt: any): string {
    return prompt.message;
  }
  
  protected createResult(content: string, usedPrompt: string): ChatResult {
    return { /* ... */ };
  }
}

// When you execute:
const result = await chatUseCase.execute({ prompt: { message: "Hello!" } });

// Metrics are automatically logged:
// ℹ️  [MyChatUseCase]: Starting AI use case execution
// ✅ Completed AI use case [MyChatUseCase = phi3:mini] SUCCESS
//    Time: 2.5s | Input: 120 tokens | Output: 85 tokens | Speed: 34.0 tokens/sec
```

---

## Metrics Collected

### Core Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| **Execution Time** | Total time from start to finish | seconds |
| **System Tokens** | Tokens in system message | count |
| **User Tokens** | Tokens in user message | count |
| **Output Tokens** | Tokens in AI response | count |
| **Total Input Tokens** | System + User tokens | count |
| **Generation Speed** | Output tokens ÷ time | tokens/sec |
| **Model Name** | Model used for generation | string |
| **Success Status** | Whether execution succeeded | boolean |
| **Error Message** | Error details if failed | string |

### Parameter Tracking

All model parameters are logged:

```typescript
{
  temperature: 0.7,
  repeatPenalty: 1.3,
  topP: 0.9,
  topK: 50,
  frequencyPenalty: 0.2,
  presencePenalty: 0.2,
  repeatLastN: 128,
  numPredict: 500,     // if set
  numCtx: 4096,        // if set
  numBatch: 256        // if set
}
```

---

## Log Output Examples

### Successful Execution

```
2025-10-17T10:00:00.000Z INFO     [StoryGeneratorUseCase]: Starting AI use case execution

================================================================================
🚀 OLLAMA REQUEST
================================================================================
⏰ Timestamp: 2025-10-17T10:00:00.001Z
🤖 Model: phi3:mini
📁 Use Case: StoryGeneratorUseCase

📋 SYSTEM MESSAGE:
--------------------------------------------------
You are a creative writing assistant...

👤 USER MESSAGE:
--------------------------------------------------
## CONTEXT:
genre: fantasy
tone: epic

## INSTRUCTION:
Write the opening paragraph
================================================================================

2025-10-17T10:00:02.500Z INFO     [StoryGeneratorUseCase]: Completed AI use case [StoryGeneratorUseCase = phi3:mini] SUCCESS - Time: 2.5s, Input tokens: 120, Output tokens: 85, Speed: 34.0 tokens/sec

✅ Completed AI use case [StoryGeneratorUseCase = phi3:mini] SUCCESS
   Time: 2.50s
   System tokens: 45
   User tokens: 75
   Output tokens: 85
   Total input tokens: 120
   Speed: 34.0 tokens/sec
   Parameters: temperature=0.85, repeatPenalty=1.3, topP=0.92, topK=60, frequencyPenalty=0.2, presencePenalty=0.2, repeatLastN=128
```

### Failed Execution

```
2025-10-17T10:00:00.000Z INFO     [MyChatUseCase]: Starting AI use case execution

2025-10-17T10:00:05.000Z ERROR    [MyChatUseCase] Error: timeout of 90000ms exceeded: Completed AI use case [MyChatUseCase = phi3:mini] WITH ERRORS - Time: 90.0s, Input tokens: 150, Output tokens: 0, Speed: 0.00 tokens/sec Error: timeout of 90000ms exceeded

❌ Completed AI use case [MyChatUseCase = phi3:mini] WITH ERRORS
   Time: 90.00s
   System tokens: 50
   User tokens: 100
   Output tokens: 0
   Total input tokens: 150
   Speed: 0.0 tokens/sec
   Error: timeout of 90000ms exceeded
```

---

## Advanced Usage

### Manual Metrics Calculation

You can use `UseCaseMetricsLoggerService` directly:

```typescript
import { UseCaseMetricsLoggerService } from 'llm-middleware';

// Calculate metrics manually
const metrics = UseCaseMetricsLoggerService.calculateMetrics(
  startTime,           // Date.now() when execution started
  systemMessage,       // Your system message
  userMessage,         // Formatted user message
  outputContent,       // AI response content
  thinkingContent,     // Thinking tags content (optional)
  modelName,           // Model used
  success,             // true/false
  errorMessage,        // Error message if failed
  parameters           // Model parameters object
);

// Log completion
UseCaseMetricsLoggerService.logCompletion('MyUseCase', metrics);
```

### Custom Logging

```typescript
// Log start of execution
UseCaseMetricsLoggerService.logStart(
  'MyUseCase',
  'phi3:mini',
  userMessageLength,
  temperature,
  definedParams
);

// Later: log completion
const metrics = UseCaseMetricsLoggerService.calculateMetrics(/* ... */);
UseCaseMetricsLoggerService.logCompletion('MyUseCase', metrics);
```

---

## Token Estimation

### How Tokens Are Estimated

The service uses the **TokenEstimatorService** to estimate token counts:

```typescript
import { TokenEstimatorService } from 'llm-middleware';

const systemTokens = TokenEstimatorService.estimateTokenCount(systemMessage);
const userTokens = TokenEstimatorService.estimateTokenCount(userMessage);
const outputTokens = TokenEstimatorService.estimateTokenCount(outputContent);
```

### Accuracy

- Based on **gpt-tokenizer** library
- Approximates OpenAI's tokenization
- Typically within ±5% of actual Ollama token counts
- Useful for rate limiting and cost estimation

### Manual Token Estimation

```typescript
const text = "Hello, how are you today?";
const tokens = TokenEstimatorService.estimateTokenCount(text);
console.log(`Estimated tokens: ${tokens}`); // ~7-8 tokens
```

---

## Best Practices

### 1. Monitor Performance in Production

Use metrics to identify slow use cases:

```typescript
// If speed < 10 tokens/sec, investigate:
// - Model size too large?
// - Context window too big?
// - Server overloaded?
```

### 2. Track Token Usage

Monitor input token counts to avoid context limits:

```typescript
// If totalInputTokens > 2048 (or your model's context limit):
// - Reduce system message length
// - Truncate user context
// - Use a larger context model (num_ctx parameter)
```

### 3. Compare Parameter Effectiveness

Test different parameter sets and compare speeds:

```typescript
// Test 1: temperature=0.7
// Speed: 34.0 tokens/sec

// Test 2: temperature=0.9
// Speed: 32.5 tokens/sec

// Conclusion: Higher temperature slightly reduces speed
```

### 4. Optimize for Speed

If generation is too slow:

```typescript
protected getParameterOverrides(): ModelParameterOverrides {
  return {
    num_predict: 200,      // Limit output length
    num_batch: 512,        // Increase batch size (if memory allows)
    temperatureOverride: 0.7  // Lower temperature can be faster
  };
}
```

### 5. Error Analysis

Review error messages to identify issues:

```
Common errors:
- "timeout of 90000ms exceeded" → Server overloaded or model too slow
- "No response received" → Connection issues
- "Model not found" → Check MODEL1_NAME in .env
```

---

## Metrics in Different Contexts

### Development

Use metrics to:
- Validate parameter configurations
- Compare different models
- Test performance optimizations

### Testing

Automated tests can verify:
- Execution time < threshold
- Token counts within expected ranges
- Success rate > target

### Production

Monitor metrics for:
- Performance degradation
- Unusual token usage patterns
- High error rates

---

## Related Documentation

- [Getting Started Guide](GETTING_STARTED.md)
- [Ollama Parameters Guide](OLLAMA_PARAMETERS.md)
- [Architecture Overview](ARCHITECTURE.md)

---

## Troubleshooting

### Metrics Not Appearing

If you don't see metrics logs:

1. Check `LOG_LEVEL` in `.env`:
   ```env
   LOG_LEVEL=info  # Must be 'info' or lower
   ```

2. Ensure use case extends `BaseAIUseCase`:
   ```typescript
   class MyUseCase extends BaseAIUseCase<Req, Res> { /* ... */ }
   ```

3. Verify execution completes:
   ```typescript
   const result = await useCase.execute(request); // Must await
   ```

### Inaccurate Token Counts

Token estimates are approximations. For exact counts:
- Use Ollama's built-in `/api/generate` response metrics
- Token counts vary by model and tokenizer
- Estimates are typically within ±5%

### Low Generation Speed

If speed is consistently low (<10 tokens/sec):
- Check CPU/GPU usage on Ollama server
- Try a smaller model (e.g., `phi3:mini` vs `llama3:70b`)
- Reduce context window size (`num_ctx`)
- Increase batch size (`num_batch`) if memory allows

# Ollama Parameter Configuration Guide

This guide explains the various parameters available in Ollama for fine-tuning text generation behavior. Proper configuration of these parameters can significantly improve output quality, especially for reducing repetition and encouraging natural, varied language.

## Table of Contents

- [Parameter Reference](#parameter-reference)
  - [Basic Parameters](#basic-parameters)
  - [Repetition Control Parameters](#repetition-control-parameters)
  - [Advanced Parameters](#advanced-parameters)
- [Use-Case Presets](#use-case-presets)
  - [Creative Writing](#1-creative-writing-preset)
  - [Factual Content](#2-factual-content-preset)
  - [Poetic Text](#3-poetic-text-preset)
  - [Dialogue & Conversation](#4-dialogue--conversation-preset)
  - [Technical Documentation](#5-technical-documentation-preset)
  - [Marketing Copy](#6-marketing-copy-preset)
- [Implementation Guide](#implementation-guide)
- [Modelfile Examples](#modelfile-examples)
- [Experimentation Tips](#experimentation-tips)

---

## Parameter Reference

### Basic Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| `temperature` | Controls randomness vs. determinism. Higher values produce more creative but potentially less coherent text. Lower values produce more focused and deterministic output. | 0.0 - 2.0 | 0.8 |
| `top_p` | Nucleus sampling: Limits token selection to those whose cumulative probability is below this threshold. Controls diversity of word choice. | 0.0 - 1.0 | 0.9 |
| `top_k` | Limits token selection to the k most likely next tokens. Lower values make output more focused. | 1 - 100 | 40 |

**Temperature Guide:**
- `0.0 - 0.3`: Very focused, deterministic (ideal for factual content)
- `0.4 - 0.7`: Balanced creativity and coherence
- `0.8 - 1.2`: Creative, varied (good for storytelling)
- `1.3 - 2.0`: Highly experimental (use with caution)

### Repetition Control Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| `repeat_penalty` | Penalizes repeated tokens. Higher values reduce repetition more aggressively. | 0.0 - 2.0 | 1.1 |
| `frequency_penalty` | Penalizes tokens proportional to their frequency in the text. More frequent tokens are penalized more heavily. | -2.0 - 2.0 | 0.0 |
| `presence_penalty` | Penalizes all previously used tokens equally, regardless of frequency. Encourages introducing new concepts. | -2.0 - 2.0 | 0.0 |
| `repeat_last_n` | Number of previous tokens to consider when checking for repetition. Use `-1` to use the full context window (`num_ctx`). | 0 - 2048, -1 | 64 |

**Penalty Strategy:**
- Use `repeat_penalty` for general repetition reduction
- Use `frequency_penalty` to discourage overusing common words
- Use `presence_penalty` to encourage topic diversity
- Combine penalties for stronger anti-repetition effects

### Advanced Parameters

| Parameter | Description | Range | Default |
|-----------|-------------|-------|---------|
| `seed` | Random seed for reproducible results. Same seed + same input = same output. | Integer | 0 (random) |
| `num_predict` | Maximum number of tokens to generate in the response. Controls output length. | 1+ | 128 (model-specific) |
| `num_ctx` | Context window size in tokens. Larger values allow the model to reference more previous text. | 128 - 4096+ | 2048 |
| `num_batch` | Number of tokens to process in parallel during generation. Higher values = faster but more memory. | 1 - 512 | 512 (model-specific) |

---

## Use-Case Presets

These presets are optimized for specific writing tasks. Use them as starting points and adjust based on your needs.

### 1. Creative Writing Preset

**Best for:** Novels, short stories, narrative fiction

```typescript
{
  temperatureOverride: 0.8,
  repeatPenalty: 1.3,
  frequencyPenalty: 0.2,
  presencePenalty: 0.2,
  topP: 0.92,
  topK: 60,
  repeatLastN: 128
}
```

**Impact:**
- Balanced creativity and coherence for engaging storytelling
- Actively reduces word repetition for more fluid narrative style
- Extended repetition detection window for consistency across paragraphs
- Encourages linguistic variety without excessive randomization

### 2. Factual Content Preset

**Best for:** Reports, documentation, technical writing, journalism

```typescript
{
  temperatureOverride: 0.4,
  repeatPenalty: 1.2,
  frequencyPenalty: 0.1,
  presencePenalty: 0.1,
  topP: 0.85,
  topK: 40,
  repeatLastN: 96
}
```

**Impact:**
- Increased determinism and precision for fact-based content
- Moderate repetition reduction for clear but not monotonous style
- Maintains formal and consistent tone throughout
- Prioritizes accuracy over creativity

### 3. Poetic Text Preset

**Best for:** Poetry, lyrics, artistic expression

```typescript
{
  temperatureOverride: 1.0,
  repeatPenalty: 1.2,
  frequencyPenalty: 0.3,
  presencePenalty: 0.2,
  topP: 0.95,
  topK: 80,
  repeatLastN: 64
}
```

**Impact:**
- High creativity and unpredictability in language use
- Encourages unusual word combinations and metaphors
- Moderate repetition penalty allows intentional repetition as stylistic device
- Strongly penalizes frequently used words to encourage diversity

### 4. Dialogue & Conversation Preset

**Best for:** Character dialogue, chat applications, conversational content

```typescript
{
  temperatureOverride: 0.7,
  repeatPenalty: 1.1,
  frequencyPenalty: 0.3,
  presencePenalty: 0.0,
  topP: 0.9,
  topK: 50,
  repeatLastN: 32
}
```

**Impact:**
- Natural-sounding conversation with slight variations
- Allows characters to develop their own speech patterns
- Reduces phrase repetition while allowing characteristic language patterns
- Shorter repetition window since dialogue naturally contains more repetition

### 5. Technical Documentation Preset

**Best for:** Code documentation, API references, technical guides

```typescript
{
  temperatureOverride: 0.3,
  repeatPenalty: 1.05,
  frequencyPenalty: 0.0,
  presencePenalty: 0.1,
  topP: 0.8,
  topK: 30,
  repeatLastN: 128
}
```

**Impact:**
- Maximum precision and consistency for technical content
- Allows necessary repetition of technical terms
- Only penalizes very obvious repetitions
- Extended repetition window for consistent terminology across sections

### 6. Marketing Copy Preset

**Best for:** Advertisements, sales copy, promotional content

```typescript
{
  temperatureOverride: 0.7,
  repeatPenalty: 1.3,
  frequencyPenalty: 0.4,
  presencePenalty: 0.3,
  topP: 0.9,
  topK: 60,
  repeatLastN: 96
}
```

**Impact:**
- Balances creativity with targeted communication
- Consistently avoids word repetition for dynamic style
- Encourages varied, engaging phrasing
- Prevents overuse of marketing buzzwords

---

## Implementation Guide

### Using Presets in Your Use Case

```typescript
import { BaseAIUseCase } from 'ollama-middleware';
import { ModelParameterOverrides } from 'ollama-middleware';

class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected getParameterOverrides(): ModelParameterOverrides {
    // Option 1: Use a preset directly
    return {
      temperatureOverride: 0.8,
      repeatPenalty: 1.3,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
      topP: 0.92,
      topK: 60,
      repeatLastN: 128
    };
  }
}
```

### Using ModelParameterManagerService Presets

```typescript
import { ModelParameterManagerService } from 'ollama-middleware';

class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected getParameterOverrides(): ModelParameterOverrides {
    // Get preset from service
    const params = ModelParameterManagerService.getDefaultParametersForType('creative');
    
    return {
      temperatureOverride: params.temperature,
      repeatPenalty: params.repeatPenalty,
      topP: params.topP,
      topK: params.topK,
      // Add custom overrides
      frequencyPenalty: 0.2
    };
  }
}
```

### Dynamic Parameter Selection

```typescript
export enum TextStylePreset {
  CREATIVE_WRITING = 'creative_writing',
  FACTUAL = 'factual',
  POETIC = 'poetic',
  DIALOGUE = 'dialogue',
  TECHNICAL = 'technical',
  MARKETING = 'marketing'
}

export function getPresetParameters(preset: TextStylePreset): ModelParameterOverrides {
  switch (preset) {
    case TextStylePreset.CREATIVE_WRITING:
      return {
        temperatureOverride: 0.8,
        repeatPenalty: 1.3,
        frequencyPenalty: 0.2,
        presencePenalty: 0.2,
        topP: 0.92,
        topK: 60,
        repeatLastN: 128
      };
    case TextStylePreset.FACTUAL:
      return {
        temperatureOverride: 0.4,
        repeatPenalty: 1.2,
        frequencyPenalty: 0.1,
        presencePenalty: 0.1,
        topP: 0.85,
        topK: 40,
        repeatLastN: 96
      };
    // Add other presets...
    default:
      return {}; // Use defaults
  }
}

// Usage
class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected getParameterOverrides(): ModelParameterOverrides {
    return getPresetParameters(TextStylePreset.CREATIVE_WRITING);
  }
}
```

---

## Modelfile Examples

You can create custom Ollama models with optimized parameters using Modelfiles:

### Creative Writing Model

```dockerfile
FROM llama3  # or your preferred base model

# Set parameters
PARAMETER temperature 0.8
PARAMETER top_p 0.92
PARAMETER top_k 60
PARAMETER repeat_penalty 1.3
PARAMETER frequency_penalty 0.2
PARAMETER presence_penalty 0.2
PARAMETER repeat_last_n 128

# Custom system message
SYSTEM You are a professional author with a rich vocabulary. You pay special attention to avoiding word repetition and use varied expressions instead.
```

Save as `creative-writing.modelfile` and create the model:

```bash
ollama create creative-writing -f creative-writing.modelfile
```

### Technical Documentation Model

```dockerfile
FROM codellama:latest

PARAMETER temperature 0.3
PARAMETER top_p 0.8
PARAMETER top_k 30
PARAMETER repeat_penalty 1.05
PARAMETER presence_penalty 0.1
PARAMETER repeat_last_n 128

SYSTEM You are a technical writing expert. You provide clear, precise, and accurate documentation with consistent terminology.
```

Save as `tech-docs.modelfile` and create:

```bash
ollama create tech-docs -f tech-docs.modelfile
```

---

## Experimentation Tips

Finding optimal parameters requires systematic testing:

### 1. Start with a Preset

Begin with the preset closest to your use case, then iterate.

### 2. Change One Parameter at a Time

This helps you understand each parameter's individual impact:

```typescript
// Baseline
{ temperature: 0.8, repeatPenalty: 1.3 }

// Test temperature
{ temperature: 0.9, repeatPenalty: 1.3 }  // More creative?
{ temperature: 0.7, repeatPenalty: 1.3 }  // More focused?

// Test repeat penalty
{ temperature: 0.8, repeatPenalty: 1.4 }  // Less repetition?
{ temperature: 0.8, repeatPenalty: 1.2 }  // More natural?
```

### 3. Monitor Key Metrics

Pay attention to:
- **Repetition**: Count repeated words/phrases
- **Coherence**: Does output make logical sense?
- **Creativity**: Are outputs varied and interesting?
- **Relevance**: Does output stay on topic?

### 4. Use Reproducible Tests

Set a seed for consistent comparison:

```typescript
{
  seed: 12345,
  temperature: 0.8,
  // ... other parameters
}
```

### 5. Document Your Findings

Keep a log of what works:

```markdown
## Test Results

### Test 1: High Temperature
- Config: temp=1.0, repeat_penalty=1.3
- Result: Very creative but sometimes off-topic
- Score: 7/10

### Test 2: Balanced
- Config: temp=0.8, repeat_penalty=1.3
- Result: Good balance of creativity and coherence
- Score: 9/10
```

### 6. Parameter Interactions

Some parameters work together:

- `temperature` + `top_p`: Both control randomness; adjust together
- `repeat_penalty` + `frequency_penalty`: Combine for stronger anti-repetition
- `top_k` + `top_p`: Use one or the other, not both at extreme values

### Common Pitfalls

❌ **Too High Temperature** (> 1.2): Incoherent, random output  
❌ **Too Low Temperature** (< 0.3): Repetitive, boring output  
❌ **Excessive Penalties** (> 1.5): Awkward phrasing, grammatical issues  
❌ **Too Short repeat_last_n**: Repetition not detected across paragraphs  
❌ **Too Long repeat_last_n**: Penalizes necessary repetition

### Optimal Ranges by Use Case

| Use Case | Temperature | Repeat Penalty | Top P |
|----------|-------------|----------------|-------|
| Creative Writing | 0.7 - 0.9 | 1.2 - 1.4 | 0.9 - 0.95 |
| Factual Content | 0.3 - 0.5 | 1.1 - 1.3 | 0.8 - 0.9 |
| Poetry | 0.9 - 1.2 | 1.1 - 1.3 | 0.92 - 0.98 |
| Dialogue | 0.6 - 0.8 | 1.0 - 1.2 | 0.85 - 0.92 |
| Technical | 0.2 - 0.4 | 1.0 - 1.1 | 0.75 - 0.85 |
| Marketing | 0.6 - 0.8 | 1.2 - 1.4 | 0.88 - 0.93 |

---

## Additional Resources

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/modelfile.md)
- [Understanding Temperature in LLMs](https://txt.cohere.com/llm-parameters-best-outputs-language-ai/)
- [Sampling Methods Explained](https://huggingface.co/blog/how-to-generate)

---

**With proper parameter configuration, you can significantly improve the quality and consistency of AI-generated text for any use case.**

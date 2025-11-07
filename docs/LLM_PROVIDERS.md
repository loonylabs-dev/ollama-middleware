# LLM Providers Guide

This guide explains the multi-provider architecture in `@loonylabs/llm-middleware` and how to work with different LLM providers.

## Overview

Starting with v2.0.0, `@loonylabs/llm-middleware` supports multiple LLM providers through a clean provider strategy pattern. This architecture allows you to:

- Use multiple LLM providers in the same application
- Switch between providers easily
- Maintain provider-specific optimizations
- Extend with new providers without breaking existing code

## Architecture

### Provider Strategy Pattern

```
src/middleware/services/llm/
├── providers/
│   ├── base-llm-provider.ts       # Abstract base class
│   ├── ollama-provider.ts         # Ollama implementation (v2.0+)
│   ├── anthropic-provider.ts      # Anthropic implementation (v2.1+)
│   └── openai-provider.ts         # Coming soon
├── types/
│   ├── common.types.ts            # Provider-agnostic types
│   ├── ollama.types.ts            # Ollama-specific types
│   └── anthropic.types.ts         # Anthropic-specific types (v2.1+)
└── llm.service.ts                 # Main orchestrator
```

### Key Components

1. **BaseLLMProvider**: Abstract class that all providers must extend
2. **Provider Implementations**: Concrete implementations for each LLM service
3. **LLMService**: Orchestrator that manages multiple providers
4. **Type System**: Common and provider-specific type definitions

## Currently Available Providers

### Ollama Provider (v2.0+)

Full-featured provider for Ollama with:
- Comprehensive parameter support
- Authentication retry strategies
- Session management
- Advanced debugging and logging

**Usage:**

```typescript
import { ollamaProvider } from '@loonylabs/llm-middleware';

const response = await ollamaProvider.callWithSystemMessage(
  "Write a haiku about coding",
  "You are a helpful assistant",
  {
    model: "llama2",
    temperature: 0.7,
    // Ollama-specific parameters
    repeat_penalty: 1.1,
    top_k: 40,
    num_predict: 100
  }
);
```

## Using the LLM Service Orchestrator

The `LLMService` provides a unified interface for all providers:

```typescript
import { llmService, LLMProvider } from '@loonylabs/llm-middleware';

// Use default provider (Ollama)
const response1 = await llmService.call(
  "Hello, world!",
  { model: "llama2" }
);

// Explicitly specify provider
const response2 = await llmService.call(
  "Hello, world!",
  {
    provider: LLMProvider.OLLAMA,
    model: "llama2"
  }
);

// Set default provider
llmService.setDefaultProvider(LLMProvider.OLLAMA);

// Get available providers
const providers = llmService.getAvailableProviders();
console.log('Available:', providers);
```

## Provider-Specific Features

### Ollama

**Supported Parameters:**
- `repeat_penalty` - Penalty for repeating tokens (default: 1.1)
- `top_p` - Top-p sampling (nucleus sampling)
- `top_k` - Top-k sampling
- `frequency_penalty` - Frequency penalty for token repetition
- `presence_penalty` - Presence penalty for new topics
- `repeat_last_n` - Number of previous tokens to consider
- `num_predict` - Maximum number of tokens to predict
- `mirostat`, `mirostat_eta`, `mirostat_tau` - Mirostat sampling
- `tfs_z` - Tail-free sampling
- `typical_p` - Typical sampling
- `num_thread` - Number of threads to use

**Documentation:** See [OLLAMA_PARAMETERS.md](./OLLAMA_PARAMETERS.md)

### Anthropic Provider (v2.1+)

Full support for Anthropic Claude models with:
- All Claude 3.x models (Opus, Sonnet, Haiku)
- Claude 4.x models (Sonnet, Haiku)
- Extended context windows (up to 200K tokens)
- System prompts
- Lightweight axios-based implementation (no SDK dependency)

**Usage:**

```typescript
import { anthropicProvider, llmService, LLMProvider } from '@loonylabs/llm-middleware';

// Option 1: Use via LLM Service
const response1 = await llmService.call(
  "Explain quantum computing",
  {
    provider: LLMProvider.ANTHROPIC,
    model: "claude-3-5-sonnet-20241022",
    authToken: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    temperature: 0.7
  }
);

// Option 2: Use provider directly
const response2 = await anthropicProvider.callWithSystemMessage(
  "Write a haiku about coding",
  "You are a creative poet",
  {
    model: "claude-3-5-sonnet-20241022",
    authToken: process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 50
  }
);
```

**Supported Parameters:**
- `maxTokens` - Maximum tokens to generate (required, 1-4096)
- `temperature` - Randomness control (0-1, default: 0.7)
- `top_p` - Nucleus sampling (0-1)
- `top_k` - Top-k sampling
- `stop_sequences` - Custom stop sequences

**Configuration:**

```env
ANTHROPIC_API_KEY=sk-ant-api03-...your-key...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### OpenAI (Coming in v2.2)

Planned support for:
- GPT-4, GPT-3.5-turbo, etc.
- Streaming responses
- Function calling
- Vision capabilities

### Google (Coming in v2.2)

Planned support for:
- Gemini models
- Multimodal inputs

## Adding a New Provider

To add a new provider, follow these steps:

### 1. Create Provider Types

Create a new file `src/middleware/services/llm/types/{provider}.types.ts`:

```typescript
import { CommonLLMOptions, CommonLLMResponse } from './common.types';

export interface CustomProviderOptions extends CommonLLMOptions {
  // Provider-specific options
  customParam1?: string;
  customParam2?: number;
}

export interface CustomProviderResponse extends CommonLLMResponse {
  // Provider-specific response fields
  customField?: string;
}
```

### 2. Implement Provider Class

Create `src/middleware/services/llm/providers/custom-provider.ts`:

```typescript
import { BaseLLMProvider } from './base-llm-provider';
import { LLMProvider, CommonLLMResponse } from '../types';
import { CustomProviderOptions } from '../types/custom.types';

export class CustomProvider extends BaseLLMProvider {
  constructor() {
    super(LLMProvider.CUSTOM); // Add CUSTOM to enum
  }

  async callWithSystemMessage(
    userPrompt: string,
    systemMessage: string,
    options: CustomProviderOptions = {}
  ): Promise<CommonLLMResponse | null> {
    // Implementation here
    // 1. Validate options
    // 2. Make API call
    // 3. Handle response
    // 4. Log with LLMDebugger
    // 5. Return normalized response
  }
}

export const customProvider = new CustomProvider();
```

### 3. Register Provider

Add to `src/middleware/services/llm/llm.service.ts`:

```typescript
constructor() {
  this.providers = new Map();
  this.providers.set(LLMProvider.OLLAMA, new OllamaProvider());
  this.providers.set(LLMProvider.CUSTOM, new CustomProvider()); // Add here
}
```

### 4. Export

Update `src/middleware/services/llm/providers/index.ts`:

```typescript
export * from './custom-provider';
```

### 5. Update Enum

Add to `src/middleware/services/llm/types/common.types.ts`:

```typescript
export enum LLMProvider {
  OLLAMA = 'ollama',
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  CUSTOM = 'custom' // Add here
}
```

## Debugging and Logging

All providers use the unified `LLMDebugger`:

```typescript
import { LLMDebugger, LLMDebugInfo } from '@loonylabs/llm-middleware';

// Logs are organized by provider
// logs/llm/ollama/requests/
// logs/llm/openai/requests/
// logs/llm/anthropic/requests/
```

### Environment Variables

```bash
# Enable debug logging for all providers
DEBUG_LLM_REQUESTS=true

# Minimal console output
DEBUG_LLM_MINIMAL=true

# Hide responses in console
DEBUG_LLM_RESPONSE_CONSOLE=false

# Backward compatibility (still works)
DEBUG_OLLAMA_REQUESTS=true
DEBUG_OLLAMA_MINIMAL=true
```

## Type System

### Common Types (Provider-Agnostic)

```typescript
interface CommonLLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  baseUrl?: string;
  authToken?: string;
  debugContext?: string;
  sessionId?: string;
  providerSpecific?: Record<string, any>;
}

interface CommonLLMResponse {
  message: { content: string };
  sessionId?: string;
  metadata?: {
    provider: string;
    model: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}
```

### Provider-Specific Types

Each provider extends the common types with their own parameters. See provider-specific documentation for details.

## Best Practices

1. **Use LLMService for flexibility**: Start with the `LLMService` orchestrator to easily switch providers
2. **Provider-specific code**: Use direct provider imports when you need provider-specific features
3. **Type safety**: Leverage TypeScript types for each provider
4. **Error handling**: All providers return `null` on error and log appropriately
5. **Testing**: Test with different providers to ensure portability

## Examples

### Multi-Provider Application

```typescript
import {
  llmService,
  LLMProvider,
  ollamaProvider
} from '@loonylabs/llm-middleware';

async function processWithBestProvider(prompt: string) {
  // Try Ollama first (local, fast)
  let response = await llmService.call(prompt, {
    provider: LLMProvider.OLLAMA,
    model: "llama2"
  });

  if (!response) {
    // Fallback to cloud provider
    console.log('Ollama failed, trying fallback...');
    // Future: OpenAI fallback
  }

  return response;
}
```

### Provider-Specific Optimization

```typescript
import { ollamaProvider } from '@loonylabs/llm-middleware';

// Use Ollama-specific parameters for fine-tuning
const response = await ollamaProvider.callWithSystemMessage(
  prompt,
  systemMessage,
  {
    model: "llama2",
    temperature: 0.7,
    // Ollama-specific optimizations
    repeat_penalty: 1.15,
    top_k: 40,
    mirostat: 2,
    mirostat_tau: 5.0
  }
);
```

## Migration from v1.x

If you're migrating from v1.x (ollama-middleware), see [CHANGELOG.md](../CHANGELOG.md) for the complete migration guide.

**TL;DR:**
- Update package name
- Imports still work (backward compatible)
- Optionally adopt new provider architecture

## Roadmap

### v2.1 (Released)
- ✅ Anthropic Provider (Claude models)
- ✅ Parametrized provider testing
- ✅ Provider-specific logging

### v2.2 (Planned)
- OpenAI Provider (GPT models)
- Google Provider (Gemini models)
- Unified parameter mapping
- Streaming support across providers

### v2.3 (Planned)
- Provider health checking
- Automatic failover
- Response caching

### v3.0 (Future)
- Plugin system
- Custom provider registration
- Advanced routing strategies

## Contributing

Want to add a provider? See our [Contributing Guide](../CONTRIBUTING.md) and submit a PR!

## Support

- **Issues**: [GitHub Issues](https://github.com/loonylabs-dev/llm-middleware/issues)
- **Discussions**: [GitHub Discussions](https://github.com/loonylabs-dev/llm-middleware/discussions)
- **Documentation**: [README.md](../README.md)

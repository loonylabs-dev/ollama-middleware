# Custom Config Example

This example demonstrates how to override the model configuration provider to use your own custom model configurations instead of the library's default `MODELS` config.

## Overview

The **Protected Method Pattern** introduced in v2.3.0 allows you to easily customize where your model configurations come from by overriding the `getModelConfigProvider()` method.

## Use Cases

This pattern is useful when you need to:

- **Multi-environment deployments**: Different model configs for dev, staging, and production
- **Dynamic model selection**: Choose models based on runtime conditions
- **External config sources**: Load model configs from a database, API, or external service
- **Testing scenarios**: Use different model configurations for different test scenarios

## The Pattern

### New Pattern (Recommended)

Override the `getModelConfigProvider()` method:

```typescript
protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
  return myCustomGetModelConfig(key);
}
```

### Old Pattern (Still Supported)

Override the entire `modelConfig` getter:

```typescript
protected get modelConfig(): ValidatedLLMModelConfig {
  return myCustomGetModelConfig(this.modelConfigKey);
}
```

The new pattern is cleaner and more flexible.

## Examples in This Directory

### 1. `CustomConfigUseCase`

Basic example showing how to use your own model configuration source:

```typescript
import { CustomConfigUseCase } from './custom-config.usecase';

const useCase = new CustomConfigUseCase();
const result = await useCase.execute({
  prompt: 'What is the capital of France?'
});

console.log(result.parsedResponse.response);
```

**Key Features:**
- Uses custom `MY_CUSTOM_MODELS` config instead of library's `MODELS`
- Defines multiple model configs (PRODUCTION_MODEL, DEVELOPMENT_MODEL, STAGING_MODEL)
- Shows validation and error handling

### 2. `EnvironmentAwareUseCase`

Advanced example showing dynamic model selection based on `NODE_ENV`:

```typescript
import { EnvironmentAwareUseCase } from './custom-config.usecase';

// Automatically selects the right model based on NODE_ENV
const useCase = new EnvironmentAwareUseCase();
const result = await useCase.execute({
  prompt: 'Explain quantum computing'
});
```

**Key Features:**
- Automatically selects model based on environment
- Production → PRODUCTION_MODEL
- Staging → STAGING_MODEL
- Development → DEVELOPMENT_MODEL
- Logs which model is being used

## How It Works

### Step 1: Define Your Custom Models

```typescript
const MY_CUSTOM_MODELS: Record<string, ValidatedLLMModelConfig> = {
  'MY_MODEL': {
    name: 'llama3.2:latest',
    baseUrl: 'http://my-server.com:11434',
    temperature: 0.7
  }
};
```

### Step 2: Override `getModelConfigProvider()`

```typescript
export class MyUseCase extends BaseAIUseCase<string, MyRequest, MyResult> {
  protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
    const config = MY_CUSTOM_MODELS[key];

    if (!config?.name) {
      throw new Error(`Model ${key} not found`);
    }

    return config;
  }

  // ... rest of your use case implementation
}
```

### Step 3: Use Your Use Case

```typescript
const useCase = new MyUseCase();
const result = await useCase.execute({ prompt: 'Hello!' });
```

## Running the Examples

To use these examples in your project:

1. **Copy the use case** to your project
2. **Customize** `MY_CUSTOM_MODELS` with your actual model configurations
3. **Set environment variables** if using the EnvironmentAwareUseCase:
   ```bash
   NODE_ENV=production node your-app.js
   ```

## Benefits

- **Separation of Concerns**: Model config logic is isolated in one method
- **Flexibility**: Easy to switch between different config sources
- **Testability**: Easy to mock different configurations for testing
- **Backward Compatible**: Old pattern still works
- **Clean Code**: No need to override entire `modelConfig` getter

## Advanced Scenarios

### Loading from Database

```typescript
protected async getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
  const config = await database.getModelConfig(key);
  return config;
}
```

### Feature Flags

```typescript
protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
  if (featureFlags.useNewModel) {
    return NEW_MODELS[key];
  }
  return OLD_MODELS[key];
}
```

### A/B Testing

```typescript
protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
  const variant = getABTestVariant(userId);
  return variant === 'A' ? MODEL_A : MODEL_B;
}
```

## See Also

- [BaseAIUseCase Documentation](../../middleware/usecases/base/base-ai.usecase.ts)
- [Model Configuration Types](../../middleware/shared/config/models.config.ts)
- [Other Examples](../)

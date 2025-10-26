<div align="center">

# 🚀 Ollama Middleware

*A comprehensive TypeScript middleware library for building robust Ollama-based AI backends with advanced features like JSON cleaning, logging, error handling, and more.*

<!-- Horizontal Badge Navigation Bar -->
[![npm version](https://img.shields.io/npm/v/ollama-middleware.svg?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ollama-middleware)
[![npm downloads](https://img.shields.io/npm/dm/ollama-middleware.svg?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/ollama-middleware)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg?style=for-the-badge&logo=typescript&logoColor=white)](#-features)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#-prerequisites)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge&logo=opensource&logoColor=white)](#-license)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/loonylabs-dev/ollama-middleware)

</div>

<!-- Table of Contents -->
<details>
<summary>📋 <strong>Table of Contents</strong></summary>

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📋 Prerequisites](#-prerequisites)
- [⚙️ Configuration](#️-configuration)
- [🏗️ Architecture](#️-architecture)
- [📖 Documentation](#-documentation)
- [🧪 Testing and Examples](#-testing-and-examples)
- [🔧 Advanced Features](#-advanced-features)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🙏 Acknowledgments](#-acknowledgments)
- [🔗 Links](#-links)

</details>

---

## ✨ Features

- 🏗️ **Clean Architecture**: Base classes and interfaces for scalable AI applications
- 🤖 **Ollama Integration**: Complete service layer with retry logic and authentication
- 🧹 **JSON Cleaning**: Recipe-based JSON repair system with automatic strategy selection
- 🎨 **FlatFormatter System**: Advanced data formatting for LLM consumption
- 📊 **Comprehensive Logging**: Multi-level logging with metadata support
- ⚙️ **Configuration Management**: Flexible model and application configuration
- 🛡️ **Error Handling**: Robust error handling and recovery mechanisms
- 🔧 **TypeScript First**: Full type safety throughout the entire stack
- 📦 **Modular Design**: Use only what you need
- 🧪 **Testing Ready**: Includes example implementations and test utilities

## 🚀 Quick Start

### Installation

Install from npm:

```bash
npm install ollama-middleware
```

Or install directly from GitHub:

```bash
npm install github:loonylabs-dev/ollama-middleware
```

Or using a specific version/tag:

```bash
npm install github:loonylabs-dev/ollama-middleware#v1.1.0
```

### Basic Usage

```typescript
import { BaseAIUseCase, BaseAIRequest, BaseAIResult } from 'ollama-middleware';

// Define your request/response interfaces
interface MyRequest extends BaseAIRequest<string> {
  message: string;
}

interface MyResult extends BaseAIResult {
  response: string;
}

// Create your use case
class MyChatUseCase extends BaseAIUseCase<string, MyRequest, MyResult> {
  protected readonly systemMessage = "You are a helpful assistant.";
  
  // Required: return user message template function
  protected getUserTemplate(): (formattedPrompt: string) => string {
    return (message) => message;
  }
  
  protected formatUserMessage(prompt: any): string {
    return typeof prompt === 'string' ? prompt : prompt.message;
  }
  
  protected createResult(content: string, usedPrompt: string, thinking?: string): MyResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: usedPrompt,
      thinking: thinking,
      response: content
    };
  }
}
```

<details>
<summary><strong>🎭 Advanced Example with FlatFormatter</strong></summary>

```typescript
import { 
  FlatFormatter, 
  personPreset
} from 'ollama-middleware';

class ProfileGeneratorUseCase extends BaseAIUseCase {
  protected readonly systemMessage = `You are a professional profile creator.
  
IMPORTANT: Respond with ONLY valid JSON following this schema:
{
  "name": "Person name",
  "title": "Professional title", 
  "summary": "Brief professional overview",
  "skills": "Key skills and expertise",
  "achievements": "Notable accomplishments"
}`;

  // Use FlatFormatter and presets for rich context building
  protected formatUserMessage(prompt: any): string {
    const { person, preferences, guidelines } = prompt;
    
    const contextSections = [
      // Use preset for structured data
      personPreset.formatForLLM(person, "## PERSON INFO:"),
      
      // Use FlatFormatter for custom structures
      `## PREFERENCES:\n${FlatFormatter.flatten(preferences, {
        format: 'bulleted',
        keyValueSeparator: ': '
      })}`,
      
      // Format guidelines with FlatFormatter
      `## GUIDELINES:\n${FlatFormatter.flatten(
        guidelines.map(g => ({ 
          guideline: g,
          priority: "MUST FOLLOW" 
        })),
        {
          format: 'numbered',
          entryTitleKey: 'guideline',
          ignoredKeys: ['guideline']
        }
      )}`
    ];
    
    return contextSections.join('\n\n');
  }
  
  protected createResult(content: string, usedPrompt: string, thinking?: string): MyResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      profile: JSON.parse(content)
    };
  }
}

// Use it
const profileGen = new ProfileGeneratorUseCase();
const result = await profileGen.execute({ 
  prompt: { 
    person: { name: "Alice", occupation: "Engineer" },
    preferences: { tone: "professional", length: "concise" },
    guidelines: ["Highlight technical skills", "Include leadership"]
  },
  authToken: "optional-token"
});
```

</details>

## 📋 Prerequisites

<details>
<summary><strong>📦 Required Dependencies</strong></summary>

- **Node.js** 18+
- **TypeScript** 4.9+
- **Ollama server** running (local or remote)

</details>

## ⚙️ Configuration

<details>
<summary><strong>🔧 Environment Setup</strong></summary>

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Ollama Model Configuration (REQUIRED)
MODEL1_NAME=phi3:mini              # Required: Your model name
MODEL1_URL=http://localhost:11434  # Optional: Defaults to localhost
MODEL1_TOKEN=optional-auth-token   # Optional: For authenticated servers
```

</details>

## 🏗️ Architecture

The middleware follows **Clean Architecture** principles:

```
src/
├── middleware/
│   ├── controllers/base/     # Base HTTP controllers
│   ├── usecases/base/        # Base AI use cases
│   ├── services/             # External service integrations
│   │   ├── ollama/          # Ollama API service
│   │   ├── json-cleaner/    # JSON repair and validation
│   │   └── response-processor/ # AI response processing
│   └── shared/              # Common utilities and types
│       ├── config/          # Configuration management
│       ├── types/           # TypeScript interfaces
│       └── utils/           # Utility functions
└── examples/               # Example implementations
    └── simple-chat/        # Basic chat example
```

## 📖 Documentation

- [Getting Started Guide](docs/GETTING_STARTED.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Ollama Parameters Guide](docs/OLLAMA_PARAMETERS.md) - Complete parameter reference and presets
- [Request Formatting Guide](docs/REQUEST_FORMATTING.md) - FlatFormatter vs RequestFormatterService
- [Performance Monitoring](docs/PERFORMANCE_MONITORING.md) - Metrics and logging
- [API Reference](docs/API_REFERENCE.md)
- [Examples](docs/EXAMPLES.md)
- [CHANGELOG](CHANGELOG.md) - Release notes and breaking changes

## 🧪 Testing

The middleware includes comprehensive test suites covering unit tests, integration tests, robustness tests, and end-to-end workflows.

### Quick Start

```bash
# Build the middleware first
npm run build

# Run all automated tests
npm run test:all

# Run unit tests only
npm run test:unit
```

**📖 For complete testing documentation**, see **[tests/README.md](tests/README.md)**

The test documentation includes:
- 📋 Quick reference table for all tests
- 🚀 Detailed test descriptions and prerequisites
- ⚠️ Troubleshooting guide
- 🔬 Development workflow best practices

### 🐦 Tweet Generator Example

<details>
<summary><strong>💬 Demonstrating Token Limiting with Social Media Content</strong></summary>

The **Tweet Generator** example showcases parameter configuration for controlling output length:

```typescript
import { TweetGeneratorUseCase } from 'ollama-middleware';

const tweetGenerator = new TweetGeneratorUseCase();

const result = await tweetGenerator.execute({
  prompt: 'The importance of clean code in software development'
});

console.log(result.tweet);          // Generated tweet
console.log(result.characterCount); // Character count
console.log(result.withinLimit);    // true if ≤ 280 chars
```

**Key Features:**
- 🎯 **Token Limiting**: Uses `num_predict: 70` to limit output to ~280 characters
- 📊 **Character Validation**: Automatically checks if output is within Twitter's limit
- 🎨 **Marketing Preset**: Optimized parameters for engaging, concise content
- ✅ **Testable**: Integration test verifies parameter effectiveness

**Parameter Configuration:**
```typescript
protected getParameterOverrides(): ModelParameterOverrides {
  return {
    num_predict: 70,        // Limit to ~280 characters
    temperatureOverride: 0.7,
    repeatPenalty: 1.3,
    frequencyPenalty: 0.3,
    presencePenalty: 0.2,
    topP: 0.9,
    topK: 50,
    repeatLastN: 32
  };
}
```

This example demonstrates:
- How to configure parameters for specific output requirements
- Token limiting as a practical use case
- Validation and testing of parameter effectiveness
- Real-world application (social media content generation)

See `src/examples/tweet-generator/` for full implementation.

</details>

### 🎯 Example Application

<details>
<summary><strong>🚀 Quick Example Setup</strong></summary>

Run the included examples:

```bash
# Clone the repository
git clone https://github.com/loonylabs-dev/ollama-middleware.git
cd ollama-middleware

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start Ollama (if running locally)
ollama serve

# Run the example
npm run dev
```

Test the API:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

</details>

## 🔧 Advanced Features

<details>
<summary><strong>🧹 Recipe-Based JSON Cleaning System</strong></summary>

Advanced JSON repair with automatic strategy selection and modular operations:

```typescript
import { JsonCleanerService, JsonCleanerFactory } from 'ollama-middleware';

// Simple usage (async - uses new recipe system with fallback)
const result = await JsonCleanerService.processResponseAsync(malformedJson);
console.log(result.cleanedJson);

// Legacy sync method (still works)
const cleaned = JsonCleanerService.processResponse(malformedJson);

// Advanced: Quick clean with automatic recipe selection
const result = await JsonCleanerFactory.quickClean(malformedJson);
console.log('Success:', result.success);
console.log('Confidence:', result.confidence);
console.log('Changes:', result.totalChanges);
```

**Features:**
- 🎯 Automatic strategy selection (Conservative/Aggressive/Adaptive)
- 🔧 Modular detectors & fixers for specific problems
- ✨ Extracts JSON from Markdown/Think-Tags
- 🔄 Checkpoint/Rollback support for safe repairs
- 📊 Detailed metrics (confidence, quality, performance)
- 🛡️ Fallback to legacy system for compatibility

**Available Templates:**
```typescript
import { RecipeTemplates } from 'ollama-middleware';

const conservativeRecipe = RecipeTemplates.conservative();
const aggressiveRecipe = RecipeTemplates.aggressive();
const adaptiveRecipe = RecipeTemplates.adaptive();
```

See [Recipe System Documentation](src/middleware/services/json-cleaner/recipe-system/README.md) for details.

</details>

<details>
<summary><strong>📝 Request Formatting (FlatFormatter & RequestFormatterService)</strong></summary>

**For simple data:** Use [FlatFormatter](src/middleware/services/flat-formatter/README.md)
```typescript
const flat = FlatFormatter.flatten({ name: 'Alice', age: 30 });
```

**For complex nested prompts:** Use RequestFormatterService
```typescript
import { RequestFormatterService } from 'ollama-middleware';

const prompt = {
  context: { genre: 'sci-fi', tone: 'dark' },
  instruction: 'Write an opening'
};

const formatted = RequestFormatterService.formatUserMessage(
  prompt, (s) => s, 'MyUseCase'
);
// Outputs: ## CONTEXT:\ngenre: sci-fi\ntone: dark\n\n## INSTRUCTION:\nWrite an opening
```

See [Request Formatting Guide](docs/REQUEST_FORMATTING.md) for details.

</details>

<details>
<summary><strong>📊 Performance Monitoring & Metrics</strong></summary>

Automatic performance tracking with `UseCaseMetricsLoggerService`:

```typescript
// Automatically logged for all use cases:
// - Execution time
// - Token usage (input/output)
// - Generation speed (tokens/sec)
// - Parameters used
```

Metrics appear in console logs:
```
✅ Completed AI use case [MyUseCase = phi3:mini] SUCCESS
   Time: 2.5s | Input: 120 tokens | Output: 85 tokens | Speed: 34.0 tokens/sec
```

See [Performance Monitoring Guide](docs/PERFORMANCE_MONITORING.md) for advanced usage.

</details>

<details>
<summary><strong>📊 Comprehensive Logging</strong></summary>

Multi-level logging with contextual metadata:

```typescript
import { logger } from 'ollama-middleware';

logger.info('Operation completed', {
  context: 'MyService',
  metadata: { userId: 123, duration: 150 }
});
```

</details>

<details>
<summary><strong>⚙️ Model Configuration</strong></summary>

Flexible model management:

```typescript
import { getModelConfig } from 'ollama-middleware';

// MODEL1_NAME is required in .env or will throw error
const config = getModelConfig('MODEL1');
console.log(config.name);     // Value from MODEL1_NAME env variable
console.log(config.baseUrl);  // Value from MODEL1_URL or default localhost
```

</details>

<details>
<summary><strong>🎛️ Parameter Configuration</strong></summary>

Ollama-middleware provides fine-grained control over model parameters to optimize output for different use cases:

```typescript
import { BaseAIUseCase, ModelParameterOverrides } from 'ollama-middleware';

class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected getParameterOverrides(): ModelParameterOverrides {
    return {
      temperatureOverride: 0.8,      // Control creativity vs. determinism
      repeatPenalty: 1.3,             // Reduce word repetition
      frequencyPenalty: 0.2,          // Penalize frequent words
      presencePenalty: 0.2,           // Encourage topic diversity
      topP: 0.92,                     // Nucleus sampling threshold
      topK: 60,                       // Vocabulary selection limit
      repeatLastN: 128                // Context window for repetition
    };
  }
}
```

**Parameter Levels:**
- **Global defaults**: Set in `ModelParameterManagerService`
- **Use-case level**: Override via `getParameterOverrides()` method
- **Request level**: Pass parameters directly in requests

**Available Presets:**

```typescript
import { ModelParameterManagerService } from 'ollama-middleware';

// Use curated presets for common use cases
const creativeParams = ModelParameterManagerService.getDefaultParametersForType('creative_writing');
const factualParams = ModelParameterManagerService.getDefaultParametersForType('factual');
const poeticParams = ModelParameterManagerService.getDefaultParametersForType('poetic');
const dialogueParams = ModelParameterManagerService.getDefaultParametersForType('dialogue');
const technicalParams = ModelParameterManagerService.getDefaultParametersForType('technical');
const marketingParams = ModelParameterManagerService.getDefaultParametersForType('marketing');
```

**Presets Include:**
- 📚 **Creative Writing**: Novels, stories, narrative fiction
- 📊 **Factual**: Reports, documentation, journalism
- 🎭 **Poetic**: Poetry, lyrics, artistic expression
- 💬 **Dialogue**: Character dialogue, conversational content
- 🔧 **Technical**: Code documentation, API references
- 📢 **Marketing**: Advertisements, promotional content

For detailed documentation about all parameters, value ranges, and preset configurations, see:
**[Ollama Parameters Guide](./docs/OLLAMA_PARAMETERS.md)**

</details>

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for the amazing local LLM platform
- The open-source community for inspiration and contributions

## 🔗 Links

- [📚 Documentation](https://github.com/loonylabs-dev/ollama-middleware/docs)
- [🐛 Issues](https://github.com/loonylabs-dev/ollama-middleware/issues)
- [📦 NPM Package](https://www.npmjs.com/package/ollama-middleware)

---

<div align="center">

**Made with ❤️ for the AI community**

[![GitHub stars](https://img.shields.io/github/stars/loonylabs-dev/ollama-middleware?style=social)](https://github.com/loonylabs-dev/ollama-middleware/stargazers)
[![Follow on GitHub](https://img.shields.io/github/followers/loonylabs-dev?style=social&label=Follow)](https://github.com/loonylabs-dev)

</div>
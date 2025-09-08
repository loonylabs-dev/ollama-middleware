<div align="center">

# 🚀 Ollama Middleware

*A comprehensive TypeScript middleware library for building robust Ollama-based AI backends with advanced features like JSON cleaning, logging, error handling, and more.*

<!-- Horizontal Badge Navigation Bar -->
[![GitHub Install](https://img.shields.io/badge/Install-GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](#-quick-start)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg?style=for-the-badge&logo=typescript&logoColor=white)](#-features)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#-prerequisites)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#-quick-start)
[![API Documentation](https://img.shields.io/badge/API-Documented-FF6B35?style=for-the-badge&logo=swagger&logoColor=white)](#-documentation)
[![Test Coverage](https://img.shields.io/badge/Tests-Comprehensive-4CAF50?style=for-the-badge&logo=jest&logoColor=white)](#-testing-and-examples)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge&logo=opensource&logoColor=white)](#-license)

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
- 🧹 **JSON Cleaning**: Advanced JSON repair and validation system
- 🎨 **FlatFormatter System**: Advanced data formatting for LLM consumption
- 📊 **Comprehensive Logging**: Multi-level logging with metadata support
- ⚙️ **Configuration Management**: Flexible model and application configuration
- 🛡️ **Error Handling**: Robust error handling and recovery mechanisms
- 🔧 **TypeScript First**: Full type safety throughout the entire stack
- 📦 **Modular Design**: Use only what you need
- 🧪 **Testing Ready**: Includes example implementations and test utilities

## 🚀 Quick Start

### Installation

Install directly from GitHub:

```bash
npm install git+https://github.com/planichttm/ollama-middleware.git
```

Or using a specific version/tag:

```bash
npm install git+https://github.com/planichttm/ollama-middleware.git#v1.0.0
```

### Basic Usage

```typescript
import { BaseAIUseCase, BaseAIRequest, BaseAIResult } from 'ollama-middleware';

// Define your request/response interfaces
interface MyRequest extends BaseAIRequest {
  message: string;
}

interface MyResult extends BaseAIResult {
  response: string;
}

// Create your use case
class MyChatUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  protected readonly systemMessage = "You are a helpful assistant.";
  
  protected formatUserMessage(prompt: any): string {
    return prompt.message;
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
<summary><strong>🎭 Advanced Character Generation Example</strong></summary>

```typescript
import { 
  FlatFormatter, 
  LLMContextBuilder,
  characterPreset,
  genrePreset,
  settingPreset 
} from 'ollama-middleware';

class CharacterGeneratorUseCase {
  protected readonly systemMessage = `You are an expert character creator.
  
IMPORTANT: Respond with ONLY valid JSON following this schema:
{
  "Name": "Character name",
  "Age": "Character age", 
  "Description": "Brief character overview",
  "Personality": "Core personality traits",
  "Background": "Character history",
  "Goals": "What they want to achieve",
  "Conflicts": "Internal and external conflicts"
}`;

  // Use FlatFormatter and presets for rich context building
  protected formatUserMessage(prompt: any): string {
    const { role, setting, genre, constraints } = prompt;
    
    const contextSections = [
      `## CHARACTER ROLE: ${role}`,
      settingPreset.formatForLLM(setting, "## STORY SETTING:"),
      genrePreset.formatForLLM(genre, "## GENRE REQUIREMENTS:"),
      
      // Format constraints with FlatFormatter
      FlatFormatter.flatten(
        constraints.map(constraint => ({ 
          constraint: constraint,
          priority: "MUST FOLLOW" 
        })),
        {
          format: 'numbered',
          entryTitleKey: 'constraint',
          ignoredKeys: ['constraint']
        }
      )
    ];
    
    return contextSections.join('\n\n');
  }
}
  
  protected createResult(content: string, usedPrompt: string, thinking?: string): MyResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      response: content
    };
  }
}

// Use it
const chatUseCase = new MyChatUseCase();
const result = await chatUseCase.execute({ 
  prompt: { message: "Hello!" },
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

# Ollama Model Configuration
MODEL1_URL=http://localhost:11434
MODEL1_NAME=mistral:latest
MODEL1_TOKEN=optional-auth-token
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
- [API Reference](docs/API_REFERENCE.md)
- [Examples](docs/EXAMPLES.md)

## 🧪 Testing and Examples

### 🏃‍♂️ Run Built-in Tests

The middleware includes comprehensive test suites:

```bash
# Build the middleware
npm run build

# Test basic components
node test-middleware.js

# Test complete End-to-End workflow  
node test-e2e-workflow.js

# Test robustness and error handling
node test-robustness.js

# Test FlatFormatter system
node test-flat-formatter.js
```

<details>
<summary><strong>📊 Test Results Summary</strong></summary>

- ✅ **Component Tests**: All services working (JSON Cleaner, Response Processor, etc.)
- ✅ **E2E Workflow**: Complete pipeline from request to parsed result
- ✅ **JSON Robustness**: 80% success rate on malformed JSON repair
- ✅ **Error Handling**: 100% graceful handling of extreme scenarios
- ✅ **Performance**: Large JSON processing at 1.1M chars/second

</details>

### 🎯 Example Application

<details>
<summary><strong>🚀 Quick Example Setup</strong></summary>

Run the included examples:

```bash
# Clone the repository
git clone https://github.com/planichttm/ollama-middleware.git
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
<summary><strong>🧹 JSON Cleaning System</strong></summary>

Automatically repair malformed JSON responses from AI models:

```typescript
import { JsonCleanerService } from 'ollama-middleware';

const malformedJson = '{"key": "value",}'; // trailing comma
const cleaned = JsonCleanerService.processResponse(malformedJson);
console.log(cleaned.cleanedJson); // {"key": "value"}
```

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

const config = getModelConfig('MODEL1');
console.log(config.name);     // mistral:latest
console.log(config.baseUrl);  // http://localhost:11434
```

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

- [📚 Documentation](https://github.com/planichttm/ollama-middleware/docs)
- [🐛 Issues](https://github.com/planichttm/ollama-middleware/issues)
- [📦 NPM Package](https://www.npmjs.com/package/ollama-middleware)

---

<div align="center">

**Made with ❤️ for the AI community**

[![GitHub stars](https://img.shields.io/github/stars/planichttm/ollama-middleware?style=social)](https://github.com/planichttm/ollama-middleware/stargazers)
[![Follow on GitHub](https://img.shields.io/github/followers/planichttm?style=social&label=Follow)](https://github.com/planichttm)

</div>
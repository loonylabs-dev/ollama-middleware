# Ollama Middleware

A comprehensive TypeScript middleware library for building robust Ollama-based AI backends with advanced features like JSON cleaning, logging, error handling, and more.

[![npm version](https://img.shields.io/npm/v/ollama-middleware.svg)](https://www.npmjs.com/package/ollama-middleware)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🏗️ **Clean Architecture**: Base classes and interfaces for scalable AI applications
- 🤖 **Ollama Integration**: Complete service layer with retry logic and authentication
- 🧹 **JSON Cleaning**: Advanced JSON repair and validation system
- 📊 **Comprehensive Logging**: Multi-level logging with metadata support
- ⚙️ **Configuration Management**: Flexible model and application configuration
- 🛡️ **Error Handling**: Robust error handling and recovery mechanisms
- 🔧 **TypeScript First**: Full type safety throughout the entire stack
- 📦 **Modular Design**: Use only what you need
- 🧪 **Testing Ready**: Includes example implementations and test utilities

## 🚀 Quick Start

### Installation

```bash
npm install ollama-middleware
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

## 📋 Prerequisites

- Node.js 18+
- TypeScript 4.9+
- Ollama server running (local or remote)

## ⚙️ Configuration

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Ollama Models
MODEL1_URL=http://localhost:11434
MODEL1_NAME=mistral:latest
MODEL1_TOKEN=optional-auth-token

MODEL2_URL=http://localhost:11434
MODEL2_NAME=llama3.3:latest

MODEL3_URL=http://localhost:11434
MODEL3_NAME=gemma:latest
```

## 🏗️ Architecture

The middleware follows Clean Architecture principles:

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

## 🧪 Example Application

Run the included chat example:

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
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how are you?"}'
```

## 🔧 Advanced Features

### JSON Cleaning System
Automatically repair malformed JSON responses from AI models:

```typescript
import { JsonCleanerService } from 'ollama-middleware';

const malformedJson = '{"key": "value",}'; // trailing comma
const cleaned = JsonCleanerService.processResponse(malformedJson);
console.log(cleaned.cleanedJson); // {"key": "value"}
```

### Comprehensive Logging
Multi-level logging with contextual metadata:

```typescript
import { logger } from 'ollama-middleware';

logger.info('Operation completed', {
  context: 'MyService',
  metadata: { userId: 123, duration: 150 }
});
```

### Model Configuration
Flexible model management:

```typescript
import { getModelConfig } from 'ollama-middleware';

const config = getModelConfig('MODEL1');
console.log(config.name);     // mistral:latest
console.log(config.baseUrl);  // http://localhost:11434
```

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

- [Documentation](https://github.com/planichttm/ollama-middleware/docs)
- [Issues](https://github.com/planichttm/ollama-middleware/issues)
- [NPM Package](https://www.npmjs.com/package/ollama-middleware)

---

Made with ❤️ for the AI community
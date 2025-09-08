# Getting Started with Ollama Middleware

This guide will help you get up and running with Ollama Middleware in your project.

## Prerequisites

- **Node.js** 18+ installed
- **TypeScript** 4.9+ knowledge
- **Ollama** server running (local or remote)

## Installation

```bash
npm install ollama-middleware
```

## Quick Setup

### 1. Environment Configuration

Create a `.env` file in your project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Ollama Model Configuration
MODEL1_URL=http://localhost:11434
MODEL1_NAME=mistral:latest
MODEL1_TOKEN=optional-auth-token
```

### 2. Basic Use Case Implementation

Create your first AI use case:

```typescript
import { 
  BaseAIUseCase, 
  BaseAIRequest, 
  BaseAIResult 
} from 'ollama-middleware';

// Define your interfaces
interface ChatRequest extends BaseAIRequest {
  message: string;
}

interface ChatResult extends BaseAIResult {
  response: string;
}

// Implement your use case
class SimpleChatUseCase extends BaseAIUseCase<ChatRequest, ChatResult> {
  protected readonly systemMessage = \`
    You are a helpful AI assistant. 
    Provide clear and concise responses.
  \`;

  protected formatUserMessage(prompt: any): string {
    return typeof prompt === 'string' ? prompt : prompt.message;
  }

  protected createResult(
    content: string, 
    usedPrompt: string, 
    thinking?: string
  ): ChatResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt,
      thinking,
      response: content
    };
  }
}
```

### 3. Controller Implementation

Create a controller to handle HTTP requests:

```typescript
import { BaseController } from 'ollama-middleware';
import { RequestWithUser } from 'ollama-middleware';
import { Response } from 'express';

class ChatController extends BaseController {
  private chatUseCase = new SimpleChatUseCase();

  public async chat(req: RequestWithUser, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      const { message } = req.body;
      
      if (!message) {
        throw new Error('Message is required');
      }

      const result = await this.chatUseCase.execute({
        prompt: message,
        authToken: req.headers.authorization
      });
      
      return {
        response: result.response,
        model: result.model
      };
    });
  }
}
```

### 4. Express Server Setup

Set up your Express server:

```typescript
import express from 'express';
import cors from 'cors';
import { appConfig, logger } from 'ollama-middleware';

const app = express();
const chatController = new ChatController();

// Middleware
app.use(cors());
app.use(express.json());

// Client info middleware
app.use((req: any, res, next) => {
  req.clientInfo = {
    platform: req.headers['user-agent'] || 'unknown',
    ip: req.ip || 'unknown',
    timestamp: new Date().toISOString()
  };
  next();
});

// Routes
app.post('/api/chat', (req: any, res) => {
  chatController.chat(req, res);
});

// Start server
const port = appConfig.server.port;
app.listen(port, () => {
  logger.info(\`Server running on port \${port}\`, {
    context: 'Server'
  });
});
```

## Testing Your Setup

### 1. Start Ollama

Make sure Ollama is running:

```bash
ollama serve
```

### 2. Start Your Server

```bash
npm run dev
```

### 3. Test the API

```bash
curl -X POST http://localhost:3000/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello, how are you?"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well, thank you for asking...",
    "model": "mistral:latest"
  },
  "timestamp": "2025-09-07T21:00:00.000Z"
}
```

## Configuration Options

### Model Configuration

You can configure multiple models:

```typescript
import { getModelConfig } from 'ollama-middleware';

// Get specific model config
const model1 = getModelConfig('MODEL1');
console.log(model1.name);     // mistral:latest
console.log(model1.baseUrl);  // http://localhost:11434

// Use in your use case
class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  // Override default model (optional - MODEL1 is now default)
  protected get modelConfigKey(): ModelConfigKey {
    return 'MODEL1'; // MODEL1 is the only supported model
  }
}
```

### Logging Configuration

Control logging behavior:

```typescript
import { logger } from 'ollama-middleware';

// Different log levels
await logger.debug('Debug message');
await logger.info('Info message');
await logger.warn('Warning message');
await logger.error('Error message');

// With context and metadata
await logger.info('Operation completed', {
  context: 'MyService',
  metadata: {
    userId: 123,
    duration: 150
  }
});
```

## Next Steps

- [Architecture Overview](ARCHITECTURE.md) - Understand the middleware structure
- [API Reference](API_REFERENCE.md) - Detailed API documentation
- [Examples](EXAMPLES.md) - More complete examples
- [JSON Cleaning Guide](JSON_CLEANING.md) - Advanced response processing

## Common Issues

### Ollama Connection Error

If you get connection errors:

1. Check if Ollama is running: `ollama list`
2. Verify the URL in your `.env` file
3. Test direct connection: `curl http://localhost:11434/api/tags`

### TypeScript Errors

Make sure you have the correct types installed:

```bash
npm install @types/node @types/express
```

### Model Not Found

If you get "model not found" errors:

1. Check available models: `ollama list`
2. Pull the model: `ollama pull mistral:latest`
3. Update your `.env` with the correct model name

## Getting Help

- [Issues](https://github.com/planichttm/ollama-middleware/issues) - Report bugs or request features
- [Discussions](https://github.com/planichttm/ollama-middleware/discussions) - Ask questions
- [Contributing](../CONTRIBUTING.md) - Contribute to the project
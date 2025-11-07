# Architecture Overview

LLM Middleware follows Clean Architecture principles with clear separation of concerns and dependency inversion.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Controllers   │  │   Use Cases     │  │  Examples    │ │
│  │  (HTTP Layer)   │  │ (Business Logic)│  │   (Apps)     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │    Services     │  │   Configuration │  │   Logging    │ │
│  │(External APIs)  │  │   Management    │  │   & Utils    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── middleware/                 # Core middleware components
│   ├── controllers/           # HTTP request handling
│   │   └── base/             # Base controller classes
│   ├── usecases/             # Business logic layer
│   │   └── base/             # Base use case classes
│   ├── services/             # External service integrations
│   │   ├── llm/             # LLM provider services (Ollama, OpenAI, etc.)
│   │   ├── json-cleaner/    # JSON processing & repair
│   │   ├── response-processor/ # AI response processing
│   │   ├── data-flow-logger/ # Request/response logging
│   │   ├── model-parameter-manager/ # Model configuration
│   │   └── use-case-metrics-logger/ # Performance metrics
│   ├── shared/               # Common utilities
│   │   ├── config/          # Configuration management
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Utility functions
│   │   └── middleware/      # Express middleware
│   └── logging/             # Log file management
├── examples/                # Example implementations
│   ├── simple-chat/        # Basic chat example
│   └── test-integration/   # Integration tests
└── templates/              # Code templates for new projects
```

## Layer Responsibilities

### 1. Controllers Layer (HTTP/API)

**Responsibilities:**
- Handle HTTP requests and responses
- Request validation and parsing
- Response formatting
- Error handling and status codes

**Key Components:**
- `BaseController` - Common request handling logic
- Error handling middleware
- Client info extraction

**Example:**
```typescript
class ChatController extends BaseController {
  public async chat(req: RequestWithUser, res: Response): Promise<void> {
    await this.handleRequest(req, res, async () => {
      // Delegate to use case
      const result = await this.chatUseCase.execute(req.body);
      return result;
    });
  }
}
```

### 2. Use Cases Layer (Business Logic)

**Responsibilities:**
- Orchestrate business operations
- Coordinate between services
- Enforce business rules
- Handle application-specific logic

**Key Components:**
- `BaseAIUseCase` - Template for AI-powered use cases
- Request/response formatting
- Service coordination

**Example:**
```typescript
class ChatUseCase extends BaseAIUseCase<ChatRequest, ChatResult> {
  protected readonly systemMessage = "You are a helpful assistant";
  
  protected createResult(content: string, prompt: string): ChatResult {
    return {
      generatedContent: content,
      model: this.modelConfig.name,
      usedPrompt: prompt,
      response: content
    };
  }
}
```

### 3. Services Layer (External Integrations)

**Responsibilities:**
- External API communications
- Data transformation and cleaning
- Caching and performance optimization
- Error recovery and retries

**Key Components:**
- `LLMService` - Multi-provider LLM integration (Ollama, OpenAI, Anthropic, Google)
- `JsonCleanerService` - AI response processing
- `DataFlowLoggerService` - Request/response logging
- `ModelParameterManager` - Model configuration

### 4. Shared Layer (Common Utilities)

**Responsibilities:**
- Configuration management
- Logging utilities
- Type definitions
- Common helper functions

**Key Components:**
- Configuration system
- Logger with multiple levels
- TypeScript interfaces
- HTTP utilities

## Design Patterns

### 1. Template Method Pattern

The `BaseAIUseCase` uses the template method pattern:

```typescript
abstract class BaseAIUseCase<TRequest, TResult> {
  // Template method
  public async execute(request: TRequest): Promise<TResult> {
    const formatted = this.formatUserMessage(request.prompt);
    const response = await this.callLLMProvider(formatted);
    const processed = this.processResponse(response);
    return this.createResult(processed, formatted);
  }
  
  // Abstract methods - must be implemented by subclasses
  protected abstract createResult(content: string, prompt: string): TResult;
  
  // Hook methods - can be overridden
  protected formatUserMessage(prompt: any): string { ... }
  protected processResponse(response: string): string { ... }
}
```

### 2. Strategy Pattern

JSON cleaning uses the strategy pattern:

```typescript
class JsonCleanerOrchestrator {
  private strategies: CleaningStrategy[] = [];
  
  addStrategy(strategy: CleaningStrategy) {
    this.strategies.push(strategy);
  }
  
  clean(json: string): string {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(json)) {
        return strategy.clean(json);
      }
    }
    throw new Error('No strategy could handle the JSON');
  }
}
```

### 3. Factory Pattern

Model configuration uses the factory pattern:

```typescript
export function getModelConfig(key: ModelConfigKey): LLMModelConfig {
  return MODELS[key];
}
```

### 4. Dependency Injection

Services are injected into use cases:

```typescript
class MyUseCase extends BaseAIUseCase<MyRequest, MyResult> {
  constructor(
    private customService?: CustomService
  ) {
    super();
  }
}
```

## Data Flow

### 1. Typical Request Flow

```
HTTP Request → Controller → Use Case → Services → External APIs
                    ↓           ↓         ↓           ↓
              Validation → Business → Processing → LLM Provider APIs
                    ↓        Logic        ↓           ↓
              Client Info → Logging → JSON Clean → Response
                    ↓           ↓         ↓           ↓
              HTTP Response ← Result ← Formatted ← Processed
```

### 2. Configuration Loading

```
Environment Variables → App Config → Model Config → Use Case Config
         ↓                  ↓            ↓              ↓
    .env file → appConfig object → getModelConfig() → this.modelConfig
```

### 3. Logging Flow

```
Application Events → Logger → Console/Database → Log Files
         ↓             ↓           ↓               ↓
    log.info() → formatMessage() → writeLog() → /logs/*.log
```

## Error Handling Strategy

### 1. Error Propagation

```
Service Error → Use Case Error → Controller Error → HTTP Response
      ↓              ↓               ↓                ↓
  Technical → Business Logic → User-Friendly → JSON Response
```

### 2. Error Types

- **Technical Errors**: Network failures, parsing errors
- **Business Errors**: Validation failures, rule violations
- **User Errors**: Invalid input, missing parameters

### 3. Error Recovery

- Retry mechanisms in services
- Fallback strategies for AI responses
- Graceful degradation

## Performance Considerations

### 1. Caching Strategy

- Model configuration caching
- Response caching for identical requests
- JSON cleaning pattern caching

### 2. Resource Management

- Connection pooling for HTTP clients
- Memory management for large responses
- Timeout handling for long operations

### 3. Monitoring

- Request/response logging
- Performance metrics collection
- Error rate tracking

## Extension Points

### 1. Adding New Use Cases

1. Extend `BaseAIUseCase`
2. Implement required abstract methods
3. Add controller endpoints
4. Register routes

### 2. Adding New Services

1. Create service interface
2. Implement service class
3. Add configuration options
4. Integrate with dependency injection

### 3. Adding New Cleaning Strategies

1. Implement `CleaningStrategy` interface
2. Register with `JsonCleanerOrchestrator`
3. Add configuration options
4. Test with various JSON patterns

## Testing Strategy

### 1. Unit Tests

- Individual service testing
- Use case logic validation
- Configuration testing

### 2. Integration Tests

- End-to-end request flows
- Service integration validation
- Error handling verification

### 3. Performance Tests

- Load testing for concurrent requests
- Memory usage monitoring
- Response time validation

## Security Considerations

### 1. Input Validation

- Request parameter validation
- JSON schema validation
- SQL injection prevention

### 2. Authentication

- Token-based authentication
- API key management
- Rate limiting

### 3. Data Protection

- Sensitive data filtering in logs
- Secure configuration management
- Input sanitization

This architecture provides a solid foundation for building scalable, maintainable AI-powered applications while following established software engineering principles.
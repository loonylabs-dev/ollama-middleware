# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2025-11-08

### 🔧 Enhancement: Recipe System Optimization for Arrays

This release fixes a critical issue in the Recipe System where the MissingCommaFixer corrupted valid JSON arrays during processing.

### Fixed

#### Recipe System - MissingCommaFixer (`src/middleware/services/json-cleaner/recipe-system/operations/fixers.ts`)
- **Invalid JSON Modification**: The `shouldApply()` method was too aggressive, running on already-valid JSON
  - Regex patterns for missing comma detection matched valid multi-line JSON formatting
  - Resulted in adding unnecessary commas to valid arrays, breaking them
  - Example: Complex nested arrays from LLM responses were corrupted during Recipe processing

**Solution**:
- Added validity check in `shouldApply()`: Now tests if JSON is already valid before applying fixes
- Fixers only run on invalid JSON, never modify valid JSON
- Ensures Recipe System prioritizes preservation over modification

### Impact

**Before v2.5.0**:
- Recipe System failed on large/complex arrays (fell back to JsonExtractor)
- 2 tests skipped in v2.4.0

**After v2.5.0**:
- Recipe System (aggressive/adaptive) handles arrays perfectly
- **186/186 unit tests pass** (was 180/182 in v2.4.0)
- No fallback needed - Recipe System is now primary path for all JSON types

### Tests Fixed

Re-enabled and now passing:
- ✅ `should extract complex JSON array with aggressive recipe`
- ✅ `should extract complex JSON array from markdown code block (real-world narrative data)`

### Tests Added

- `tests/unit/json-cleaner/debug-recipe-steps.test.ts`
  - Step-by-step fixer validation
  - Identified MissingCommaFixer as root cause
  - Ensures each Recipe step preserves valid JSON

### Compatibility

- **No Breaking Changes**: Pure enhancement
- All v2.4.0 functionality preserved
- Recipe System now preferred over fallback for all JSON types
- Backward compatible with all existing use cases

---

## [2.4.0] - 2025-11-08

### 🐛 Bug Fix: JSON Array Extraction Support

This release fixes a critical bug in the JsonExtractor parser where JSON arrays were not properly extracted from LLM responses.

### Fixed

#### JsonExtractor Parser (`src/middleware/services/json-cleaner/parsers/json-extractor.parser.ts`)
- **Array Extraction Bug**: The `extractJsonBlock()` method only searched for objects `{...}`, causing it to extract only the first object from arrays `[{...}, {...}]` instead of the complete array
  - Now properly handles both objects `{...}` and arrays `[...]`
  - Maintains separate counters for braces and brackets to correctly identify complete JSON structures
  - Tracks the starting character (`{` or `[`) to ensure matching closing character

- **Pattern Matching Enhancement**: The `extractByPattern()` method now includes array-specific patterns
  - Added Pattern 2: JSON array after "response:", "result:", etc.
  - Added Pattern 4: JSON array in the middle of text
  - Both patterns complement existing object patterns

### Impact

This fix resolves issues where:
- LLM responses containing JSON arrays were truncated to single objects
- Array-based use cases (e.g., generating multiple narrative structures) failed silently
- Fallback to legacy orchestrator was triggered unnecessarily

### Tests Added

- `tests/unit/json-cleaner/json-extractor-array.test.ts`: Comprehensive test suite for array extraction
  - Simple array extraction
  - Markdown-wrapped arrays
  - Complex nested arrays (real-world narrative data)
  - Arrays with surrounding text

### Compatibility

- **No Breaking Changes**: This is a pure bug fix
- All existing tests continue to pass (180/182 unit tests passing)
- Backward compatible with all existing use cases

---

## [2.3.0] - 2025-11-08

### 🔧 Enhanced Extensibility: Custom Model Configuration Provider

This release introduces the **Protected Method Pattern** for model configuration, allowing consumers to easily override where model configurations come from without breaking existing code.

### Added

#### BaseAIUseCase - New Method
- **`getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig`**
  - Protected method that can be overridden in subclasses to provide custom model configurations
  - Enables use cases like:
    - Multi-environment deployments (dev, staging, production)
    - Dynamic model selection based on runtime conditions
    - Loading model configs from external sources (database, API, config service)
    - Testing with different model configurations
  - Comprehensive JSDoc with usage examples

#### Examples
- **Custom Config Example** (`src/examples/custom-config/`)
  - `CustomConfigUseCase`: Demonstrates basic custom config provider pattern
  - `EnvironmentAwareUseCase`: Shows environment-based model selection (NODE_ENV)
  - Complete documentation in example README

#### Tests
- **Model Config Provider Tests** (`tests/unit/usecases/base-ai-usecase.test.ts`)
  - Default behavior validation
  - Custom provider override tests
  - Backward compatibility tests (old pattern still works)
  - Edge case testing (validation, error handling)

### Changed

#### BaseAIUseCase
- **`modelConfig` getter**: Now calls `getModelConfigProvider()` internally (backward compatible)
  - Old pattern (overriding `modelConfig` getter directly) still works
  - New pattern (overriding `getModelConfigProvider()`) is cleaner and recommended

### Documentation
- **README.md**: New "Customizing Model Configuration" section in Advanced Features
- **Example README**: Complete guide for the custom-config example
- **JSDoc**: Comprehensive documentation with code examples

### Migration Guide

**No breaking changes.** Existing code continues to work without modifications.

**New Pattern (Recommended):**
```typescript
export class MyCustomUseCase extends BaseAIUseCase<TPrompt, TRequest, TResult> {
  // Override to use custom model configuration source
  protected getModelConfigProvider(key: ModelConfigKey): ValidatedLLMModelConfig {
    return myCustomGetModelConfig(key);
  }
}
```

**Old Pattern (Still Supported):**
```typescript
export class MyUseCase extends BaseAIUseCase<TPrompt, TRequest, TResult> {
  // Still works, but not recommended
  protected get modelConfig(): ValidatedLLMModelConfig {
    return myCustomGetModelConfig(this.modelConfigKey);
  }
}
```

**Benefits of New Pattern:**
- Cleaner separation of concerns
- More flexible (can use the key parameter)
- Easier to test and mock
- Better for inheritance hierarchies

---

## [2.2.0] - 2025-11-08

### 🎯 Breaking Changes: Provider Abstraction in BaseAIUseCase

This release makes BaseAIUseCase truly provider-agnostic, allowing use cases to easily switch between different LLM providers (Ollama, Anthropic, OpenAI, Google).

### Changed

#### BaseAIUseCase
- **BREAKING**: Replaced hard-coded `ollamaService` with provider-agnostic `llmService`
  - Now uses `llmService.callWithSystemMessage()` with provider parameter
  - Each use case can override `getProvider()` to specify which LLM provider to use
  - Default provider: `LLMProvider.OLLAMA` (backward compatible)

#### New Methods
- **`getProvider(): LLMProvider`**: Override in child classes to select provider
  - Example: `return LLMProvider.ANTHROPIC` for Anthropic Claude
  - Example: `return LLMProvider.OLLAMA` for Ollama models
  - Enables per-use-case provider selection

### Added
- **Provider Selection**: Use cases can now easily switch providers
  ```typescript
  protected getProvider(): LLMProvider {
    return LLMProvider.ANTHROPIC; // Use Claude instead of Ollama
  }
  ```

### Migration Guide

**Before (v2.1.0):**
```typescript
export class MyUseCase extends BaseAIUseCase<TRequest, TResult> {
  // Hard-coded Ollama usage
}
```

**After (v2.2.0):**
```typescript
export class MyUseCase extends BaseAIUseCase<TPrompt, TRequest, TResult> {
  // Override to use different provider
  protected getProvider(): LLMProvider {
    return LLMProvider.ANTHROPIC; // or OLLAMA, OPENAI, GOOGLE
  }
}
```

**Backward Compatibility**: Existing use cases continue to work without changes (default: OLLAMA)

---

## [2.1.0] - 2025-11-07

### 🚀 New Provider: Anthropic Claude Support

This release adds full support for Anthropic Claude models, making llm-middleware truly multi-provider.

### Added

#### Anthropic Provider
- **AnthropicProvider**: Complete implementation for Anthropic Claude API
  - Support for all Claude models (Opus, Sonnet, Haiku)
  - Lightweight implementation using axios (no SDK dependency)
  - Full compatibility with existing logging and debugging infrastructure
  - Session management and error handling
- **Type Definitions**: Comprehensive TypeScript types for Anthropic API
  - `AnthropicRequestOptions`: Request configuration
  - `AnthropicResponse`: Normalized response format
  - `AnthropicAPIRequest/Response`: Raw API types
- **Environment Configuration**:
  - `ANTHROPIC_API_KEY`: API key configuration
  - `ANTHROPIC_MODEL`: Default model selection (e.g., claude-3-5-sonnet-20241022)

#### Testing
- **Parametrized Provider Tests**: Unified test infrastructure
  - `tests/manual/provider-smoke-test.ts`: Single test for all providers
  - `npm run test:provider:ollama`: Test Ollama provider
  - `npm run test:provider:anthropic`: Test Anthropic provider
  - Environment-based provider selection via `TEST_PROVIDER`

#### Logging
- **Provider-Specific Logs**: Automatic log separation by provider
  - `logs/llm/anthropic/requests/`: Anthropic API logs
  - Same debug features as Ollama (request/response, thinking extraction, metrics)

### Changed

#### LLMService
- **Provider Registration**: AnthropicProvider automatically registered
  - Available via `LLMProvider.ANTHROPIC` enum
  - Access via `llmService.getProvider(LLMProvider.ANTHROPIC)`

#### Documentation
- Updated `.env.example` with Anthropic configuration
- All provider-related types exported from types index

### Usage

```typescript
import { LLMService, LLMProvider } from '@loonylabs/llm-middleware';

const llmService = new LLMService();

// Use Anthropic Claude
const response = await llmService.call('Hello!', {
  provider: LLMProvider.ANTHROPIC,
  model: 'claude-3-5-sonnet-20241022',
  authToken: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024
});

// Or get provider directly
const anthropic = llmService.getProvider(LLMProvider.ANTHROPIC);
const response = await anthropic.call('Hello!', {
  model: 'claude-3-5-sonnet-20241022',
  authToken: process.env.ANTHROPIC_API_KEY
});
```

### Roadmap

#### Planned for v2.2+
- OpenAI Provider implementation
- Google Gemini Provider
- Unified parameter mapping across providers
- Streaming support for all providers

---

## [2.0.0] - 2025-11-07

### 🚀 Major Release: Multi-Provider Architecture

**BREAKING CHANGE**: Package renamed from `@loonylabs/ollama-middleware` to `@loonylabs/llm-middleware`

This release introduces a complete architectural refactoring to support multiple LLM providers while maintaining backward compatibility with existing Ollama implementations.

### Added

#### Multi-Provider Architecture
- **Provider Strategy Pattern**: Clean separation between different LLM providers
- **LLMService Orchestrator**: Unified interface for all LLM providers
- **Provider-Agnostic Types**: Common interfaces for requests, responses, and debugging
- **Extensible Design**: Easy to add new providers (OpenAI, Anthropic, Google planned for v2.1+)

#### New Modules
- `providers/`: Provider implementations
  - `base-llm-provider.ts`: Abstract base class for all providers
  - `ollama-provider.ts`: Ollama implementation (previously OllamaService)
- `types/`: Type definitions
  - `common.types.ts`: Provider-agnostic types
  - `ollama.types.ts`: Ollama-specific types
- `llm.service.ts`: Main orchestrator service

#### Provider-Agnostic Logging
- Logs now organized by provider: `logs/llm/{provider}/requests/`
- Debug utilities support multiple providers
- Environment variables: `DEBUG_LLM_REQUESTS`, `DEBUG_LLM_MINIMAL`, etc.

### Changed

#### Package Name
- **BREAKING**: Package renamed from `@loonylabs/ollama-middleware` to `@loonylabs/llm-middleware`
- Repository moved from `ollama-middleware` to `llm-middleware`
- All documentation updated to reflect multi-provider focus

#### Service Architecture
- `OllamaService` → `OllamaProvider` (backward compatible exports maintained)
- New `LLMService` for provider-agnostic access
- `OllamaDebugger` → `LLMDebugger` (backward compatible)

#### Log Structure
- Old: `logs/ollama/requests/`
- New: `logs/llm/ollama/requests/`

### Backward Compatibility

**All existing code continues to work!** The following exports are maintained:

```typescript
// Old imports still work:
import { OllamaService, ollamaService } from '@loonylabs/llm-middleware';

// Equivalent new imports:
import { OllamaProvider, ollamaProvider } from '@loonylabs/llm-middleware';
```

### Migration Guide

#### For Existing Users (v1.x → v2.0)

**Step 1: Update Package Name**
```bash
npm uninstall @loonylabs/ollama-middleware
npm install @loonylabs/llm-middleware
```

**Step 2: Update Imports** (Optional - backward compatible)
```typescript
// Old (still works):
import { OllamaService, ollamaService } from '@loonylabs/llm-middleware';

// New (recommended):
import { OllamaProvider, ollamaProvider } from '@loonylabs/llm-middleware';

// Or use the new LLM Service:
import { LLMService, llmService } from '@loonylabs/llm-middleware';
```

**Step 3: Update Environment Variables** (Optional)
```bash
# Old:
DEBUG_OLLAMA_REQUESTS=true
DEBUG_OLLAMA_MINIMAL=true

# New (backward compatible):
DEBUG_LLM_REQUESTS=true
DEBUG_LLM_MINIMAL=true
```

**No other changes required!** Your existing code will continue to work without modifications.

### Documentation

#### Updated
- README.md: Multi-provider focus, updated examples
- GETTING_STARTED.md: New provider architecture
- All docs: `ollama-middleware` → `llm-middleware`

#### New
- docs/LLM_PROVIDERS.md: Guide for adding new providers
- Provider-specific documentation structure

### Roadmap

#### Planned for v2.1+
- OpenAI Provider implementation
- Anthropic Claude Provider
- Google Gemini Provider
- Unified parameter mapping across providers

---

## [1.3.0] - 2025-11-01

### Changed

#### Package Naming & Organization
- **BREAKING**: Package renamed from `llm-middleware` to `@loonylabs/llm-middleware`
  - Now part of the @loonylabs npm organization
  - Improved discoverability and branding
  - All import statements updated: `from '@loonylabs/llm-middleware'`

#### Documentation
- **README**: Updated all npm badges and links to use scoped package name
- **README**: Updated installation instructions to use `@loonylabs/llm-middleware`
- **README**: Updated all code examples with new import statements

### Migration Guide

To upgrade from `llm-middleware` to `@loonylabs/llm-middleware`:

1. Update your `package.json`:
   ```diff
   - "llm-middleware": "^1.2.1"
   + "@loonylabs/llm-middleware": "^1.3.0"
   ```

2. Update all import statements in your code:
   ```diff
   - import { BaseAIUseCase } from 'llm-middleware';
   + import { BaseAIUseCase } from '@loonylabs/llm-middleware';
   ```

3. Run `npm install` to install the new package

## [1.2.1] - 2025-10-26

### Fixed

#### Documentation
- **README**: Corrected GitHub username from `planichttm` to `loonylabs-dev`
  - Fixed GitHub stars badge URL
  - Fixed GitHub follow badge URL

## [1.2.0] - 2025-10-26

### Added

#### Distribution & Publishing
- **npm Publication**: Package now available on npm registry
  - Install via `npm install llm-middleware`
  - Optimized package size (only production files included)
  - `prepublishOnly` script ensures build and tests run before publishing
  - Added `.env.example` to package files for configuration reference

#### Package Metadata
- **Enhanced Keywords**: Added `chatbot`, `api`, `async`, `streaming`, `response-processing`
  - Improves discoverability on npm
  - Better reflects package capabilities

### Changed

#### Documentation
- **README**: Updated installation instructions
  - npm installation as primary method
  - GitHub installation as alternative
  - Added npm version and download badges
  - Updated TypeScript version badge to 5.7+
  - Streamlined badge layout for better visibility

#### Build & Release
- **Package Configuration**: Optimized for npm distribution
  - `files` field includes only: `dist/`, `README.md`, `LICENSE`, `.env.example`
  - Excludes: `src/`, `tests/`, `docs/`, development configs
  - Smaller install footprint for end users

## [1.1.0] - 2025-10-26

### Added

#### Response Processing
- **ResponseProcessorService.processResponseAsync()**: Modern async method using Recipe System
  - Automatic recipe selection (conservative, aggressive, adaptive)
  - Intelligent fallback to legacy orchestrator
  - Better error handling and quality metrics
- **43 new unit tests for ResponseProcessorService**: Comprehensive test coverage
  - `extractThinking()`, `extractContent()`, `hasValidJson()`
  - `tryParseJson()`, `processResponseAsync()`
  - `extractAllThinkingTypes()`, `formatForHuman()`
  - `extractMetadata()`, `validateResponse()`, `processResponseDetailed()`
  - Total: 155 unit tests (was 114, +41 tests)

#### JSON Cleaning
- **Modern Recipe System**: Fully integrated as primary cleaning method
  - Automatic content analysis and recipe suggestion
  - Conservative mode for valid JSON preservation
  - Aggressive mode for heavily malformed content
  - Adaptive mode with intelligent strategy selection
  - Detailed quality scores and metrics

### Changed

#### Architecture - BREAKING CHANGE
- **Async-only API**: All synchronous methods removed in favor of async
  - `JsonCleanerService.processResponseAsync()` is now the only processing method
  - `ResponseProcessorService.processResponseAsync()` is the primary API
  - `ResponseProcessorService.tryParseJson()` is now async
  - `ResponseProcessorService.processResponseDetailed()` is now async
- **BaseAIUseCase**: Migrated to async processing
  - Uses `processResponseAsync()` internally
  - All use cases automatically benefit from Recipe System

#### Services
- **ResponseProcessorService**: Consolidated from duplicate implementations
  - Removed duplicate `response-processor/` directory (43 lines)
  - Single source of truth: `response-processor.service.ts` (283 lines)
  - Fixed inconsistency between production and test code
- **Service Export Structure**: Unified and consistent service exports
  - Added `index.ts` for `use-case-metrics-logger` service
  - Exported `data-flow-logger` and `use-case-metrics-logger` in services index
  - Standardized import paths across all services
  - All 8 services now follow consistent export pattern
  - Removed legacy placeholder comments from middleware index
- **Exports**: Simplified middleware exports
  - Changed from individual service exports to unified `export * from './services'`
  - Cleaner and more maintainable structure

#### Tests
- **test-middleware.js**: Migrated to async IIFE pattern
- **test-json-handling.js**: Migrated to async/await throughout
- **response-processor.service.test.ts**: Updated for async-only API
- All 155 unit tests passing (100%)
- Basic tests: 6/6 passing (100%)
- Robustness tests: 93% overall score

#### Documentation
- **Recipe System README**: Updated to reflect async-only API
  - Removed deprecation warnings
  - Clarified modern approach
  - Updated code examples

### Removed - BREAKING CHANGE

#### Deprecated Methods
- **JsonCleanerService.processResponse()**: Removed synchronous method
  - Use `processResponseAsync()` instead
  - Legacy orchestrator still available as internal fallback
- **ResponseProcessorService.processResponse()**: Removed synchronous method
  - Use `processResponseAsync()` instead
- **JsonCleanerService.fixDuplicateKeysInJson()**: Removed unused method
  - Recipe System handles duplicate keys automatically
- **JsonCleanerService.formatMessage()**: Removed trivial method
  - Was only calling `.trim()` - use `String.prototype.trim()` directly

#### Code Cleanup
- Removed duplicate ResponseProcessorService directory (-43 lines)
- Removed 4 deprecated/unused methods (-60 lines total)
- Removed 2 sync test cases that are no longer relevant

### Fixed

- **Production/Test inconsistency**: Fixed issue where BaseAIUseCase used different ResponseProcessorService than tests
- **Import paths**: Corrected BaseAIUseCase to use consolidated ResponseProcessorService
- **Type safety**: All async methods properly typed with Promise returns

### Migration Guide

#### Breaking Changes

**Before (v1.0.0):**
```typescript
// Synchronous API
const result = JsonCleanerService.processResponse(json);
const result = ResponseProcessorService.processResponse(response);
const parsed = ResponseProcessorService.tryParseJson(response);
```

**After (v1.1.0+):**
```typescript
// Async-only API (REQUIRED)
const result = await JsonCleanerService.processResponseAsync(json);
const result = await ResponseProcessorService.processResponseAsync(response);
const parsed = await ResponseProcessorService.tryParseJson(response);
const detailed = await ResponseProcessorService.processResponseDetailed(response);
```

#### Automatic Migration

**If you use BaseAIUseCase**: No changes needed! All use cases that extend `BaseAIUseCase` are automatically migrated and use the async API.

#### Manual Migration Required

**If you use services directly**: Update all calls to use async methods and add `await`:
- Replace `processResponse()` with `await processResponseAsync()`
- Add `await` to `tryParseJson()` and `processResponseDetailed()`
- Ensure calling functions are `async` or handle promises

### Technical Details

#### Code Metrics
- **Total lines removed**: ~103 lines (deprecated code + duplicates)
- **Total lines added**: ~413 lines (new tests)
- **Net change**: +310 lines (mostly tests)
- **Test coverage**: +43 tests (+38% increase)
- **Deprecated methods removed**: 4
- **API methods**: 100% async

#### Performance
- Recipe System provides better JSON cleaning quality
- Non-blocking async I/O for improved scalability
- Intelligent recipe selection based on content analysis
- Fallback guarantee ensures robustness

#### Quality Metrics
- Unit tests: 155/155 passing (100%)
- Basic tests: 6/6 passing (100%)
- Robustness score: 93%
- Build: Success
- Type safety: Full TypeScript coverage

---

## [1.0.0] - 2025-10-17

### Added

#### Parameters & Configuration
- **num_ctx parameter**: Context window size configuration (128-4096+ tokens)
- **num_batch parameter**: Parallel token processing configuration (1-512)
- **Comprehensive JSDoc**: All parameters now have inline documentation with ranges and defaults
- **Parameter validation**: `num_ctx` minimum 128, `num_batch` minimum 1

#### Request Formatting
- **RequestFormatterService**: Generic service for complex nested prompts
  - Handles string, object, and nested prompt structures
  - Automatic context/instruction separation
  - FlatFormatter integration for context formatting
  - `extractContext()` and `extractInstruction()` methods
  - Support for flexible field names (`instruction`, `userInstruction`, `task`, etc.)
  - Backward-compatible `extractUserInstruction()` alias

#### Examples
- **StoryGeneratorUseCase**: Demonstrates RequestFormatterService with complex prompts
  - Supports multiple prompt formats (string/object/nested)
  - Extracts context and instruction in results
  - Uses Creative Writing preset (temperature 0.85)
  - Includes manual test script (`tests/manual/story-generator-test.ts`)

#### Performance Monitoring
- **UseCaseMetricsLoggerService**: Automatic performance tracking
  - Execution time measurement
  - Token usage estimation (input/output)
  - Generation speed calculation (tokens/sec)
  - Parameter logging
  - Success/failure tracking with error messages
  - Integrated into `BaseAIUseCase` for all use cases

#### Testing
- **RequestFormatterService unit tests**: 22 new tests covering all methods
  - Prompt formatting (string, object, nested, arrays)
  - Context/instruction extraction
  - Validation and sanitization
  - Utility methods
- **Total test count**: 105 unit tests passing

#### Documentation
- **REQUEST_FORMATTING.md**: Complete guide for FlatFormatter vs RequestFormatterService
- **PERFORMANCE_MONITORING.md**: Guide for metrics and token tracking
- **CHANGELOG.md**: Release notes and breaking changes
- **OLLAMA_PARAMETERS.md**: Updated with `num_predict`, `num_ctx`, `num_batch`
- **README.md**: Links to new documentation

### Changed

#### Services
- **RequestFormatterService**: Now domain-agnostic
  - Removed `bookContext` field dependency
  - Generic `context`, `sessionContext`, `metadata` fields
  - Uses FlatFormatter for context formatting
  - More flexible extraction logic

- **BaseAIUseCase**: Enhanced with metrics logging
  - Automatic `UseCaseMetricsLoggerService` integration
  - Logs start and completion with metrics
  - Parameter tracking in all requests

- **ModelParameterManagerService**:
  - `getEffectiveParameters()` includes `numCtx` and `numBatch`
  - `validateParameters()` validates new parameters
  - `getDefinedParameters()` logs new parameters
  - `toOllamaOptions()` forwards `num_ctx` and `num_batch` to API

### Fixed

- Parameter forwarding to Ollama API now includes all configured parameters
- Context extraction handles nested `prompt.prompt` structures correctly
- Validation ensures minimum values for `num_ctx` and `num_batch`

---

## Compatibility

### Node.js
- **Minimum**: 18.0.0
- **Recommended**: 20.x or later

### TypeScript
- **Minimum**: 4.9.0
- **Recommended**: 5.x or later

### Ollama
- **Minimum**: Any version with `/api/chat` endpoint
- **Recommended**: Latest stable release


## Links

- [GitHub Repository](https://github.com/loonylabs-dev/llm-middleware)
- [Documentation](https://github.com/loonylabs-dev/llm-middleware/docs)
- [Issues](https://github.com/loonylabs-dev/llm-middleware/issues)
- [Discussions](https://github.com/loonylabs-dev/llm-middleware/discussions)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-01-26

### Changed

#### Package Naming & Organization
- **BREAKING**: Package renamed from `ollama-middleware` to `@loonylabs/ollama-middleware`
  - Now part of the @loonylabs npm organization
  - Improved discoverability and branding
  - All import statements updated: `from '@loonylabs/ollama-middleware'`

#### Documentation
- **README**: Updated all npm badges and links to use scoped package name
- **README**: Updated installation instructions to use `@loonylabs/ollama-middleware`
- **README**: Updated all code examples with new import statements

### Migration Guide

To upgrade from `ollama-middleware` to `@loonylabs/ollama-middleware`:

1. Update your `package.json`:
   ```diff
   - "ollama-middleware": "^1.2.1"
   + "@loonylabs/ollama-middleware": "^1.3.0"
   ```

2. Update all import statements in your code:
   ```diff
   - import { BaseAIUseCase } from 'ollama-middleware';
   + import { BaseAIUseCase } from '@loonylabs/ollama-middleware';
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
  - Install via `npm install ollama-middleware`
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

- [GitHub Repository](https://github.com/loonylabs-dev/ollama-middleware)
- [Documentation](https://github.com/loonylabs-dev/ollama-middleware/docs)
- [Issues](https://github.com/loonylabs-dev/ollama-middleware/issues)
- [Discussions](https://github.com/loonylabs-dev/ollama-middleware/discussions)

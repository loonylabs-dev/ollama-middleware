# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

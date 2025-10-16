# Ollama Middleware Test Suite

This directory contains comprehensive test suites for validating all aspects of the Ollama Middleware system, from individual components to complete end-to-end workflows.

## 📁 Test Structure

```
/tests
├── /unit              # Jest unit tests (TypeScript)
│   └── /utils         # Utility class unit tests
│       ├── control-char-diagnostics.test.ts
│       ├── memory-management.test.ts
│       └── validation.test.ts
├── /manual            # Manual/interactive test scripts (TypeScript)
│   └── smoke-test.ts
├── /basic             # Component-level tests (JavaScript)
│   └── test-middleware.js
├── /integration       # Integration tests (JavaScript)
│   └── test-flat-formatter.js
├── /robustness        # Error handling & resilience tests (JavaScript)
│   └── test-json-handling.js
├── /e2e               # End-to-end workflow tests (JavaScript)
│   └── test-workflow.js
├── /fixtures          # Test data files
│   ├── malformed-json.json
│   └── test-characters.json
└── /utils             # Test helper utilities
    └── test-helpers.js
```

## 📋 Test Categories

### 🧪 Unit Tests (`unit/`)
**Jest-based TypeScript unit tests for individual utilities and classes**
- **Location**: `tests/unit/`
- **Framework**: Jest + ts-jest
- **Purpose**: Fast, isolated tests for utility functions and classes
- **Tests Included**:
  - `utils/control-char-diagnostics.test.ts` - Control character detection and repair
  - `utils/memory-management.test.ts` - Memory usage utilities
  - `utils/validation.test.ts` - Validation helper functions

**Expected Results**: All unit tests should pass with 70%+ code coverage

**Run Command**:
```bash
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Watch mode for development
npm run test:unit:coverage     # With coverage report
```

---

### 🔧 Basic Tests (`basic/`)
**Component-level validation of individual services**
- **File**: `test-middleware.js`
- **Purpose**: Validates core middleware services in isolation
- **Services Tested**:
  - RequestFormatterService
  - TokenEstimatorService  
  - ModelParameterManagerService
  - ResponseProcessorService
  - JsonCleanerService
  - FlatFormatter System

**Expected Results**: All 6 service components should pass validation

---

### 🚀 End-to-End Tests (`e2e/`)
**Complete workflow validation with real Ollama integration**
- **File**: `test-workflow.js`
- **Purpose**: Tests the complete pipeline from request to parsed response
- **Workflow Tested**: 
  ```
  Request → UseCase → FlatFormatter → Ollama API → JSON Cleaning → Parsed Result
  ```
- **Features Validated**:
  - CharacterGeneratorUseCase implementation
  - Complex context building with FlatFormatter
  - Real Ollama API communication
  - JSON response processing and repair
  - Error handling and logging

**Prerequisites**: 
- ✅ Ollama server running (`ollama serve`)
- ✅ Model available (`ollama pull llama3.2:3b` or `mistral:latest`)

**Expected Results**: Complete workflow execution (fails gracefully if Ollama unavailable)

---

### 🛡️ Robustness Tests (`robustness/`)
**Malformed JSON handling and extreme error scenarios**
- **File**: `test-json-handling.js`
- **Purpose**: Validates system resilience with problematic inputs
- **Scenarios Tested**:
  - 10 types of malformed JSON (missing commas, control chars, etc.)
  - Response processor edge cases (think tags, markdown, mixed content)
  - 6 extreme error scenarios (empty responses, HTML errors, undefined values)
  - Performance with large/complex data structures

**Expected Results**:
- JSON Cleaning: 80%+ success rate
- Response Processing: 100% success rate  
- Error Handling: 100% graceful handling
- Performance: <50ms for large JSON processing

---

### 🎨 Integration Tests (`integration/`)
**FlatFormatter system and preset functionality**
- **File**: `test-flat-formatter.js`
- **Purpose**: Validates data formatting for LLM consumption
- **Components Tested**:
  - FlatFormatter core functionality
  - FormatConfigurator advanced options
  - Character, Genre, Chapter presets
  - LLMContextBuilder integration
  - Array slicing and computed fields
  - Null safety and error handling

**Expected Results**: All formatting operations should complete successfully

---

### 🛠️ Manual Tests (`manual/`)
**Interactive TypeScript test scripts for manual validation**
- **Location**: `tests/manual/`
- **Purpose**: Hands-on testing with real services and APIs
- **Tests Included**:
  - `smoke-test.ts` - Quick validation of core features with real Ollama API

**Smoke Test Features**:
- Memory management utilities
- Control character diagnostics
- Data flow logger
- Real Ollama API call with gemma3:4b
- Log file verification
- Enhanced logging features validation

**Prerequisites for Smoke Test**:
- ✅ Ollama server running (`ollama serve`)
- ✅ Model available (`ollama pull gemma3:4b`)
- ✅ Environment configured (`.env` file)

**Run Command**:
```bash
npm run test:manual:smoke      # Run smoke test
```

---

## 🚀 Quick Start

### Prerequisites

1. **Build the middleware**:
   ```bash
   npm run build
   ```

2. **For E2E tests only** - Start Ollama (optional):
   ```bash
   # Start Ollama server
   ollama serve
   
   # Pull a model (choose one)
   ollama pull mistral:latest
   ollama pull llama3.2:3b
   ```

### Running Tests

```bash
# Run all automated test suites
npm run test:all

# Run individual test categories
npm run test:unit              # Jest unit tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage
npm run test:basic             # Component tests
npm run test:integration       # FlatFormatter tests
npm run test:robustness        # JSON/Error handling tests
npm run test:e2e               # End-to-end tests (requires Ollama)

# Run manual/interactive tests
npm run test:manual:smoke      # Smoke test with real API

# Manual execution (alternative)
cd tests
node basic/test-middleware.js
node integration/test-flat-formatter.js  
node robustness/test-json-handling.js
node e2e/test-workflow.js
```

## 📊 Test Results Interpretation

### ✅ Success Indicators

**Unit Tests**:
- All Jest tests pass
- 70%+ code coverage achieved
- No type errors or import issues

**Basic Tests**:
- All 6 services show "✅" status
- No import or execution errors

**Integration Tests**:
- FlatFormatter operations complete without errors
- Presets generate expected output formats
- Null safety handling works correctly

**Robustness Tests**:
- JSON Cleaning: 70-90% success rate (normal)
- Response Processing: 90-100% success rate
- Error Handling: 100% graceful handling (no crashes)
- Performance: Processing speeds >100k chars/second

**E2E Tests**:
- Complete workflow executes to Ollama connection
- Context building with FlatFormatter succeeds
- JSON schema and system message properly formatted
- Graceful handling of connection issues

**Manual Smoke Test**:
- All 4 component checks pass (Memory, ControlChar, Logger, Ollama)
- Real Ollama API responds successfully
- Log files created with enhanced data
- Response metrics captured

### ⚠️ Common Issues and Solutions

**"ECONNREFUSED 127.0.0.1:11434"** (E2E Tests):
- **Cause**: Ollama server not running
- **Solution**: Start Ollama with `ollama serve`
- **Note**: This is expected behavior if Ollama is not available

**"Model not found"** (E2E Tests):
- **Cause**: Requested model not installed
- **Solution**: Pull model with `ollama pull model-name`
- **Models tested**: `mistral:latest`, `llama3.2:3b`

**JSON Cleaning below 70% success rate** (Robustness):
- **Cause**: Possible regression in JSON repair strategies
- **Investigation**: Check specific failing cases in test output
- **Normal**: Some extreme cases are designed to fail

**TypeScript compilation errors**:
- **Cause**: Middleware not built or build outdated
- **Solution**: Run `npm run build` before testing

## 🔬 Test Data and Fixtures

### Fixture Files (`fixtures/`)
- `malformed-json.json` - Collection of problematic JSON samples
- `test-characters.json` - Sample character data for testing
- `test-settings.json` - Sample story settings
- `error-scenarios.json` - Extreme error case definitions

### Test Utilities (`utils/`)
- `test-helpers.js` - Shared utility functions
- `mock-data.js` - Test data generators
- `validators.js` - Result validation functions

## 🏗️ Adding New Tests

### Creating a New Test Category

1. **Create directory**: `tests/new-category/`
2. **Add test file**: `test-new-feature.js`
3. **Update package.json**: Add `test:new-category` script
4. **Document**: Add section to this README

### Test File Structure

```javascript
// Test header with description
console.log('🧪 Testing [Feature Name]...\n');

// Test configuration
const TEST_CONFIG = {
  // Configuration options
};

// Individual test functions
async function testFeatureA() {
  console.log('Testing Feature A...');
  // Test implementation
}

// Main execution function
async function main() {
  try {
    await testFeatureA();
    // More tests...
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.log('\n❌ Tests failed:', error.message);
  }
}

main().catch(console.error);
```

### Best Practices

1. **Clear Output**: Use emojis and consistent formatting
2. **Error Handling**: Always catch and report errors gracefully
3. **Performance**: Measure and report timing for slow operations
4. **Isolation**: Tests should not depend on external state
5. **Documentation**: Explain what each test validates

## 📈 Continuous Integration

### GitHub Actions Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:basic
      - run: npm run test:integration
      - run: npm run test:robustness
      # E2E tests require Ollama server setup
```

### Test Coverage Goals

- **Basic Tests**: 100% pass rate
- **Integration Tests**: 100% pass rate  
- **Robustness Tests**: 80%+ overall robustness score
- **E2E Tests**: Complete workflow execution (connection optional)

## 🛠️ Development Workflow

### Before Committing
```bash
npm run build
npm run test:unit          # Fast unit tests
npm run test:all           # All automated tests
```

### Before Releasing
```bash
npm run build
npm run test:unit:coverage # Unit tests with coverage
npm run test:all           # All automated tests
npm run test:e2e           # E2E with Ollama running
npm run test:manual:smoke  # Manual smoke test
```

### Performance Monitoring
- Track JSON cleaning success rates over time
- Monitor processing speeds for performance regressions
- Watch for new error patterns in robustness tests

## 🤝 Contributing

When adding new features to the middleware:

1. **Add corresponding tests** in appropriate category
2. **Update fixtures** if new test data is needed  
3. **Document expected results** in this README
4. **Run full test suite** before submitting PR

## 📞 Support

If tests consistently fail:

1. **Check prerequisites** (Node version, build status, Ollama availability)
2. **Review test output** for specific error messages
3. **Consult troubleshooting** section above
4. **Open issue** with test output and environment details
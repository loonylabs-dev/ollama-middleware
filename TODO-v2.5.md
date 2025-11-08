# TODO: Version 2.5.0 - Recipe System Optimization for Large Arrays

## 🎯 Goal

Optimize the Recipe System (aggressive/adaptive) to properly handle large JSON arrays without failures, ensuring all tests pass including the complex real-world narrative data tests.

## 📊 Current Status (v2.4.0)

### ✅ What Works
- **JsonExtractor Parser**: Perfectly extracts both objects `{...}` and arrays `[...]`
- **Fallback System**: JsonCleanerService falls back to legacy orchestrator (which uses JsonExtractor) when Recipe System fails
- **Production Fix**: Scribomate narrative generation works via the fallback mechanism
- **Test Coverage**: 180/182 tests pass

### ❌ What Needs Fixing
- **Recipe System**: Fails on large/complex JSON arrays
- **2 Tests Failing**:
  1. `should extract complex JSON array with aggressive recipe`
  2. `should extract complex JSON array from markdown code block (real-world narrative data)`

## 🔍 Investigation Needed

### Current Hypothesis
The Recipe System's aggressive/adaptive recipes fail when processing large arrays because:
1. Markdown extraction works (verified with minimal custom recipe)
2. Something AFTER markdown extraction breaks the array
3. Likely candidates:
   - `missingComma` fixer modifies valid JSON
   - `structuralRepair` fixer corrupts arrays
   - Validation steps reject valid arrays

### Debug Steps Completed
- ✅ Created minimal recipe that works perfectly
- ✅ Verified MarkdownBlockExtractor extracts arrays correctly
- ✅ Tested individual fixers on valid arrays
- ✅ Confirmed `missingComma` makes changes to valid JSON

### Next Debug Steps
1. **Add detailed logging** to Recipe execution to see exact step where it fails
2. **Test each fixer in sequence** with the real narrative data
3. **Identify which step** corrupts the array or rejects it
4. **Fix or skip** the problematic step for arrays
5. **Add array-aware validation** to Recipe steps

## 📝 Test Cases to Fix

### Test 1: Aggressive Recipe with Complex Array
```typescript
// Location: tests/unit/json-cleaner/cleaning-engine.markdown.array.test.ts:27
it('should extract complex JSON array with aggressive recipe', async () => {
  // Uses RecipeTemplates.aggressive()
  // Real narrative data with nested objects and arrays
  // Currently: FAILS
  // Expected: SUCCESS with valid array extraction
});
```

### Test 2: Adaptive Recipe with Complex Array
```typescript
// Location: tests/unit/json-cleaner/cleaning-engine.markdown.array.test.ts:99
it('should extract complex JSON array from markdown code block (real-world narrative data)', async () => {
  // Uses RecipeTemplates.adaptive()
  // Same real narrative data
  // Currently: FAILS
  // Expected: SUCCESS with valid array extraction
});
```

## 🛠️ Implementation Plan

### Phase 1: Diagnosis (Week 1)
- [ ] Add comprehensive logging to Recipe execution flow
- [ ] Create step-by-step execution trace for failing tests
- [ ] Identify exact operation that fails/corrupts
- [ ] Document root cause

### Phase 2: Fix (Week 1-2)
- [ ] Implement fix for identified issue
- [ ] Options:
  - Make fixers array-aware
  - Skip certain fixers for arrays
  - Improve array validation
  - Enhance structural repair for arrays
- [ ] Ensure no regression on object handling

### Phase 3: Validation (Week 2)
- [ ] All 182 tests must pass
- [ ] Test with real Scribomate narrative data
- [ ] Verify Recipe System is preferred over fallback
- [ ] Performance testing with large arrays

### Phase 4: Documentation (Week 2)
- [ ] Update CHANGELOG.md for v2.5.0
- [ ] Document Recipe System array handling
- [ ] Add examples for array-based use cases
- [ ] Update test documentation

## 🎯 Success Criteria

- ✅ All 182 unit tests pass (0 skipped)
- ✅ Recipe System handles arrays without fallback
- ✅ No performance regression
- ✅ Backward compatible with v2.4.0
- ✅ Documentation updated

## 📦 Files to Modify

### Core Recipe System
- `src/middleware/services/json-cleaner/recipe-system/recipes/templates.ts`
  - May need array-specific recipe variations
- `src/middleware/services/json-cleaner/recipe-system/operations/fixers.ts`
  - Make fixers array-aware (especially `missingComma`, `structuralRepair`)
- `src/middleware/services/json-cleaner/recipe-system/core/cleaning-engine.ts`
  - Enhanced logging for debugging

### Tests
- `tests/unit/json-cleaner/cleaning-engine.markdown.array.test.ts`
  - Re-enabled 2 tests (already done)
  - Add more array-specific test cases

### Documentation
- `CHANGELOG.md` - v2.5.0 entry
- `README.md` - Recipe System array capabilities
- `tests/README.md` - Test count update

## 💡 Ideas & Notes

### Potential Solutions

1. **Array Detection in Recipe Flow**
   ```typescript
   .when(Conditions.isArray())
     .skip(Fixers.missingComma())  // Skip comma fixer for arrays
   ```

2. **Array-Aware Fixers**
   ```typescript
   class MissingCommaFixer {
     shouldApply(context) {
       if (isArray(context.currentJson)) return false;  // Skip for arrays
       return super.shouldApply(context);
     }
   }
   ```

3. **Separate Array Recipe**
   ```typescript
   static arrayAdaptive(): CleaningRecipe {
     // Simplified recipe for arrays
     // Only essential steps
   }
   ```

### Questions to Answer
- Why does minimal recipe work but full recipe fails?
- Which specific fixer breaks arrays?
- Is it a fixer or a validation step?
- Can we auto-detect and use different recipes for arrays vs objects?

## 🔗 Related Issues

- v2.4.0 Issue: JsonExtractor only extracted first object from arrays (FIXED)
- Scribomate Issue: Narrative generation returning single object instead of array (FIXED via fallback)

## 📅 Timeline

- **Start Date**: 2025-11-08 (branch created)
- **Completion Date**: 2025-11-08
- **Status**: ✅ **COMPLETED**

## ✅ Completion Summary

### Root Cause Identified
**MissingCommaFixer** was corrupting valid JSON by:
- Running on already-valid JSON (shouldApply() too aggressive)
- Regex patterns matching valid multi-line formatting
- Adding unnecessary commas that broke the JSON

### Solution Implemented
Modified `shouldApply()` in MissingCommaFixer:
```typescript
shouldApply(context: CleaningContext): boolean {
  const isCurrentlyValid = this.isValidJSON(context.currentJson);
  if (isCurrentlyValid) {
    return false; // Never modify valid JSON
  }
  return context.hasDetection('missing_comma') || this.hasMissingCommas(context.currentJson);
}
```

### Results
- ✅ All 186 unit tests pass (was 180/182)
- ✅ Recipe System handles arrays perfectly
- ✅ No regression on existing functionality
- ✅ Both aggressive and adaptive recipes work with complex nested arrays

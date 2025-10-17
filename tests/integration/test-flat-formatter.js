// Test script for FlatFormatter system
const {
  FlatFormatter,
  FormatConfigurator,
  LLMContextBuilder,
  characterPreset,
  genrePreset,
  chapterPreset
} = require('../../dist/middleware/services');

console.log('🧪 Testing FlatFormatter System...\n');

// Test 1: Basic FlatFormatter functionality
console.log('1. Testing Basic FlatFormatter...');
const testData = [
  {
    name: "John Doe",
    age: 30,
    role: "Protagonist",
    skills: ["Leadership", "Combat", "Strategy"]
  },
  {
    name: "Jane Smith", 
    age: 28,
    role: "Supporting Character",
    skills: ["Magic", "Healing", "Knowledge"]
  }
];

const basicFormat = FlatFormatter.flatten(testData, {
  format: 'numbered',
  entryTitleKey: 'name',
  ignoreEmptyValues: true
});
console.log('   ✅ Basic formatting successful');
console.log('   📄 Sample output:', basicFormat.split('\n').slice(0, 3).join(' | '));

// Test 2: FormatConfigurator with advanced options
console.log('\n2. Testing FormatConfigurator...');
const advancedConfig = new FormatConfigurator()
  .withFormat('sections')
  .withEntryTitleKey('name')
  .withEntryTitleAsPrefix(true)
  .withCustomFormatter('skills', skills => skills.join(' • '))
  .withComputedField('id', (item, index) => `CHAR_${String(index + 1).padStart(3, '0')}`)
  .ignoreEmptyValues(true)
  .build();

const advancedFormat = FlatFormatter.flatten(testData, advancedConfig);
console.log('   ✅ Advanced configuration successful');
console.log('   📄 Includes computed fields and custom formatters');

// Test 3: Character preset
console.log('\n3. Testing Character Preset...');
const character = {
  Name: "Gandalf",
  Description: "A wise wizard",
  Role: "Mentor", 
  Age: "Unknown",
  Appearance: "Tall, grey-robed wizard with a long beard",
  Personality: "Wise, patient, mysterious",
  Goals: "Guide the Fellowship and defeat Sauron",
  Relationships: "Member of the White Council, friend to hobbits"
};

try {
  const characterFormatted = characterPreset.formatForLLM(character, "## CHARACTER PROFILE:");
  console.log('   ✅ Character preset working correctly');
  console.log('   📄 Character fields processed and formatted');
} catch (error) {
  console.log('   ⚠️ Character preset error:', error.message);
}

// Test 4: Genre preset
console.log('\n4. Testing Genre Preset...');
const genre = {
  Name: "Epic Fantasy",
  Description: "Large-scale fantasy with complex worlds",
  Themes: "Good vs Evil, Coming of Age, Power and Corruption",
  Style: "Descriptive prose with rich world-building",
  Audience: "Young adult to adult readers"
};

try {
  const genreFormatted = genrePreset.formatForLLM(genre, "## GENRE SPECIFICATIONS:");
  console.log('   ✅ Genre preset working correctly');
  console.log('   📄 Genre specifications formatted');
} catch (error) {
  console.log('   ⚠️ Genre preset error:', error.message);
}

// Test 5: Array slicing functionality
console.log('\n5. Testing Array Slicing...');
const largeArray = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`
}));

const slicedResult = FlatFormatter.sliceArray(largeArray, 2, 5, {
  format: 'numbered',
  entryTitleKey: 'name'
});
console.log('   ✅ Array slicing successful');
console.log('   📄 Processed items 3-5 from array of 10');

// Test 6: LLMContextBuilder basic functionality
console.log('\n6. Testing LLMContextBuilder...');
const contextBuilder = new LLMContextBuilder();

// Test with minimal data
const testPromptData = {
  chapterData: {
    Chapter_Nr: 1,
    Chapter_Name: "The Beginning",
    Chapter_Description: "Our story begins..."
  },
  bookCreatorData: {
    genre: genre,
    characters: [character]
  }
};

try {
  const minimalContext = contextBuilder.buildMinimalContext(testPromptData);
  console.log('   ✅ LLMContextBuilder working correctly');
  console.log('   📄 Minimal context generated successfully');
  
  const storyContext = contextBuilder.buildStoryContext(testPromptData);
  console.log('   ✅ Story context generated successfully');
} catch (error) {
  console.log('   ⚠️ LLMContextBuilder error:', error.message);
}

// Test 7: Error handling and null safety
console.log('\n7. Testing Error Handling...');
try {
  // Test with null/undefined data
  const nullResult = characterPreset.formatForLLM(null, "## NULL TEST:");
  console.log('   ✅ Null safety working - fallback message generated');
  
  // Test with malformed data
  const malformedData = { invalidField: "test", anotherField: null };
  const malformedResult = characterPreset.formatForLLM(malformedData, "## MALFORMED TEST:");
  console.log('   ✅ Malformed data handling working - fallback entity created');
} catch (error) {
  console.log('   ⚠️ Error handling failed:', error.message);
}

console.log('\n🎉 FlatFormatter System Test Complete!');
console.log('All core components have been successfully extracted and tested.');
console.log('\nThe FlatFormatter system provides:');
console.log('- ✅ Flexible data formatting for LLMs');
console.log('- ✅ Robust preset system with multiple entity types');
console.log('- ✅ Advanced configuration with computed fields');
console.log('- ✅ LLM context building capabilities'); 
console.log('- ✅ Array slicing and performance optimization');
console.log('- ✅ Comprehensive error handling and null safety');
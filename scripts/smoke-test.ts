/**
 * Smoke test for ollama-middleware with gemma3:4b
 * Tests the enhanced logging and data flow features
 */

import { OllamaService } from '../src/middleware/services/ollama/ollama.service';
import { DataFlowLoggerService } from '../src/middleware/services/data-flow-logger/data-flow-logger.service';
import { ControlCharDiagnostics } from '../src/middleware/services/json-cleaner/utils/control-char-diagnostics.util';
import { getMemoryUsage } from '../src/middleware/shared/utils/memory-management.utils';

async function runSmokeTest() {
  console.log('🚀 Starting Ollama Middleware Smoke Test');
  console.log('==========================================\n');

  // Test 1: Memory Utils
  console.log('📊 Test 1: Memory Management Utils');
  const memoryBefore = getMemoryUsage();
  console.log('Memory usage:', memoryBefore);
  console.log('✅ Memory utils working\n');

  // Test 2: Control Char Diagnostics
  console.log('🔍 Test 2: Control Char Diagnostics');
  const testJson = '{"text": "line1\nline2"}';
  const diagnosis = ControlCharDiagnostics.diagnose(testJson);
  console.log('Detected issues:', diagnosis.summary.totalIssues);
  console.log('Can be fixed:', diagnosis.summary.canBeFixed);
  const repaired = ControlCharDiagnostics.repair(testJson);
  console.log('Repair success:', repaired.success);
  console.log('✅ Control char diagnostics working\n');

  // Test 3: DataFlowLogger
  console.log('📝 Test 3: DataFlowLogger');
  const dataFlowLogger = DataFlowLoggerService.getInstance();
  const requestId = dataFlowLogger.startRequest('smoke-test', {});
  console.log('Request ID:', requestId);
  console.log('✅ DataFlowLogger working\n');

  // Test 4: Ollama Service (Real API call)
  console.log('🤖 Test 4: Ollama Service with gemma3:4b');
  console.log('Attempting to call Ollama API...');
  
  const ollamaService = new OllamaService();
  
  try {
    const response = await ollamaService.callOllamaApiWithSystemMessage(
      'Say "Hello from ollama-middleware test!" in exactly 5 words.',
      'You are a helpful assistant.',
      {
        model: 'gemma3:4b',
        temperature: 0.7,
        baseUrl: 'http://localhost:11434',
        debugContext: 'smoke-test',
        sessionId: `smoke-${Date.now()}`
      }
    );

    if (response) {
      console.log('✅ Ollama API call successful!');
      console.log('Response length:', response.message.content.length);
      console.log('Session ID:', response.sessionId);
      console.log('Response preview:', response.message.content.substring(0, 100));
      
      // Check if logs were created
      console.log('\n📁 Checking log files...');
      const fs = require('fs');
      const path = require('path');
      const logsDir = path.join(process.cwd(), 'logs', 'ollama', 'requests');
      
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        console.log(`Found ${files.length} log files`);
        
        if (files.length > 0) {
          const latestLog = files[files.length - 1];
          console.log('Latest log:', latestLog);
          
          const logContent = fs.readFileSync(path.join(logsDir, latestLog), 'utf-8');
          const hasCompleteResponseData = logContent.includes('## Complete Response Data');
          const hasResponseMetrics = logContent.includes('eval_count') || logContent.includes('total_duration');
          
          console.log('Contains Complete Response Data:', hasCompleteResponseData);
          console.log('Contains Response Metrics:', hasResponseMetrics);
          
          if (hasCompleteResponseData && hasResponseMetrics) {
            console.log('✅ Enhanced logging features verified!');
          } else {
            console.log('⚠️  Some logging features may be missing');
          }
        }
      }
      
      console.log('\n✨ ALL TESTS PASSED! ✨');
    } else {
      console.log('❌ Ollama API call returned null');
      console.log('⚠️  Check if Ollama is running and gemma3:4b is available');
    }
  } catch (error) {
    console.log('❌ Ollama API call failed');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('\n⚠️  Make sure Ollama is running: `ollama serve`');
    console.log('⚠️  Make sure gemma3:4b is pulled: `ollama pull gemma3:4b`');
  }

  // Final memory check
  console.log('\n📊 Final memory usage:');
  const memoryAfter = getMemoryUsage();
  console.log(memoryAfter);

  console.log('\n==========================================');
  console.log('🏁 Smoke Test Complete');
}

// Run the test
runSmokeTest().catch(console.error);

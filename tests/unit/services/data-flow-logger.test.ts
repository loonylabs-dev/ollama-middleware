import { DataFlowLoggerService } from '../../../src/middleware/services/data-flow-logger';
import * as fs from 'fs';
import * as path from 'path';

describe('DataFlowLoggerService', () => {
  let logger: DataFlowLoggerService;
  const testLogDir = path.join(process.cwd(), 'logs', 'llm', 'ollama', 'requests-data-flow');

  beforeEach(() => {
    logger = DataFlowLoggerService.getInstance();
  });

  afterEach(() => {
    logger.clearCurrentRequestId();
    // Cleanup test logs if needed
    if (fs.existsSync(testLogDir)) {
      const files = fs.readdirSync(testLogDir);
      files.forEach(file => {
        if (file.includes('test-') || file.includes('general_')) {
          try {
            fs.unlinkSync(path.join(testLogDir, file));
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
    }
  });

  describe('Context Identifier Generation', () => {
    it('should use custom context identifier generator when configured', () => {
      logger.setContextIdentifierGenerator((ctx) => `custom-${ctx.id}`);
      const requestId = logger.startRequest('test-stage', { id: '123' });
      logger.logLLMRequest({
        stage: 'test',
        prompt: 'test prompt',
        systemMessage: 'system',
        modelName: 'test-model'
      }, { id: '123' });

      expect(requestId).toBeDefined();
    });

    it('should fallback to generic identifiers when no custom generator', () => {
      const requestId = logger.startRequest('test-stage', { sessionId: 'session-123' });
      expect(requestId).toMatch(/^req_/);
    });

    it('should use id field as fallback', () => {
      const requestId = logger.startRequest('test-stage', { id: 'test-id' });
      expect(requestId).toBeDefined();
    });
  });

  describe('Request Management', () => {
    it('should generate unique request IDs', () => {
      const id1 = logger.startRequest('stage1');
      logger.clearCurrentRequestId();
      const id2 = logger.startRequest('stage2');

      expect(id1).not.toBe(id2);
    });

    it('should track current request ID', () => {
      const requestId = logger.startRequest('test-stage');
      expect(logger.getCurrentRequestId()).toBe(requestId);
    });

    it('should clear current request ID', () => {
      logger.startRequest('test-stage');
      logger.clearCurrentRequestId();
      expect(logger.getCurrentRequestId()).toBeNull();
    });
  });

  describe('Logging Operations', () => {
    it('should log LLM requests', () => {
      const requestId = logger.startRequest('test-stage');

      expect(() => {
        logger.logLLMRequest({
          stage: 'test',
          prompt: 'test prompt',
          systemMessage: 'system message',
          modelName: 'test-model',
          temperature: 0.7
        }, { sessionId: 'test-session' });
      }).not.toThrow();
    });

    it('should log LLM responses', () => {
      const requestId = logger.startRequest('test-stage');

      expect(() => {
        logger.logLLMResponse('test', {
          rawResponse: 'response text',
          processingTime: 150,
          tokensUsed: 100
        }, { sessionId: 'test-session' });
      }).not.toThrow();
    });

    it('should log JSON cleaning operations', () => {
      const requestId = logger.startRequest('test-stage');

      expect(() => {
        logger.logJsonCleaning('test', { sessionId: 'test' }, {
          input: '{invalid}',
          output: '{"valid": true}',
          method: 'recipe-system',
          success: true
        });
      }).not.toThrow();
    });
  });
});

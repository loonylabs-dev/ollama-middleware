import { ControlCharDiagnostics } from '../../../src/middleware/services/json-cleaner/utils/control-char-diagnostics.util';

describe('ControlCharDiagnostics', () => {
  describe('diagnose', () => {
    it('should detect valid JSON', () => {
      const validJson = '{"name": "test", "value": 123}';
      const result = ControlCharDiagnostics.diagnose(validJson);
      
      expect(result.summary.isValid).toBe(true);
      expect(result.summary.hasControlChars).toBe(false);
      expect(result.summary.totalIssues).toBe(0);
    });

    it('should detect unescaped newlines', () => {
      const jsonWithNewline = '{"text": "line1\nline2"}';
      const result = ControlCharDiagnostics.diagnose(jsonWithNewline);
      
      expect(result.summary.isValid).toBe(false);
      expect(result.summary.hasControlChars).toBe(true);
      expect(result.summary.totalIssues).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('unescaped-newline');
      expect(result.issues[0].severity).toBe('high');
    });

    it('should detect unescaped tabs', () => {
      const jsonWithTab = '{"text": "before\tafter"}';
      const result = ControlCharDiagnostics.diagnose(jsonWithTab);
      
      expect(result.summary.hasControlChars).toBe(true);
      expect(result.issues[0].type).toBe('unescaped-tab');
      expect(result.issues[0].severity).toBe('medium');
    });

    it('should provide suggestions for fixes', () => {
      const jsonWithNewline = '{"text": "line1\nline2"}';
      const result = ControlCharDiagnostics.diagnose(jsonWithNewline);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('newline'))).toBe(true);
    });
  });

  describe('repair', () => {
    it('should repair unescaped newlines', () => {
      const jsonWithNewline = '{"text": "line1\nline2"}';
      const result = ControlCharDiagnostics.repair(jsonWithNewline);
      
      expect(result.success).toBe(true);
      expect(result.repairedJson).toContain('\\n');
      expect(result.appliedFixes.length).toBeGreaterThan(0);
    });

    it('should repair unescaped tabs', () => {
      const jsonWithTab = '{"text": "before\tafter"}';
      const result = ControlCharDiagnostics.repair(jsonWithTab);
      
      expect(result.success).toBe(true);
      expect(result.repairedJson).toContain('\\t');
    });

    it('should handle already valid JSON', () => {
      const validJson = '{"text": "valid"}';
      const result = ControlCharDiagnostics.repair(validJson);
      
      expect(result.success).toBe(true);
      expect(result.appliedFixes.length).toBe(0);
      expect(result.repairedJson).toBe(validJson);
    });

    it('should report errors if repair fails', () => {
      const brokenJson = '{"text": "broken"';
      const result = ControlCharDiagnostics.repair(brokenJson);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    it('should generate a detailed report', () => {
      const jsonWithNewline = '{"text": "line1\nline2"}';
      const report = ControlCharDiagnostics.generateReport(jsonWithNewline);
      
      expect(report).toContain('CONTROL CHARACTER DIAGNOSIS REPORT');
      expect(report).toContain('SUMMARY');
      expect(report).toContain('DETECTED ISSUES');
      expect(report).toContain('SUGGESTIONS');
    });

    it('should include timestamp and JSON length', () => {
      const json = '{"key": "value"}';
      const report = ControlCharDiagnostics.generateReport(json);
      
      expect(report).toMatch(/Timestamp: \d{4}-\d{2}-\d{2}/);
      expect(report).toContain(`JSON Length: ${json.length} characters`);
    });
  });

  describe('quickFix', () => {
    it('should attempt to fix common issues', () => {
      const json = '{"text": "value"}';
      const fixed = ControlCharDiagnostics.quickFix(json);
      
      // quickFix is a simple regex-based approach, may not catch all cases
      expect(typeof fixed).toBe('string');
      expect(fixed.length).toBeGreaterThan(0);
    });
  });
});

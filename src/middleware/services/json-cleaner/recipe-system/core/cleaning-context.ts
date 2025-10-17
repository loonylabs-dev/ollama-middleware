import { 
  CleaningContext, 
  Detection, 
  ChangeDescription, 
  ContextMetadata, 
  ContextStats,
  ChangeLocation 
} from '../types/operation.types';

export class CleaningContextImpl implements CleaningContext {
  public currentJson: string;
  public readonly originalJson: string;
  public readonly detections: Map<string, Detection[]> = new Map();
  public readonly checkpoints: Map<string, string> = new Map();
  public readonly changes: ChangeDescription[] = [];
  public readonly metadata: ContextMetadata;

  constructor(json: string, metadata?: Partial<ContextMetadata>) {
    this.currentJson = json;
    this.originalJson = json;
    this.metadata = {
      startTime: Date.now(),
      source: 'unknown',
      mode: 'adaptive',
      ...metadata
    };
  }

  addDetection(
    type: string, 
    location: number | ChangeLocation, 
    confidence: number = 1.0, 
    metadata?: Record<string, any>
  ): void {
    if (!this.detections.has(type)) {
      this.detections.set(type, []);
    }
    
    this.detections.get(type)!.push({
      type,
      location,
      confidence,
      metadata
    });
  }

  hasDetection(type: string): boolean {
    return this.detections.has(type) && this.detections.get(type)!.length > 0;
  }

  getDetections(type: string): Detection[] {
    return this.detections.get(type) || [];
  }

  createCheckpoint(name: string): void {
    this.checkpoints.set(name, this.currentJson);
    console.log(`[CleaningContext] Created checkpoint '${name}' with ${this.currentJson.length} chars`);
  }

  rollbackTo(name: string): boolean {
    const checkpoint = this.checkpoints.get(name);
    if (checkpoint) {
      console.log(`[CleaningContext] Rolling back to checkpoint '${name}'`);
      this.currentJson = checkpoint;
      return true;
    }
    
    console.warn(`[CleaningContext] Checkpoint '${name}' not found`);
    return false;
  }

  updateJson(newJson: string): void {
    this.currentJson = newJson;
  }

  recordChange(change: ChangeDescription): void {
    this.changes.push(change);
  }

  getStats(): ContextStats {
    return {
      totalChanges: this.changes.length,
      processingTime: Date.now() - this.metadata.startTime,
      checkpointCount: this.checkpoints.size,
      rollbackCount: this.changes.filter(c => (c.type as any) === 'rollback').length,
      detectionCount: Array.from(this.detections.values()).reduce((sum, arr) => sum + arr.length, 0),
      isValid: this.isValidJson()
    };
  }

  // Helper methods
  isValidJson(): boolean {
    try {
      JSON.parse(this.currentJson);
      return true;
    } catch {
      return false;
    }
  }

  getDetectionsByConfidence(minConfidence: number = 0.5): Detection[] {
    const allDetections: Detection[] = [];
    for (const detectionArray of this.detections.values()) {
      allDetections.push(...detectionArray.filter(d => d.confidence >= minConfidence));
    }
    return allDetections.sort((a, b) => b.confidence - a.confidence);
  }

  getChangesByType(type: ChangeDescription['type']): ChangeDescription[] {
    return this.changes.filter(c => c.type === type);
  }

  getSizeChange(): number {
    return this.currentJson.length - this.originalJson.length;
  }

  getChangeRate(): number {
    return this.changes.length / Math.max(this.originalJson.length, 1);
  }

  // Analysis methods
  analyzePatterns(): {
    hasControlChars: boolean;
    hasMissingCommas: boolean;
    hasExtraCommas: boolean;
    hasUnescapedQuotes: boolean;
    hasStructuralIssues: boolean;
    hasMarkdownBlocks: boolean;
    hasThinkTags: boolean;
    estimatedErrorCount: number;
  } {
    const json = this.currentJson;
    
    return {
      hasControlChars: /[\x00-\x1F\x7F]/.test(json),
      hasMissingCommas: this.detectMissingCommas(json),
      hasExtraCommas: this.detectExtraCommas(json),
      hasUnescapedQuotes: this.detectUnescapedQuotes(json),
      hasStructuralIssues: this.detectStructuralIssues(json),
      hasMarkdownBlocks: /```[\s\S]*?```/.test(json),
      hasThinkTags: /<think>[\s\S]*?<\/think>/.test(json),
      estimatedErrorCount: this.estimateErrorCount(json)
    };
  }

  private detectMissingCommas(json: string): boolean {
    return /"\s*"[^:\s]/.test(json) || 
           /}\s*{/.test(json) ||
           /]\s*\[/.test(json);
  }

  private detectExtraCommas(json: string): boolean {
    return /,\s*[}\]]/.test(json) || /,,/.test(json);
  }

  private detectUnescapedQuotes(json: string): boolean {
    return /"[^"\\]*[^\\]"[^,\]}]/.test(json);
  }

  private detectStructuralIssues(json: string): boolean {
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    
    return openBraces !== closeBraces || openBrackets !== closeBrackets;
  }

  private estimateErrorCount(json: string): number {
    let count = 0;
    count += (json.match(/[\x00-\x1F\x7F]/g) || []).length;
    count += (json.match(/"[^"]*"[^,\]}:\s]/g) || []).length;
    count += (json.match(/,\s*[}\]]/g) || []).length;
    count += Math.abs((json.match(/\{/g) || []).length - (json.match(/\}/g) || []).length);
    count += Math.abs((json.match(/\[/g) || []).length - (json.match(/\]/g) || []).length);
    return count;
  }

  toString(): string {
    const stats = this.getStats();
    return `CleaningContext{valid: ${stats.isValid}, changes: ${stats.totalChanges}, detections: ${stats.detectionCount}, time: ${stats.processingTime}ms}`;
  }
}

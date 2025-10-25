import { JsonCleanerService } from '../json-cleaner/json-cleaner.service';

/**
 * Response processor interface
 */
interface ProcessedResponse {
  cleanedJson: string;
  thinking: string;
}

/**
 * Response processor service
 * Integrates JSON cleaning pipeline and thinking tag extraction
 */
export class ResponseProcessorService {
  /**
   * Process AI response with full JSON cleaning pipeline
   * 1. Extracts <think> tags
   * 2. Cleans JSON using JsonCleanerService (removes markdown wrappers, fixes malformed JSON)
   */
  public static processResponse(response: string): ProcessedResponse {
    // Extract thinking tags if present
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch ? thinkMatch[1].trim() : '';
    
    // Remove thinking tags from response
    let contentWithoutThinking = response.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    // Apply JSON cleaning (removes markdown wrappers, fixes malformed JSON, etc.)
    try {
      const cleaningResult = JsonCleanerService.processResponse(contentWithoutThinking);
      contentWithoutThinking = cleaningResult.cleanedJson;
    } catch (error) {
      // If cleaning fails, use the content as-is (already has thinking removed)
      console.warn('[ResponseProcessor] JSON cleaning failed, using raw content:', error);
    }
    
    return {
      cleanedJson: contentWithoutThinking,
      thinking: thinking
    };
  }
}

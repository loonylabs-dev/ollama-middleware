import { BasePreset, FormatConfig } from './base-preset';
import { PageSummary } from './types/entity-types';
import { ProcessedPageSummary } from './types/processed-entity-types';

export class PageSummaryPreset extends BasePreset<PageSummary, ProcessedPageSummary> {
  constructor() {
    super('PageSummary');
  }

  protected preprocessEntity(pageSummary: PageSummary): ProcessedPageSummary {
    return {
      'Chapter Number': pageSummary.chapterNr || 0,
      'Page Number': pageSummary.pageNr || 0,
      'Title': pageSummary.title || 'Untitled',
      'Summary': pageSummary.summary || 'No summary available',
      'Key Events': pageSummary.keyEvents || 'No key events specified',
      'Characters': pageSummary.characters || 'No characters specified',
      'Mood': pageSummary.mood || 'No mood specified',
      'Themes': pageSummary.themes || 'No themes specified',
      'Conflicts': pageSummary.conflicts || 'No conflicts specified',
      'Outcomes': pageSummary.outcomes || 'No outcomes specified',
      'Next Steps': pageSummary.nextSteps || 'No next steps specified'
    };
  }

  /**
   * Creates a compact format for page summaries
   */
  public createCompactFormat(): FormatConfig {
    return this.createFormat()
      .withFormat('numbered')
      .withEntryTitleKey('Title')
      .withEntryTitleAsPrefix(true)
      .ignoreKeys('Page Number')
      .ignoreEmptyValues(true)
      .withKeyValueSeparator(': ')
      .build();
  }

  /**
   * Formats only page summaries that have data
   */
  public formatOnlyWithData(summaries?: PageSummary[], header?: string): string {
    if (!summaries) {
      return header ? `${header}\nNo page summaries available.` : 'No page summaries available.';
    }

    const summariesWithData = summaries.filter(summary => 
      summary.summary && summary.summary.trim() !== ''
    );

    if (summariesWithData.length === 0) {
      return header ? `${header}\nNo page summaries with content available.` : 'No page summaries with content available.';
    }

    return this.formatForLLM(summariesWithData, header);
  }
}

// Singleton instance for global use
export const pageSummaryPreset = new PageSummaryPreset();
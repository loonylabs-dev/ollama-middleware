import {
  GenericEntity,
  Character,
  Chapter,
  ChapterData,
  PageSummary,
  Plot,
  Setting,
  Genre,
  TargetAudience,
  Narrative
} from "./presets/types/entity-types";

import {
  characterPreset,
  chapterPreset,
  chapterDataPreset,
  pageSummaryPreset,
  plotPreset,
  settingPreset,
  genrePreset,
  targetAudiencePreset,
  narrativePreset
} from "./presets";

interface PromptData {
  chapterData?: ChapterData;
  bookCreatorData?: BookCreatorData;
  chapterPageSummaries?: PageSummary[];
}

interface BookCreatorData {
  bookType?: string;
  genre?: Genre;
  setting?: Setting;
  targetAudience?: TargetAudience;
  narrative?: Narrative;
  characters?: Character[];
  chapters?: Chapter[];
  plot?: Plot;
}

/**
 * LLMContextBuilder - Creates formatted contexts for LLM prompts
 * Uses FlatFormatter and presets for consistent data formatting
 */
export class LLMContextBuilder {
  
  // === INDIVIDUAL FORMATTING FUNCTIONS ===
  
  /**
   * Formats current chapter information
   */
  public formatCurrentChapter(chapterData?: ChapterData, header: string = "## CURRENT CHAPTER (**PRIORITY**):"): string {
    if (!chapterData) {
      return `${header}\nNo chapter information available`;
    }
    return chapterDataPreset.formatForLLM(chapterData, header);
  }

  /**
   * Formats character information
   */
  public formatCharacters(characters?: Character[], header: string = "## ALL CHARACTERS:"): string {
    return characterPreset.formatForLLM(characters, header);
  }

  /**
   * Formats genre information
   */
  public formatGenre(genre?: Genre, header: string = "## GENRE:"): string {
    return genrePreset.formatForLLM(genre, header);
  }

  /**
   * Formats setting information
   */
  public formatSetting(setting?: Setting, header: string = "## SETTING:"): string {
    return settingPreset.formatForLLM(setting, header);
  }

  /**
   * Formats target audience information
   */
  public formatTargetAudience(targetAudience?: TargetAudience, header: string = "## TARGET AUDIENCE:"): string {
    return targetAudiencePreset.formatForLLM(targetAudience, header);
  }

  /**
   * Formats narrative information (usually with high priority)
   */
  public formatNarrative(narrative?: Narrative, header: string = "## NARRATIVE (**PRIORITY**):"): string {
    return narrativePreset.formatForLLM(narrative, header);
  }

  /**
   * Formats plot information
   */
  public formatPlot(plot?: Plot, header: string = "## PLOT:"): string {
    return plotPreset.formatForLLM(plot, header);
  }

  /**
   * Formats chapter overviews (for subsequent chapters)
   */
  public formatChapters(chapters?: Chapter[], header: string = "## CHAPTER OVERVIEW:"): string {
    return chapterPreset.formatForLLM(chapters, header);
  }

  /**
   * Formats chapter summaries
   */
  public formatPageSummaries(summaries?: PageSummary[], header: string = "## CHAPTER SUMMARIES:"): string {
    return pageSummaryPreset.formatForLLM(summaries, header);
  }

  /**
   * Formats only chapter summaries with data
   */
  public formatPageSummariesWithData(summaries?: PageSummary[], header: string = "## CHAPTER SUMMARIES:"): string {
    if (!summaries) return `${header}\nNo chapter summaries available.`;
    return pageSummaryPreset.formatOnlyWithData(summaries, header);
  }

  // === SPECIAL CONTEXT FUNCTIONS ===

  /**
   * Formats previous chapter summaries with intelligent slice
   * (shows only chapters before the current chapter)
   */
  public formatPreviousChapterSummaries(
    summaries?: PageSummary[], 
    currentChapterNr?: number,
    header: string = "## PREVIOUS CHAPTERS:"
  ): string {
    if (!summaries || summaries.length === 0) {
      return `${header}\nNo previous chapters available.`;
    }

    const sortedSummaries = [...summaries].sort((a, b) => a.chapterNr - b.chapterNr);
    let sliceEnd: number | undefined = undefined;

    if (currentChapterNr !== undefined) {
      sliceEnd = sortedSummaries.findIndex(summary => summary.chapterNr >= currentChapterNr);
      if (sliceEnd === -1) {
        sliceEnd = sortedSummaries.filter(s => s.chapterNr < currentChapterNr).length;
      }
    }

    if (sliceEnd === 0) {
      return `${header}\nThis is the first chapter - no previous chapters available.`;
    }

    const compactFormat = pageSummaryPreset.createCompactFormat();
    const formatWithSlice = {
      ...compactFormat,
      arraySliceStart: 0,
      arraySliceEnd: sliceEnd,
    };

    return pageSummaryPreset.formatForLLM(sortedSummaries, header, formatWithSlice);
  }

  /**
   * Formats following chapter overviews
   * (shows only chapters after the current chapter)
   */
  public formatFollowingChapters(
    chapters?: Chapter[], 
    currentChapterNr?: number,
    header: string = "## FOLLOWING CHAPTERS:"
  ): string {
    if (!chapters || currentChapterNr === undefined) {
      return chapterPreset.formatForLLM(chapters, header);
    }

    const followingChaptersStartIndex = currentChapterNr;

    if (followingChaptersStartIndex >= chapters.length) {
      return `${header}\nNo further chapters available.`;
    }

    const followingChaptersFormat = chapterPreset
      .createFormat()
      .withFormat("sections")
      .withItemPrefix("=== CHAPTER")
      .withItemSuffix("===")
      .withEntryTitleKey("Chapter_Name")
      .withEntryTitleAsPrefix(false)
      .withIndexField("Chapter No", 1)
      .ignoreKeys("Chapter No")
      .ignoreEmptyValues(true)
      .withKeyValueSeparator(": ")
      .withArraySlice(followingChaptersStartIndex)
      .build();

    const formatted = chapterPreset.formatForLLM(chapters, header, followingChaptersFormat);

    if (!formatted || formatted.includes("No")) {
      return `${header}\nThis is the last chapter - no further chapters available.`;
    }

    return formatted;
  }

  // === COMPLETE CONTEXT FUNCTIONS ===

  /**
   * Creates the complete context for LLM prompts
   * (original fullContext function)
   */
  public buildFullContext(prompt: any): string {
    const actualPrompt: PromptData = prompt.prompt || prompt;

    const sections = [
      this.formatCurrentChapter(actualPrompt.chapterData),
      this.formatPreviousChapterSummaries(
        actualPrompt.chapterPageSummaries, 
        actualPrompt.chapterData?.Chapter_Nr
      ),
      this.formatFollowingChapters(
        actualPrompt.bookCreatorData?.chapters,
        actualPrompt.chapterData?.Chapter_Nr
      ),
      this.formatNarrative(actualPrompt.bookCreatorData?.narrative),
      this.formatGenre(actualPrompt.bookCreatorData?.genre),
      this.formatSetting(actualPrompt.bookCreatorData?.setting),
      this.formatTargetAudience(actualPrompt.bookCreatorData?.targetAudience),
      this.formatPlot(actualPrompt.bookCreatorData?.plot),
      this.formatCharacters(actualPrompt.bookCreatorData?.characters),
    ];

    return sections.join('\n\n');
  }

  /**
   * Creates a minimal context (only priority information)
   */
  public buildMinimalContext(prompt: any): string {
    const actualPrompt: PromptData = prompt.prompt || prompt;

    const sections = [
      this.formatCurrentChapter(actualPrompt.chapterData),
      this.formatNarrative(actualPrompt.bookCreatorData?.narrative),
    ];

    return sections.join('\n\n');
  }

  /**
   * Creates a story-focused context
   */
  public buildStoryContext(prompt: any): string {
    const actualPrompt: PromptData = prompt.prompt || prompt;

    const sections = [
      this.formatCurrentChapter(actualPrompt.chapterData),
      this.formatPreviousChapterSummaries(
        actualPrompt.chapterPageSummaries, 
        actualPrompt.chapterData?.Chapter_Nr
      ),
      this.formatCharacters(actualPrompt.bookCreatorData?.characters),
      this.formatPlot(actualPrompt.bookCreatorData?.plot),
      this.formatSetting(actualPrompt.bookCreatorData?.setting),
    ];

    return sections.join('\n\n');
  }

  /**
   * Creates a style-focused context
   */
  public buildStyleContext(prompt: any): string {
    const actualPrompt: PromptData = prompt.prompt || prompt;

    const sections = [
      this.formatCurrentChapter(actualPrompt.chapterData),
      this.formatNarrative(actualPrompt.bookCreatorData?.narrative),
      this.formatGenre(actualPrompt.bookCreatorData?.genre),
      this.formatTargetAudience(actualPrompt.bookCreatorData?.targetAudience),
    ];

    return sections.join('\n\n');
  }

  /**
   * Alternative: Creates only the writing guidelines without other contexts
   * For cases where only the style parameters are needed
   */
  public buildWritingGuideContext(
    genre?: Genre,
    targetAudience?: TargetAudience, 
    narrative?: Narrative
  ): string {
    const sections = [
      this.formatNarrative(narrative, "## WRITING STYLE (**PRIORITY**):"),
      this.formatGenre(genre, "## GENRE REQUIREMENTS:"),
      this.formatTargetAudience(targetAudience, "## TARGET AUDIENCE ADAPTATION:"),
    ];

    return sections.join('\n\n');
  }

  // === UTILITY FUNCTIONS ===

  /**
   * Extracts BookCreatorData from PromptData
   */
  private extractBookCreatorData(prompt: any): BookCreatorData | undefined {
    const actualPrompt: PromptData = prompt.prompt || prompt;
    return actualPrompt.bookCreatorData;
  }

  /**
   * Checks if all important data is present
   */
  public validatePromptData(prompt: any): { isValid: boolean; missingFields: string[] } {
    const actualPrompt: PromptData = prompt.prompt || prompt;
    const missingFields: string[] = [];

    if (!actualPrompt.chapterData) missingFields.push('chapterData');
    if (!actualPrompt.bookCreatorData?.genre) missingFields.push('genre');
    if (!actualPrompt.bookCreatorData?.narrative) missingFields.push('narrative');
    if (!actualPrompt.bookCreatorData?.characters?.length) missingFields.push('characters');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }
}
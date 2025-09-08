export interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

export interface StemFrequency {
  stem: string;
  exampleWord: string;
  count: number;
  percentage: number;
  words: string[];
}

/**
 * Text analysis utilities for analyzing AI-generated content
 * Provides word frequency and stem analysis with German language support
 */
export class TextAnalyzer {
  /**
   * German stop words to be filtered out during analysis
   */
  private static readonly GERMAN_STOP_WORDS = new Set([
    'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'den', 'dem', 'des', 'ist', 'sind', 
    'war', 'wird', 'werden', 'wurden', 'zu', 'zur', 'zum', 'in', 'im', 'an', 'am', 'auf', 'aus', 
    'mit', 'bei', 'von', 'für', 'um', 'durch', 'über', 'unter', 'vor', 'nach', 'ihr', 'ihre', 
    'sein', 'seine', 'hat', 'haben', 'hatte', 'hatten', 'es', 'sie', 'er', 'wir', 'sich', 'nicht', 
    'als', 'auch', 'so', 'dann', 'noch', 'nur', 'schon', 'sehr', 'wie', 'was', 'wenn', 'weil',
    'dass', 'daß', 'da', 'wo', 'wer', 'nun', 'mir', 'dir', 'mich', 'dich', 'ihm', 'ihn'
  ]);

  /**
   * English stop words for multilingual support
   */
  private static readonly ENGLISH_STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning', 'is', 'are',
    'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ]);

  /**
   * Filter and clean text for analysis
   * @param text Text to clean
   * @returns Array of filtered words
   */
  static prepareText(text: string): string[] {
    if (!text) return [];
    
    // Clean text: remove punctuation and convert to lowercase
    const cleanedText = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ');
    
    // Split into words
    const words = cleanedText.split(' ');
    
    // Filter words with less than 3 characters, stop words, and numbers
    return words.filter(word => 
      word.length >= 3 && 
      !this.GERMAN_STOP_WORDS.has(word) && 
      !this.ENGLISH_STOP_WORDS.has(word) &&
      !/^\d+$/.test(word)
    );
  }

  /**
   * Simple German stemmer that removes common endings
   * @param word Word to stem
   * @returns Word stem
   */
  static germanStemmer(word: string): string {
    if (word.length <= 3) return word;
    
    let stem = word.toLowerCase();

    // Step 1: Remove plural and case endings
    const endings = [
      'innen', 'erin', 'ern', 'en', 'es', 'er', 'em', 'e', 's', 'n'
    ];
    
    for (const ending of endings) {
      if (stem.endsWith(ending) && stem.length - ending.length >= 3) {
        stem = stem.slice(0, -ending.length);
        break; // Only remove one ending
      }
    }
    
    // Step 2: Convert umlauts for better matching of related words
    stem = stem
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/ß/g, 'ss');
    
    return stem;
  }

  /**
   * Analyze word frequency in text
   * @param text Text to analyze
   * @param topN Number of most frequent words to return
   * @returns Array of word frequency objects sorted by frequency
   */
  static analyzeWordFrequency(text: string, topN: number = 50): WordFrequency[] {
    const filteredWords = this.prepareText(text);
    if (filteredWords.length === 0) return [];
    
    const totalWords = filteredWords.length;
    
    // Count word frequency
    const wordFrequency: Record<string, number> = {};
    filteredWords.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top N with percentage
    return Object.entries(wordFrequency)
      .map(([word, count]) => ({ 
        word, 
        count,
        percentage: (count / totalWords) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }

  /**
   * Analyze word repetitions based on word stems
   * @param text Text to analyze
   * @param topN Number of most frequent stems to return
   * @returns Array of stem frequency objects
   */
  static analyzeStemFrequency(text: string, topN: number = 50): StemFrequency[] {
    const filteredWords = this.prepareText(text);
    if (filteredWords.length === 0) return [];
    
    const totalWords = filteredWords.length;
    
    // Count stem frequency and track word variations
    const stemFrequency: Record<string, { count: number, words: Set<string> }> = {};
    
    filteredWords.forEach(word => {
      const stem = this.germanStemmer(word);
      
      if (!stemFrequency[stem]) {
        stemFrequency[stem] = { count: 0, words: new Set() };
      }
      
      stemFrequency[stem].count += 1;
      stemFrequency[stem].words.add(word);
    });
    
    // Sort by frequency and return top N with percentage
    return Object.entries(stemFrequency)
      .map(([stem, { count, words }]) => ({
        stem,
        exampleWord: Array.from(words)[0], // First occurrence as example
        count,
        percentage: (count / totalWords) * 100,
        words: Array.from(words).sort() // Sorted list of all word forms
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }

  /**
   * Generate markdown table for word frequency analysis
   * @param frequencies Word frequencies
   * @returns Markdown formatted table
   */
  static generateWordFrequencyTable(frequencies: WordFrequency[]): string {
    if (frequencies.length === 0) return '';
    
    return `| Word | Frequency | Percentage |
|------|-----------|------------|
${frequencies.map(({ word, count, percentage }) => 
  `| ${word} | ${count} | ${percentage.toFixed(2)}% |`
).join('\n')}`;
  }

  /**
   * Generate markdown table for stem frequency analysis
   * @param frequencies Stem frequencies
   * @returns Markdown formatted table
   */
  static generateStemFrequencyTable(frequencies: StemFrequency[]): string {
    if (frequencies.length === 0) return '';
    
    return `| Stem | Example | Frequency | Percentage | Word Forms |
|------|---------|-----------|------------|------------|
${frequencies.map(({ stem, exampleWord, count, percentage, words }) => 
  `| ${stem} | ${exampleWord} | ${count} | ${percentage.toFixed(2)}% | ${words.slice(0, 5).join(', ')}${words.length > 5 ? ` (+${words.length - 5} more)` : ''} |`
).join('\n')}`;
  }
  
  /**
   * Create complete markdown sections for text analysis
   * @param text Text to analyze
   * @param topN Number of most frequent words to analyze
   * @returns Object with markdown sections for word frequency and stem analysis
   */
  static generateTextAnalysisMarkdown(text: string, topN: number = 50): {
    wordFrequencySection: string;
    stemFrequencySection: string;
  } {
    let wordFrequencySection = '';
    let stemFrequencySection = '';
    
    if (text) {
      // Word frequency analysis
      const wordFrequency = this.analyzeWordFrequency(text, topN);
      if (wordFrequency.length > 0) {
        const totalAnalyzedWords = this.prepareText(text).length;
        wordFrequencySection = `## Word Repetition Analysis (Top ${topN})
Analyzed words after filtering: ${totalAnalyzedWords}

${this.generateWordFrequencyTable(wordFrequency)}
`;
      }

      // Stem frequency analysis
      const stemFrequency = this.analyzeStemFrequency(text, topN);
      if (stemFrequency.length > 0) {
        stemFrequencySection = `## Stem Analysis (Top ${topN})
${this.generateStemFrequencyTable(stemFrequency)}
`;
      }
    }
    
    return {
      wordFrequencySection,
      stemFrequencySection
    };
  }
}
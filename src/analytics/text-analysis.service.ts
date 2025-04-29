import { Injectable, Logger } from '@nestjs/common';
import keyword_extractor from 'keyword-extractor';
// import * as keyword_extractor from 'keyword-extractor';

interface TopicMatch {
  topic: string;
  weight: number;
}

interface ExtractedKeyword {
  keyword: string;
  count: number;
  weight: number;
}

@Injectable()
export class TextAnalysisService {
  private readonly logger = new Logger(TextAnalysisService.name);

  // Dictionary of topics with related keywords and synonyms
  private readonly topicDictionary: Record<string, string[]> = {
    // Add your topic dictionary here
  };

  /**
   * Extract topics from a text description and assign weights
   * @param description User-provided text description
   * @returns Array of topics with weights
   */
  extractTopicsFromText(description: string): TopicMatch[] {
    if (!description || typeof description !== 'string') {
      return [];
    }

    const topicMatches: TopicMatch[] = [];
    const words = description.toLowerCase().split(/\s+/);

    for (const topic in this.topicDictionary) {
      const keywords = this.topicDictionary[topic];
      let weight = 0;

      for (const keyword of keywords) {
        const occurrences = words.filter(word => word === keyword).length;
        weight += occurrences;
      }

      if (weight > 0) {
        topicMatches.push({ topic, weight });
      }
    }

    return topicMatches.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Extract keywords from text description to use as tags
   * @param description User-provided text description
   * @param options Configuration options
   * @returns Array of keywords with weights
   */
  extractKeywordsFromText(
    description: string,
    options: {
      maxKeywords?: number;
      minKeywordLength?: number;
      maxKeywordLength?: number;
      minWeight?: number;
      removeStopwords?: boolean;
    } = {}
  ): ExtractedKeyword[] {
    if (!description || typeof description !== 'string') {
      return [];
    }

    // Set default options
    const {
      maxKeywords = 10,
      minKeywordLength = 3,
      maxKeywordLength = 20,
      minWeight = 0.5,
      removeStopwords = true,
    } = options;

    // Extract keywords using the keyword-extractor library
    const extraction_result = keyword_extractor.extract(description, {
      language: "english",
      remove_digits: true,
      return_changed_case: true,
      remove_duplicates: false,
      return_chained_words: true,
      stopwords: removeStopwords ? keyword_extractor.getStopwords({ language: "english" }) : [],
    });

    // Count occurrences of each keyword
    const keywordCounts: Record<string, number> = {};
    extraction_result.forEach(keyword => {
      // Filter by keyword length
      if (keyword.length >= minKeywordLength && keyword.length <= maxKeywordLength) {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      }
    });

    // Calculate weights and create result array
    const totalWords = description.split(/\s+/).length;
    const results: ExtractedKeyword[] = Object.entries(keywordCounts)
      .map(([keyword, count]) => {
        // Calculate weight based on frequency and text length
        const weight = Math.min(3, (count * 5) / Math.max(5, totalWords));

        return {
          keyword,
          count,
          weight
        };
      })
      // Filter keywords by minimum weight
      .filter(item => item.weight >= minWeight)
      // Sort by weight (highest first)
      .sort((a, b) => b.weight - a.weight)
      // Limit to maximum number of keywords
      .slice(0, maxKeywords);

    return results;
  }
}
import { Document } from "@shared/schema";

interface EntityExtraction {
  text: string;
  label: string;
  start: number;
  end: number;
  confidence?: number;
}


interface RelationshipExtraction {
  source: string;
  target: string;
  relationship: string;
  confidence?: number;
}

export class NLPService {
  // Simple entity extraction using regex patterns
  // In a real implementation, you would use spaCy or similar NLP library
  private entityPatterns = {
    PERSON: [
      /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // John Smith pattern
      /\b(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.) ([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // Title + Name
    ],
    ORG: [
      /\b([A-Z][a-z]+ (?:University|College|Institute|Corporation|Company|Inc\.|LLC|Ltd\.))\b/g,
      /\b([A-Z][A-Z]+ [A-Z][a-z]+)\b/g, // Acronym + word
    ],
    GPE: [
      /\b([A-Z][a-z]+ (?:City|State|Country|Province|County))\b/g,
      /\b(United States|United Kingdom|New York|California|London|Paris|Tokyo)\b/g,
    ],
    DATE: [
      /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/g,
    ]
  };

  private relationshipPatterns = [
    {
      pattern: /(.+?) (?:works for|employed by|works at) (.+?)(?:\.|,|;|$)/gi,
      type: 'WORKS_FOR'
    },
    {
      pattern: /(.+?) (?:founded|established|created) (.+?)(?:\.|,|;|$)/gi,
      type: 'FOUNDED'
    },
    {
      pattern: /(.+?) (?:located in|based in|situated in) (.+?)(?:\.|,|;|$)/gi,
      type: 'LOCATED_IN'
    },
    {
      pattern: /(.+?) (?:collaborated with|worked with|partnered with) (.+?)(?:\.|,|;|$)/gi,
      type: 'COLLABORATED_WITH'
    },
    {
      pattern: /(.+?) (?:graduated from|studied at|attended) (.+?)(?:\.|,|;|$)/gi,
      type: 'EDUCATED_AT'
    }
  ];

  async extractEntities(text: string, title: string): Promise<EntityExtraction[]> {
    const entities: EntityExtraction[] = [];
    const processedText = text.substring(0, 10000); // Limit text length for performance

    // Extract entities using patterns
    Object.entries(this.entityPatterns).forEach(([label, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(processedText)) !== null) {
          const entityText = match[1] || match[0];
          if (entityText && entityText.length > 2 && entityText.length < 100) {
            entities.push({
              text: entityText.trim(),
              label,
              start: match.index,
              end: match.index + entityText.length,
              confidence: 0.8
            });
          }
        }
      });
    });

    // Add title as an entity if it looks like a proper noun
    if (title && /^[A-Z]/.test(title)) {
      entities.push({
        text: title,
        label: 'TOPIC',
        start: 0,
        end: title.length,
        confidence: 0.9
      });
    }

    // Remove duplicates and sort by confidence
    const uniqueEntities = Array.from(
      new Map(entities.map(e => [e.text.toLowerCase(), e])).values()
    );

    return uniqueEntities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  async extractRelationships(text: string, pageTitle: string): Promise<RelationshipExtraction[]> {
    const relationships: RelationshipExtraction[] = [];
    const processedText = text.substring(0, 5000); // Limit for performance

    this.relationshipPatterns.forEach(({ pattern, type }) => {
      let match;
      while ((match = pattern.exec(processedText)) !== null) {
        const source = match[1]?.trim();
        const target = match[2]?.trim();
        
        if (source && target && source.length > 2 && target.length > 2) {
          relationships.push({
            source: source,
            target: target,
            relationship: type,
            confidence: 0.7
          });
        }
      }
    });

    // Add relationships involving the page title
    if (pageTitle) {
      const sentences = processedText.split(/[.!?]+/);
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        const lowerTitle = pageTitle.toLowerCase();
        
        if (lowerSentence.includes(lowerTitle)) {
          // Look for simple patterns
          if (lowerSentence.includes('born in') || lowerSentence.includes('from')) {
            const locationMatch = sentence.match(/(?:born in|from) ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/);
            if (locationMatch) {
              relationships.push({
                source: pageTitle,
                target: locationMatch[1],
                relationship: 'BORN_IN',
                confidence: 0.8
              });
            }
          }
        }
      });
    }

    return relationships.filter((rel, index, self) => 
      index === self.findIndex(r => 
        r.source === rel.source && r.target === rel.target && r.relationship === rel.relationship
      )
    );
  }

  async processDocument(document: Document): Promise<{
    entities: EntityExtraction[];
    relationships: RelationshipExtraction[];
  }> {
    try {
      const [entities, relationships] = await Promise.all([
        this.extractEntities(document.content, document.title),
        this.extractRelationships(document.content, document.title)
      ]);

      return { entities, relationships };
    } catch (error) {
      console.error('Error processing document:', error);
      return { entities: [], relationships: [] };
    }
  }

  async performSentimentAnalysis(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
  }> {
    // Simple sentiment analysis using word lists
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'worst', 'disappointing'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', score: 0 };
    }

    const score = (positiveCount - negativeCount) / total;
    
    if (score > 0.1) {
      return { sentiment: 'positive', score };
    } else if (score < -0.1) {
      return { sentiment: 'negative', score };
    } else {
      return { sentiment: 'neutral', score };
    }
  }

  async extractTopics(documents: Document[]): Promise<Array<{
    topic: string;
    keywords: string[];
    documentCount: number;
  }>> {
    // Simple topic modeling using keyword frequency
    const allText = documents.map(doc => doc.content).join(' ');
    const words = allText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    // Get top keywords
    const topWords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    // Group into topics (simplified)
    const topics = [
      {
        topic: 'Technology',
        keywords: topWords.filter(word => 
          ['technology', 'computer', 'software', 'digital', 'internet', 'data'].some(tech => 
            word.includes(tech)
          )
        ),
        documentCount: documents.length
      },
      {
        topic: 'Science',
        keywords: topWords.filter(word => 
          ['research', 'study', 'analysis', 'theory', 'experiment', 'discovery'].some(sci => 
            word.includes(sci)
          )
        ),
        documentCount: documents.length
      }
    ].filter(topic => topic.keywords.length > 0);

    return topics;
  }
}

export const nlpService = new NLPService();

import { QAQuery, Document, Entity, Relationship } from "@shared/schema";
import { graphBuilderService } from "./graph-builder.js";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  queryGenerated?: string;
}

interface QAResponse {
  answer: string;
  sources: string[];
  relatedEntities: string[];
  suggestedQuestions: string[];
  cypherQuery?: string;
  confidence: number;
}

export class QAEngineService {
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  async answerQuery(
    query: QAQuery,
    documents: Document[],
    entities: Entity[],
    relationships: Relationship[]
  ): Promise<QAResponse> {
    try {
      // Build context from knowledge graph
      const context = await this.buildContext(query, documents, entities, relationships);
      
      // Generate response using OpenAI
      const response = await this.generateResponse(query, context);
      
      return response;
    } catch (error) {
      console.error('Error in QA engine:', error);
      return {
        answer: 'I apologize, but I encountered an error while processing your question. Please try again or rephrase your query.',
        sources: [],
        relatedEntities: [],
        suggestedQuestions: [],
        confidence: 0
      };
    }
  }

  private async buildContext(
    query: QAQuery,
    documents: Document[],
    entities: Entity[],
    relationships: Relationship[]
  ): Promise<string> {
    const queryWords = query.query.toLowerCase().split(/\s+/);
    
    // Find relevant entities
    const relevantEntities = entities.filter(entity =>
      queryWords.some(word => entity.name.toLowerCase().includes(word)) ||
      queryWords.some(word => word.includes(entity.name.toLowerCase()))
    ).slice(0, 10);

    // Find relevant relationships
    const entityNames = new Set(relevantEntities.map(e => e.name));
    const relevantRelationships = relationships.filter(rel =>
      entityNames.has(rel.sourceEntity) || entityNames.has(rel.targetEntity)
    ).slice(0, 20);

    // Find relevant documents
    const relevantDocuments = documents.filter(doc =>
      queryWords.some(word => 
        doc.title.toLowerCase().includes(word) ||
        doc.content.toLowerCase().includes(word)
      )
    ).slice(0, 5);

    // Build context string
    let context = "Based on the following knowledge graph and documents:\n\n";

    if (relevantEntities.length > 0) {
      context += "Relevant Entities:\n";
      relevantEntities.forEach(entity => {
        context += `- ${entity.name} (${entity.type}): mentioned ${entity.frequency || 1} times\n`;
      });
      context += "\n";
    }

    if (relevantRelationships.length > 0) {
      context += "Relevant Relationships:\n";
      relevantRelationships.forEach(rel => {
        context += `- ${rel.sourceEntity} ${rel.relationshipType} ${rel.targetEntity}\n`;
      });
      context += "\n";
    }

    if (relevantDocuments.length > 0) {
      context += "Relevant Document Excerpts:\n";
      relevantDocuments.forEach(doc => {
        const excerpt = this.extractRelevantExcerpt(doc.content, queryWords);
        context += `From "${doc.title}": ${excerpt}\n\n`;
      });
    }

    return context;
  }

  private extractRelevantExcerpt(content: string, queryWords: string[]): string {
    const sentences = content.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence =>
      queryWords.some(word => sentence.toLowerCase().includes(word))
    );

    if (relevantSentences.length === 0) {
      return content.substring(0, 200) + '...';
    }

    return relevantSentences.slice(0, 3).join('. ').substring(0, 300) + '...';
  }

  private async generateResponse(query: QAQuery, context: string): Promise<QAResponse> {
    if (!this.OPENAI_API_KEY) {
      return this.generateFallbackResponse(query, context);
    }

    try {
      const messages = [
        {
          role: 'system' as const,
          content: `You are an AI assistant that answers questions based on a knowledge graph and scraped documents. 
          Provide accurate, well-sourced answers. If generating Cypher queries, make them syntactically correct.
          Always include relevant entities and suggest follow-up questions.`
        },
        {
          role: 'user' as const,
          content: `Context: ${context}\n\nQuestion: ${query.query}\n\n${query.generateCypher ? 'Please also provide a Cypher query to find this information.' : ''}`
        }
      ];

      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          temperature: query.temperature,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'No response generated.';

      return this.parseResponse(answer, context);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackResponse(query, context);
    }
  }

  private generateFallbackResponse(query: QAQuery, context: string): QAResponse {
    // Simple keyword-based response when OpenAI is not available
    const queryLower = query.query.toLowerCase();
    
    // Extract entities mentioned in the query
    const mentionedEntities = this.extractEntitiesFromText(context, queryLower);
    
    // Generate basic response
    let answer = "Based on the available data, ";
    
    if (mentionedEntities.length > 0) {
      answer += `I found information about: ${mentionedEntities.join(', ')}. `;
    }
    
    if (queryLower.includes('what') || queryLower.includes('who') || queryLower.includes('where')) {
      answer += "Please refer to the source documents for detailed information.";
    } else if (queryLower.includes('how many') || queryLower.includes('count')) {
      answer += `There are ${mentionedEntities.length} relevant entities in the knowledge graph.`;
    } else {
      answer += "The information is available in the scraped documents. Please check the data management section for more details.";
    }

    const cypherQuery = query.generateCypher ? this.generateBasicCypher(mentionedEntities) : undefined;

    return {
      answer,
      sources: ['Knowledge Graph', 'Scraped Documents'],
      relatedEntities: mentionedEntities,
      suggestedQuestions: [
        'What are the most connected entities?',
        'Show me relationships between organizations and people',
        'What information do we have about this topic?'
      ],
      cypherQuery,
      confidence: 0.6
    };
  }

  private extractEntitiesFromText(context: string, query: string): string[] {
    const entities: string[] = [];
    const lines = context.split('\n');
    
    lines.forEach(line => {
      if (line.startsWith('- ') && line.includes('(')) {
        const entityMatch = line.match(/- ([^(]+)/);
        if (entityMatch) {
          const entityName = entityMatch[1].trim();
          if (query.includes(entityName.toLowerCase())) {
            entities.push(entityName);
          }
        }
      }
    });

    return entities;
  }

  private generateBasicCypher(entities: string[]): string {
    if (entities.length === 0) {
      return "MATCH (n:Entity) RETURN n.name, n.type LIMIT 10;";
    }

    if (entities.length === 1) {
      return `MATCH (n:Entity {name: "${entities[0]}"}) RETURN n;`;
    }

    return `MATCH (a:Entity)-[r]-(b:Entity) WHERE a.name IN [${entities.map(e => `"${e}"`).join(', ')}] RETURN a, r, b;`;
  }

  private parseResponse(answer: string, context: string): QAResponse {
    // Extract Cypher query if present
    const cypherMatch = answer.match(/```(?:cypher|sql)?\n([\s\S]*?)```/i);
    const cypherQuery = cypherMatch ? cypherMatch[1].trim() : undefined;

    // Remove Cypher from main answer
    const cleanAnswer = answer.replace(/```(?:cypher|sql)?\n[\s\S]*?```/gi, '').trim();

    // Extract mentioned entities
    const relatedEntities = this.extractEntitiesFromAnswer(cleanAnswer, context);

    // Generate suggested questions
    const suggestedQuestions = this.generateSuggestedQuestions(cleanAnswer);

    return {
      answer: cleanAnswer,
      sources: ['Knowledge Graph', 'Scraped Documents'],
      relatedEntities,
      suggestedQuestions,
      cypherQuery,
      confidence: 0.8
    };
  }

  private extractEntitiesFromAnswer(answer: string, context: string): string[] {
    const entities: string[] = [];
    const contextLines = context.split('\n');
    
    contextLines.forEach(line => {
      if (line.startsWith('- ') && line.includes('(')) {
        const entityMatch = line.match(/- ([^(]+)/);
        if (entityMatch) {
          const entityName = entityMatch[1].trim();
          if (answer.toLowerCase().includes(entityName.toLowerCase())) {
            entities.push(entityName);
          }
        }
      }
    });

    return [...new Set(entities)];
  }

  private generateSuggestedQuestions(answer: string): string[] {
    const suggestions = [
      "What other entities are related to this?",
      "Can you show me the relationships in a graph?",
      "What documents contain this information?",
      "Are there any patterns in the data?",
      "How is this connected to other topics?"
    ];

    return suggestions.slice(0, 3);
  }

  async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    // In a real implementation, this would fetch from database
    return [];
  }

  async addMessageToChat(conversationId: string, message: ChatMessage): Promise<void> {
    // In a real implementation, this would save to database
    console.log(`Adding message to conversation ${conversationId}:`, message);
  }
}

export const qaEngineService = new QAEngineService();

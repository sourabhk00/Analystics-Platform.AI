import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { Document as LangchainDocument } from '@langchain/core/documents';
import { VectorStore } from '@langchain/core/vectorstores';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { neo4jService } from './neo4j-service.js';

interface LangGraphNode {
  id: string;
  type: 'retriever' | 'analyzer' | 'synthesizer' | 'validator';
  processor: (input: any) => Promise<any>;
}

interface LangGraphEdge {
  from: string;
  to: string;
  condition?: (input: any) => boolean;
}

class LangChainService {
  private llm: BaseLanguageModel;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: VectorStore | null = null;
  private graphNodes: Map<string, LangGraphNode> = new Map();
  private graphEdges: LangGraphEdge[] = [];

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey,
      temperature: 0.7,
      modelName: 'gpt-4',
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
    });

    this.initializeLangGraph();
  }

  private initializeLangGraph(): void {
    // Define processing nodes for the LangGraph workflow
    this.graphNodes.set('retriever', {
      id: 'retriever',
      type: 'retriever',
      processor: this.retrieveRelevantDocuments.bind(this)
    });

    this.graphNodes.set('analyzer', {
      id: 'analyzer',
      type: 'analyzer', 
      processor: this.analyzeDocuments.bind(this)
    });

    this.graphNodes.set('synthesizer', {
      id: 'synthesizer',
      type: 'synthesizer',
      processor: this.synthesizeResponse.bind(this)
    });

    this.graphNodes.set('validator', {
      id: 'validator',
      type: 'validator',
      processor: this.validateResponse.bind(this)
    });

    // Define the processing flow
    this.graphEdges = [
      { from: 'retriever', to: 'analyzer' },
      { from: 'analyzer', to: 'synthesizer' },
      { from: 'synthesizer', to: 'validator' }
    ];
  }

  async initializeVectorStore(documents: any[]): Promise<void> {
    const langchainDocs = documents.map(doc => new LangchainDocument({
      pageContent: doc.content,
      metadata: {
        id: doc.id,
        title: doc.title,
        url: doc.url,
        projectId: doc.projectId
      }
    }));

    this.vectorStore = await MemoryVectorStore.fromDocuments(
      langchainDocs,
      this.embeddings
    );
  }

  async processQueryWithLangGraph(query: string, projectId: string): Promise<any> {
    let currentInput = { query, projectId, documents: [], analysis: null, response: null };
    
    // Execute the LangGraph workflow
    for (const node of this.graphNodes.values()) {
      currentInput = await node.processor(currentInput);
    }

    return currentInput;
  }

  private async retrieveRelevantDocuments(input: any): Promise<any> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const relevantDocs = await this.vectorStore.similaritySearch(input.query, 5);
    
    return {
      ...input,
      documents: relevantDocs
    };
  }

  private async analyzeDocuments(input: any): Promise<any> {
    const analysisPrompt = PromptTemplate.fromTemplate(`
      Analyze the following documents for key entities, relationships, and insights relevant to the query: "{query}"
      
      Documents:
      {documents}
      
      Provide:
      1. Key entities mentioned
      2. Important relationships
      3. Main themes and patterns
      4. Relevant insights
      
      Analysis:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: analysisPrompt
    });

    const documentTexts = input.documents.map((doc: any) => 
      `Title: ${doc.metadata.title}\nContent: ${doc.pageContent.slice(0, 1000)}...`
    ).join('\n\n');

    const analysis = await chain.call({
      query: input.query,
      documents: documentTexts
    });

    return {
      ...input,
      analysis: analysis.text
    };
  }

  private async synthesizeResponse(input: any): Promise<any> {
    // Get graph context if Neo4j is available
    let graphContext = '';
    if (neo4jService.isAvailable()) {
      try {
        const cypherQuery = await neo4jService.generateCypherForQuery(input.query, input.projectId);
        const graphResults = await neo4jService.executeCypherQuery(cypherQuery, { projectId: input.projectId });
        graphContext = `Graph Analysis:\n${JSON.stringify(graphResults, null, 2)}`;
      } catch (error) {
        console.log('Graph analysis not available:', error.message);
      }
    }

    const synthesisPrompt = PromptTemplate.fromTemplate(`
      Based on the document analysis and graph context, provide a comprehensive answer to: "{query}"
      
      Document Analysis:
      {analysis}
      
      {graphContext}
      
      Provide a detailed, accurate response that:
      1. Directly answers the question
      2. Includes specific evidence from the documents
      3. Incorporates graph relationships where relevant
      4. Suggests follow-up questions
      5. Provides confidence level (0-1)
      
      Response:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: synthesisPrompt
    });

    const response = await chain.call({
      query: input.query,
      analysis: input.analysis,
      graphContext: graphContext || 'No graph context available'
    });

    return {
      ...input,
      response: response.text
    };
  }

  private async validateResponse(input: any): Promise<any> {
    const validationPrompt = PromptTemplate.fromTemplate(`
      Evaluate the quality and accuracy of this response to the query: "{query}"
      
      Response to validate:
      {response}
      
      Based on the original documents and analysis:
      {analysis}
      
      Provide:
      1. Accuracy score (0-1)
      2. Completeness score (0-1)
      3. Any factual errors or concerns
      4. Suggested improvements
      5. Overall confidence level
      
      Validation:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: validationPrompt
    });

    const validation = await chain.call({
      query: input.query,
      response: input.response,
      analysis: input.analysis
    });

    return {
      ...input,
      validation: validation.text,
      finalResponse: input.response
    };
  }

  async generateEntityExtraction(text: string): Promise<any[]> {
    const extractionPrompt = PromptTemplate.fromTemplate(`
      Extract entities and their relationships from the following text:
      
      Text: {text}
      
      Return a JSON array of entities with the format:
      [
        {
          "name": "entity name",
          "type": "PERSON|ORG|GPE|TOPIC|DATE|LOCATION",
          "mentions": number_of_mentions,
          "relationships": [
            {
              "target": "other entity name",
              "type": "relationship type",
              "description": "brief description"
            }
          ]
        }
      ]
      
      Entities:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: extractionPrompt
    });

    const result = await chain.call({ text });
    
    try {
      return JSON.parse(result.text);
    } catch (error) {
      console.error('Failed to parse entity extraction result:', error);
      return [];
    }
  }

  async generateCypherQuery(naturalLanguageQuery: string, projectId: string): Promise<string> {
    const cypherPrompt = PromptTemplate.fromTemplate(`
      Convert this natural language query into a Cypher query for Neo4j:
      
      Query: {query}
      Project ID: {projectId}
      
      The graph has:
      - Entity nodes with properties: name, type, frequency, projectId
      - RELATES relationships with properties: type, projectId
      
      Entity types include: PERSON, ORG, GPE, LOCATION, TOPIC, DATE, NORP
      
      Return only the Cypher query without explanation:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: cypherPrompt
    });

    const result = await chain.call({
      query: naturalLanguageQuery,
      projectId
    });

    return result.text.trim();
  }

  async summarizeProject(projectId: string, documents: any[]): Promise<string> {
    const summaryPrompt = PromptTemplate.fromTemplate(`
      Create a comprehensive summary of this web scraping project:
      
      Project ID: {projectId}
      Number of documents: {documentCount}
      
      Key content themes:
      {documentSample}
      
      Provide:
      1. Main topics and themes discovered
      2. Key entities and their significance  
      3. Relationship patterns
      4. Notable insights
      5. Data quality assessment
      
      Summary:
    `);

    const chain = new LLMChain({
      llm: this.llm,
      prompt: summaryPrompt
    });

    const documentSample = documents.slice(0, 5).map(doc => 
      `${doc.title}: ${doc.content.slice(0, 200)}...`
    ).join('\n\n');

    const result = await chain.call({
      projectId,
      documentCount: documents.length,
      documentSample
    });

    return result.text;
  }
}

export const langchainService = new LangChainService();
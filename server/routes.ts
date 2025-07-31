import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { scraperService } from "./services/scraper.js";
import { nlpService } from "./services/nlp.js";
import { graphBuilderService } from "./services/graph-builder.js";
import { qaEngineService } from "./services/qa-engine.js";
import { 
  scrapingConfigSchema, 
  qaQuerySchema, 
  exportRequestSchema,
  insertProjectSchema 
} from "@shared/schema.js";
import { WebSocketServer } from 'ws';

// Helper function for CSV generation
function generateCSV(documents: any[], exportRequest: any): string {
  const headers = ['URL', 'Title', 'Word Count', 'Created At'];
  if (exportRequest.includeContent) headers.push('Content');
  
  const rows = documents.map(doc => {
    const row = [
      doc.url || '',
      doc.title || '',
      doc.wordCount || 0,
      doc.createdAt ? new Date(doc.createdAt).toISOString() : ''
    ];
    if (exportRequest.includeContent) {
      row.push(doc.content ? doc.content.replace(/"/g, '""') : '');
    }
    return row;
  });

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws' // Use a specific path for our WebSocket to avoid conflicts
  });

  // WebSocket for real-time updates
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected clients
  const broadcast = (message: any) => {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(message));
      }
    });
  };

  // Projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const domain = scraperService.getDomain(projectData.baseUrl);
      
      const project = await storage.createProject({
        ...projectData,
        domain,
        status: 'pending'
      });
      
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: 'Invalid project data' });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete project' });
    }
  });

  // Scraping
  app.post('/api/scrape/start', async (req, res) => {
    try {
      const config = scrapingConfigSchema.parse(req.body);
      const domain = scraperService.getDomain(config.targetUrl);
      
      // Create project
      const project = await storage.createProject({
        name: `Scraping ${domain}`,
        baseUrl: config.targetUrl,
        domain,
        maxDepth: config.maxDepth,
        maxWorkers: config.maxWorkers,
        delay: config.delay,
        status: 'running',
        nlpOptions: {
          extractEntities: config.extractEntities,
          buildRelationships: config.buildRelationships,
          sentimentAnalysis: config.sentimentAnalysis,
          topicModeling: config.topicModeling
        }
      });

      res.json({ projectId: project.id, status: 'started' });

      // Start scraping in background
      (async () => {
        try {
          let processedCount = 0;
          let successCount = 0;
          let errorCount = 0;

          for await (const scrapedPage of scraperService.scrapeWebsite(config, (progress) => {
            processedCount = progress.totalProcessed;
            if (progress.status === 'success') successCount++;
            else errorCount++;

            // Update project progress
            storage.updateProject(project.id, {
              processedUrls: processedCount,
              successfulUrls: successCount,
              failedUrls: errorCount
            });

            // Broadcast progress
            broadcast({
              type: 'scraping_progress',
              projectId: project.id,
              ...progress,
              totalProcessed: processedCount,
              successCount,
              errorCount
            });
          })) {
            // Save document
            const document = await storage.createDocument({
              projectId: project.id,
              url: scrapedPage.url,
              title: scrapedPage.title,
              content: scrapedPage.content,
              wordCount: scrapedPage.wordCount,
              depth: scrapedPage.depth,
              category: scrapedPage.category,
              links: scrapedPage.links,
              images: scrapedPage.images,
              entities: [],
              relationships: []
            });

            // Process with NLP if enabled
            if (config.extractEntities || config.buildRelationships) {
              const nlpResults = await nlpService.processDocument(document);
              
              // Save entities
              for (const entityData of nlpResults.entities) {
                const existingEntity = (await storage.getEntitiesByProject(project.id))
                  .find(e => e.name === entityData.text && e.type === entityData.label);

                if (existingEntity) {
                  await storage.updateEntity(existingEntity.id, {
                    frequency: (existingEntity.frequency || 1) + 1,
                    documentIds: [...(existingEntity.documentIds as string[] || []), document.id]
                  });
                } else {
                  await storage.createEntity({
                    projectId: project.id,
                    name: entityData.text,
                    type: entityData.label,
                    frequency: 1,
                    documentIds: [document.id]
                  });
                }
              }

              // Save relationships
              for (const relData of nlpResults.relationships) {
                await storage.createRelationship({
                  projectId: project.id,
                  sourceEntity: relData.source,
                  targetEntity: relData.target,
                  relationshipType: relData.relationship,
                  documentId: document.id
                });
              }

              // Update document with extracted data
              await storage.updateDocument(document.id, {
                entities: nlpResults.entities,
                relationships: nlpResults.relationships
              });
            }

            broadcast({
              type: 'document_processed',
              projectId: project.id,
              document: {
                id: document.id,
                title: document.title,
                url: document.url,
                entityCount: scrapedPage.wordCount
              }
            });
          }

          // Mark project as completed
          await storage.updateProject(project.id, { status: 'completed' });
          broadcast({
            type: 'scraping_completed',
            projectId: project.id
          });

        } catch (error) {
          console.error('Scraping error:', error);
          await storage.updateProject(project.id, { status: 'failed' });
          broadcast({
            type: 'scraping_error',
            projectId: project.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      })();

    } catch (error) {
      res.status(400).json({ message: 'Invalid scraping configuration' });
    }
  });

  // Documents
  app.get('/api/projects/:id/documents', async (req, res) => {
    try {
      const { search } = req.query;
      let documents;
      
      if (search) {
        documents = await storage.searchDocuments(req.params.id, search as string);
      } else {
        documents = await storage.getDocumentsByProject(req.params.id);
      }
      
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch documents' });
    }
  });

  app.get('/api/documents/:id', async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch document' });
    }
  });

  // Knowledge Graph
  app.get('/api/projects/:id/graph', async (req, res) => {
    try {
      const entities = await storage.getEntitiesByProject(req.params.id);
      const relationships = await storage.getRelationshipsByProject(req.params.id);
      const documents = await storage.getDocumentsByProject(req.params.id);
      
      const graphData = await graphBuilderService.buildGraph(entities, relationships, documents);
      res.json(graphData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to build graph' });
    }
  });

  app.post('/api/projects/:id/graph/filter', async (req, res) => {
    try {
      const entities = await storage.getEntitiesByProject(req.params.id);
      const relationships = await storage.getRelationshipsByProject(req.params.id);
      const documents = await storage.getDocumentsByProject(req.params.id);
      
      const graphData = await graphBuilderService.buildGraph(entities, relationships, documents);
      const filteredGraph = await graphBuilderService.filterGraph(graphData, req.body);
      
      res.json(filteredGraph);
    } catch (error) {
      res.status(500).json({ message: 'Failed to filter graph' });
    }
  });

  app.get('/api/projects/:id/graph/node/:nodeId/neighbors', async (req, res) => {
    try {
      const entities = await storage.getEntitiesByProject(req.params.id);
      const relationships = await storage.getRelationshipsByProject(req.params.id);
      const documents = await storage.getDocumentsByProject(req.params.id);
      
      const graphData = await graphBuilderService.buildGraph(entities, relationships, documents);
      const neighbors = await graphBuilderService.getNodeNeighbors(
        req.params.nodeId, 
        graphData, 
        parseInt(req.query.depth as string) || 1
      );
      
      res.json(neighbors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get node neighbors' });
    }
  });

  // Statistics
  app.get('/api/projects/:id/stats', async (req, res) => {
    try {
      const stats = await storage.getProjectStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Q&A Engine
  app.post('/api/qa/query', async (req, res) => {
    try {
      const query = qaQuerySchema.parse(req.body);
      
      const documents = await storage.getDocumentsByProject(query.projectId);
      const entities = await storage.getEntitiesByProject(query.projectId);
      const relationships = await storage.getRelationshipsByProject(query.projectId);
      
      const response = await qaEngineService.answerQuery(query, documents, entities, relationships);
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: 'Invalid query' });
    }
  });

  // Exports
  app.post('/api/projects/:id/export', async (req, res) => {
    try {
      const exportRequest = exportRequestSchema.parse(req.body);
      
      const exportRecord = await storage.createExport({
        projectId: req.params.id,
        format: exportRequest.format,
        fileName: `export_${Date.now()}.${exportRequest.format}`,
        status: 'generating'
      });

      res.json({ exportId: exportRecord.id, status: 'generating' });

      // Generate export in background
      (async () => {
        try {
          let fileContent = '';
          let fileSize = 0;

          const documents = await storage.getDocumentsByProject(req.params.id);
          const entities = await storage.getEntitiesByProject(req.params.id);
          const relationships = await storage.getRelationshipsByProject(req.params.id);

          switch (exportRequest.format) {
            case 'csv':
              fileContent = generateCSV(documents, exportRequest);
              break;
            case 'json':
              fileContent = JSON.stringify({
                documents: exportRequest.includeContent ? documents : documents.map(d => ({ ...d, content: undefined })),
                entities: exportRequest.includeRelationships ? entities : [],
                relationships: exportRequest.includeRelationships ? relationships : []
              }, null, 2);
              break;
            case 'cypher':
              const graphData = await graphBuilderService.buildGraph(entities, relationships, documents);
              fileContent = await graphBuilderService.generateCypherQuery(graphData, 'all');
              break;
          }

          fileSize = Buffer.byteLength(fileContent, 'utf8');
          
          await storage.updateExport(exportRecord.id, {
            status: 'ready',
            fileSize,
            downloadUrl: `/api/exports/${exportRecord.id}/download`
          });

          // Store file content temporarily (in production, use file system or cloud storage)
          (global as any).exportFiles = (global as any).exportFiles || new Map();
          (global as any).exportFiles.set(exportRecord.id, fileContent);

        } catch (error) {
          await storage.updateExport(exportRecord.id, { status: 'failed' });
        }
      })();

    } catch (error) {
      res.status(400).json({ message: 'Invalid export request' });
    }
  });

  app.get('/api/projects/:id/exports', async (req, res) => {
    try {
      const exports = await storage.getExportsByProject(req.params.id);
      res.json(exports);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch exports' });
    }
  });

  app.get('/api/exports/:id/download', async (req, res) => {
    try {
      const exportRecord = await storage.getExport(req.params.id);
      if (!exportRecord || exportRecord.status !== 'ready') {
        return res.status(404).json({ message: 'Export not found or not ready' });
      }

      const fileContent = (global as any).exportFiles?.get(req.params.id);
      if (!fileContent) {
        return res.status(404).json({ message: 'File content not found' });
      }

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${exportRecord.fileName}"`);
      res.send(fileContent);
    } catch (error) {
      res.status(500).json({ message: 'Failed to download export' });
    }
  });

  // Helper method for CSV generation
  function generateCSV(documents: any[], options: any): string {
    const headers = ['URL', 'Title', 'Category', 'Word Count', 'Created At'];
    if (options.includeContent) headers.push('Content');
    
    const rows = documents.map(doc => {
      const row = [
        doc.url,
        doc.title,
        doc.category || '',
        doc.wordCount || 0,
        doc.createdAt
      ];
      if (options.includeContent) row.push(doc.content || '');
      return row;
    });

    return [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }

  return httpServer;
}

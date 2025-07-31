import { 
  type Project, type InsertProject,
  type Document, type InsertDocument,
  type Entity, type InsertEntity,
  type Relationship, type InsertRelationship,
  type Conversation, type InsertConversation,
  type Export, type InsertExport
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByProject(projectId: string): Promise<Document[]>;
  searchDocuments(projectId: string, query: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;

  // Entities
  getEntity(id: string): Promise<Entity | undefined>;
  getEntitiesByProject(projectId: string): Promise<Entity[]>;
  getEntitiesByType(projectId: string, type: string): Promise<Entity[]>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity | undefined>;

  // Relationships
  getRelationship(id: string): Promise<Relationship | undefined>;
  getRelationshipsByProject(projectId: string): Promise<Relationship[]>;
  getRelationshipsByEntity(entityName: string): Promise<Relationship[]>;
  createRelationship(relationship: InsertRelationship): Promise<Relationship>;

  // Conversations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByProject(projectId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;

  // Exports
  getExport(id: string): Promise<Export | undefined>;
  getExportsByProject(projectId: string): Promise<Export[]>;
  createExport(exportRecord: InsertExport): Promise<Export>;
  updateExport(id: string, updates: Partial<Export>): Promise<Export | undefined>;

  // Statistics
  getProjectStats(projectId: string): Promise<{
    totalDocuments: number;
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project> = new Map();
  private documents: Map<string, Document> = new Map();
  private entities: Map<string, Entity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private exports: Map<string, Export> = new Map();

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      ...insertProject,
      id,
      status: insertProject.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalUrls: 0,
      processedUrls: 0,
      successfulUrls: 0,
      failedUrls: 0,
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByProject(projectId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async searchDocuments(projectId: string, query: string): Promise<Document[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.documents.values())
      .filter(doc => 
        doc.projectId === projectId && 
        (doc.title.toLowerCase().includes(lowerQuery) || 
         doc.content.toLowerCase().includes(lowerQuery) ||
         doc.url.toLowerCase().includes(lowerQuery))
      );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      projectId: insertDocument.projectId || null,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updated = { ...document, ...updates };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Entities
  async getEntity(id: string): Promise<Entity | undefined> {
    return this.entities.get(id);
  }

  async getEntitiesByProject(projectId: string): Promise<Entity[]> {
    return Array.from(this.entities.values())
      .filter(entity => entity.projectId === projectId)
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  }

  async getEntitiesByType(projectId: string, type: string): Promise<Entity[]> {
    return Array.from(this.entities.values())
      .filter(entity => entity.projectId === projectId && entity.type === type);
  }

  async createEntity(insertEntity: InsertEntity): Promise<Entity> {
    const id = randomUUID();
    const entity: Entity = {
      ...insertEntity,
      id,
      projectId: insertEntity.projectId || null,
      createdAt: new Date(),
    };
    this.entities.set(id, entity);
    return entity;
  }

  async updateEntity(id: string, updates: Partial<Entity>): Promise<Entity | undefined> {
    const entity = this.entities.get(id);
    if (!entity) return undefined;

    const updated = { ...entity, ...updates };
    this.entities.set(id, updated);
    return updated;
  }

  // Relationships
  async getRelationship(id: string): Promise<Relationship | undefined> {
    return this.relationships.get(id);
  }

  async getRelationshipsByProject(projectId: string): Promise<Relationship[]> {
    return Array.from(this.relationships.values())
      .filter(rel => rel.projectId === projectId);
  }

  async getRelationshipsByEntity(entityName: string): Promise<Relationship[]> {
    return Array.from(this.relationships.values())
      .filter(rel => rel.sourceEntity === entityName || rel.targetEntity === entityName);
  }

  async createRelationship(insertRelationship: InsertRelationship): Promise<Relationship> {
    const id = randomUUID();
    const relationship: Relationship = {
      ...insertRelationship,
      id,
      projectId: insertRelationship.projectId || null,
      createdAt: new Date(),
    };
    this.relationships.set(id, relationship);
    return relationship;
  }

  // Conversations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async getConversationsByProject(projectId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      projectId: insertConversation.projectId || null,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;

    const updated = { ...conversation, ...updates };
    this.conversations.set(id, updated);
    return updated;
  }

  // Exports
  async getExport(id: string): Promise<Export | undefined> {
    return this.exports.get(id);
  }

  async getExportsByProject(projectId: string): Promise<Export[]> {
    return Array.from(this.exports.values())
      .filter(exp => exp.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createExport(insertExport: InsertExport): Promise<Export> {
    const id = randomUUID();
    const exportRecord: Export = {
      ...insertExport,
      id,
      projectId: insertExport.projectId || null,
      status: insertExport.status || null,
      createdAt: new Date(),
    };
    this.exports.set(id, exportRecord);
    return exportRecord;
  }

  async updateExport(id: string, updates: Partial<Export>): Promise<Export | undefined> {
    const exportRecord = this.exports.get(id);
    if (!exportRecord) return undefined;

    const updated = { ...exportRecord, ...updates };
    this.exports.set(id, updated);
    return updated;
  }

  // Statistics
  async getProjectStats(projectId: string): Promise<{
    totalDocuments: number;
    totalEntities: number;
    totalRelationships: number;
    entityTypes: Record<string, number>;
    relationshipTypes: Record<string, number>;
  }> {
    const projectDocuments = await this.getDocumentsByProject(projectId);
    const projectEntities = await this.getEntitiesByProject(projectId);
    const projectRelationships = await this.getRelationshipsByProject(projectId);

    const entityTypes: Record<string, number> = {};
    projectEntities.forEach(entity => {
      entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
    });

    const relationshipTypes: Record<string, number> = {};
    projectRelationships.forEach(rel => {
      relationshipTypes[rel.relationshipType] = (relationshipTypes[rel.relationshipType] || 0) + 1;
    });

    return {
      totalDocuments: projectDocuments.length,
      totalEntities: projectEntities.length,
      totalRelationships: projectRelationships.length,
      entityTypes,
      relationshipTypes,
    };
  }
}

export const storage = new MemStorage();

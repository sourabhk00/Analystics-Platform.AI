import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";


export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  domain: text("domain").notNull(),
  maxDepth: integer("max_depth").default(3),
  maxWorkers: integer("max_workers").default(20),
  delay: integer("delay").default(1000),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  totalUrls: integer("total_urls").default(0),
  processedUrls: integer("processed_urls").default(0),
  successfulUrls: integer("successful_urls").default(0),
  failedUrls: integer("failed_urls").default(0),
  nlpOptions: jsonb("nlp_options").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  wordCount: integer("word_count").default(0),
  depth: integer("depth").default(0),
  category: text("category"),
  entities: jsonb("entities").default([]),
  relationships: jsonb("relationships").default([]),
  images: jsonb("images").default([]),
  links: jsonb("links").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const entities = pgTable("entities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // PERSON, ORG, GPE, NORP, etc.
  frequency: integer("frequency").default(1),
  documentIds: jsonb("document_ids").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const relationships = pgTable("relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  sourceEntity: text("source_entity").notNull(),
  targetEntity: text("target_entity").notNull(),
  relationshipType: text("relationship_type").notNull(),
  documentId: varchar("document_id").references(() => documents.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  messages: jsonb("messages").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exports = pgTable("exports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id),
  format: text("format").notNull(), // csv, excel, json, cypher
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  downloadUrl: text("download_url"),
  status: text("status").default("generating"), // generating, ready, expired
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalUrls: true,
  processedUrls: true,
  successfulUrls: true,
  failedUrls: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertEntitySchema = createInsertSchema(entities).omit({
  id: true,
  createdAt: true,
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertExportSchema = createInsertSchema(exports).omit({
  id: true,
  createdAt: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Entity = typeof entities.$inferSelect;
export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Export = typeof exports.$inferSelect;
export type InsertExport = z.infer<typeof insertExportSchema>;

// Additional schemas for API requests
export const scrapingConfigSchema = z.object({
  targetUrl: z.string().url(),
  maxDepth: z.number().min(1).max(5).default(3),
  maxWorkers: z.number().min(1).max(50).default(20),
  delay: z.number().min(0).max(10000).default(1000),
  extractEntities: z.boolean().default(true),
  buildRelationships: z.boolean().default(true),
  sentimentAnalysis: z.boolean().default(false),
  topicModeling: z.boolean().default(false),
});

export const qaQuerySchema = z.object({
  projectId: z.string(),
  query: z.string().min(1),
  includeGraphContext: z.boolean().default(true),
  generateCypher: z.boolean().default(false),
  temperature: z.number().min(0).max(1).default(0.3),
});

export const exportRequestSchema = z.object({
  projectId: z.string(),
  format: z.enum(["csv", "excel", "json", "cypher"]),
  includeContent: z.boolean().default(true),
  includeRelationships: z.boolean().default(true),
  includeImages: z.boolean().default(false),
  metadataOnly: z.boolean().default(false),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type ScrapingConfig = z.infer<typeof scrapingConfigSchema>;
export type QAQuery = z.infer<typeof qaQuerySchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;

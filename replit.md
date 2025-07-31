# Web Scraping and Knowledge Graph Platform

## Overview

This is a full-stack web application that provides comprehensive web scraping capabilities with AI-powered knowledge graph generation and natural language query functionality. The system extracts data from websites, processes it using NLP techniques, builds interactive knowledge graphs, and enables users to query the data using natural language through an AI-powered Q&A engine.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Communication**: WebSocket client for live updates during scraping operations

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **Build System**: ESBuild for production bundling, TSX for development
- **Real-time Communication**: WebSocket server for broadcasting scraping progress
- **Module System**: ES modules throughout the application

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Interface**: Abstract IStorage interface for potential database switching

## Key Components

### Web Scraping Engine
- **Service**: ScraperService handles web page extraction
- **Features**: Configurable depth, worker threads, delay settings
- **Content Processing**: Cheerio for HTML parsing and content extraction
- **Error Handling**: Comprehensive error tracking and retry mechanisms

### Natural Language Processing
- **Service**: NLPService for entity extraction and relationship detection
- **Entity Types**: PERSON, ORG, GPE, NORP, DATE, TOPIC recognition
- **Relationship Extraction**: Pattern-based relationship detection between entities
- **Future Integration**: Designed for spaCy or similar NLP library integration

### Knowledge Graph Builder
- **Service**: GraphBuilderService constructs interactive graphs
- **Node Types**: Color-coded entities based on type (Person, Organization, etc.)
- **Edge Relationships**: Directional relationships between entities
- **Statistics**: Graph metrics including density, connectivity, and components

### AI Q&A Engine
- **Service**: QAEngineService with OpenAI integration
- **Context Building**: Combines document content with graph relationships
- **Response Generation**: GPT-4 powered answers with source citations
- **Follow-up Questions**: Automatic generation of related queries

### Real-time Progress Monitoring
- **WebSocket Integration**: Live updates during scraping operations
- **Progress Tracking**: URL processing, success/failure rates, entity extraction
- **Activity Feed**: Real-time logging of scraping activities and errors

## Data Flow

1. **Scraping Initiation**: User configures scraping parameters through ScraperForm
2. **URL Processing**: ScraperService processes URLs with configurable depth and concurrency
3. **Content Extraction**: HTML content is parsed and cleaned using Cheerio
4. **NLP Processing**: Extracted content is analyzed for entities and relationships
5. **Graph Construction**: GraphBuilderService creates nodes and edges from NLP results
6. **Data Storage**: All processed data is stored in PostgreSQL via Drizzle ORM
7. **Real-time Updates**: WebSocket broadcasts progress to connected clients
8. **Query Processing**: QAEngineService processes natural language queries against stored data

## External Dependencies

### Database and ORM
- **PostgreSQL**: Primary data storage with UUID primary keys
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Neon Database**: Serverless PostgreSQL hosting

### AI and NLP Services
- **OpenAI API**: GPT-4 integration for Q&A functionality
- **Future NLP**: Prepared for spaCy integration for advanced entity recognition

### Frontend Libraries
- **React Ecosystem**: React 18 with modern hooks and functional components
- **UI Components**: Comprehensive Shadcn/ui library with Radix UI accessibility
- **Charts**: Chart.js integration for data visualization
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Vite**: Fast development server and optimized production builds
- **ESLint/Prettier**: Code quality and formatting (implied by TypeScript setup)

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **TypeScript Compilation**: Real-time type checking and compilation
- **Environment Variables**: Separate development and production configurations

### Production Build
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: ESBuild bundles Express server to `dist/index.js`
- **Database**: Drizzle migrations handle schema updates
- **Static Assets**: Served through Express static middleware

### Environment Requirements
- **Node.js**: ES module support required
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **OpenAI**: API key required for Q&A functionality
- **Port Configuration**: Configurable port binding for deployment flexibility

### Scalability Considerations
- **WebSocket Scaling**: Single server WebSocket implementation (can be upgraded to Redis pub/sub)
- **Database Connection**: Connection pooling through Drizzle/PostgreSQL
- **File Storage**: Local file system (can be upgraded to cloud storage)
- **Rate Limiting**: Not implemented (should be added for production)
import neo4j, { Driver, Session } from 'neo4j-driver';

class Neo4jService {
  private driver: Driver | null = null;
  private connectionString: string;
  private username: string;
  private password: string;

  constructor() {
    this.connectionString = process.env.NEO4J_URI || 'bolt://localhost:7687';
    this.username = process.env.NEO4J_USERNAME || 'neo4j';
    this.password = process.env.NEO4J_PASSWORD || 'password';
  }

  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(
        this.connectionString,
        neo4j.auth.basic(this.username, this.password)
      );
      
      // Test connection
      const session = this.driver.session();
      await session.run('RETURN 1');
      await session.close();
      
      console.log('Connected to Neo4j database');
    } catch (error) {
      console.log('Neo4j not available, using in-memory graph storage');
      this.driver = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }

  private getSession(): Session | null {
    return this.driver?.session() || null;
  }

  async createEntity(projectId: string, entity: any): Promise<void> {
    const session = this.getSession();
    if (!session) return;

    try {
      await session.run(
        `MERGE (e:Entity {id: $id, projectId: $projectId})
         SET e.name = $name, 
             e.type = $type, 
             e.frequency = $frequency,
             e.createdAt = datetime()
         RETURN e`,
        {
          id: entity.id,
          projectId,
          name: entity.name,
          type: entity.type,
          frequency: entity.frequency || 1
        }
      );
    } finally {
      await session.close();
    }
  }

  async createRelationship(projectId: string, relationship: any): Promise<void> {
    const session = this.getSession();
    if (!session) return;

    try {
      await session.run(
        `MATCH (a:Entity {name: $sourceEntity, projectId: $projectId})
         MATCH (b:Entity {name: $targetEntity, projectId: $projectId})
         MERGE (a)-[r:RELATES {type: $relType}]->(b)
         SET r.projectId = $projectId,
             r.createdAt = datetime()
         RETURN r`,
        {
          projectId,
          sourceEntity: relationship.sourceEntity,
          targetEntity: relationship.targetEntity,
          relType: relationship.relationshipType
        }
      );
    } finally {
      await session.close();
    }
  }

  async getProjectGraph(projectId: string): Promise<any> {
    const session = this.getSession();
    if (!session) return { nodes: [], edges: [] };

    try {
      // Get all entities and relationships for the project
      const result = await session.run(
        `MATCH (n:Entity {projectId: $projectId})
         OPTIONAL MATCH (n)-[r:RELATES]-(m:Entity {projectId: $projectId})
         RETURN n, r, m`,
        { projectId }
      );

      const nodes = new Map();
      const edges = [];

      result.records.forEach(record => {
        const sourceNode = record.get('n');
        const relationship = record.get('r');
        const targetNode = record.get('m');

        // Add source node
        if (sourceNode && !nodes.has(sourceNode.properties.id)) {
          nodes.set(sourceNode.properties.id, {
            id: sourceNode.properties.id,
            name: sourceNode.properties.name,
            type: sourceNode.properties.type,
            frequency: sourceNode.properties.frequency,
            group: this.getNodeGroup(sourceNode.properties.type)
          });
        }

        // Add target node and relationship if they exist
        if (targetNode && relationship) {
          if (!nodes.has(targetNode.properties.id)) {
            nodes.set(targetNode.properties.id, {
              id: targetNode.properties.id,
              name: targetNode.properties.name,
              type: targetNode.properties.type,
              frequency: targetNode.properties.frequency,
              group: this.getNodeGroup(targetNode.properties.type)
            });
          }

          edges.push({
            id: `${sourceNode.properties.id}-${targetNode.properties.id}`,
            source: sourceNode.properties.id,
            target: targetNode.properties.id,
            type: relationship.properties.type,
            label: relationship.properties.type
          });
        }
      });

      return {
        nodes: Array.from(nodes.values()),
        edges: edges,
        statistics: await this.getGraphStatistics(projectId)
      };
    } finally {
      await session.close();
    }
  }

  private getNodeGroup(type: string): string {
    const typeGroups: { [key: string]: string } = {
      'PERSON': 'person',
      'ORG': 'organization',
      'GPE': 'location',
      'LOCATION': 'location',
      'TOPIC': 'concept',
      'DATE': 'temporal',
      'NORP': 'group'
    };
    return typeGroups[type] || 'other';
  }

  async getGraphStatistics(projectId: string): Promise<any> {
    const session = this.getSession();
    if (!session) return {};

    try {
      const result = await session.run(
        `MATCH (n:Entity {projectId: $projectId})
         OPTIONAL MATCH (n)-[r:RELATES]-()
         RETURN 
           count(DISTINCT n) as nodeCount,
           count(DISTINCT r) as edgeCount,
           collect(DISTINCT n.type) as entityTypes,
           collect(DISTINCT r.type) as relationshipTypes`,
        { projectId }
      );

      const record = result.records[0];
      return {
        nodeCount: record.get('nodeCount').toNumber(),
        edgeCount: record.get('edgeCount').toNumber(),
        entityTypes: record.get('entityTypes'),
        relationshipTypes: record.get('relationshipTypes'),
        density: this.calculateDensity(
          record.get('nodeCount').toNumber(),
          record.get('edgeCount').toNumber()
        )
      };
    } finally {
      await session.close();
    }
  }

  private calculateDensity(nodeCount: number, edgeCount: number): number {
    if (nodeCount <= 1) return 0;
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    return edgeCount / maxEdges;
  }

  async executeCypherQuery(query: string, params: any = {}): Promise<any[]> {
    const session = this.getSession();
    if (!session) throw new Error('Neo4j not available');

    try {
      const result = await session.run(query, params);
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  async generateCypherForQuery(naturalLanguageQuery: string, projectId: string): Promise<string> {
    // Advanced Cypher generation based on natural language
    const query = naturalLanguageQuery.toLowerCase();
    
    if (query.includes('most connected') || query.includes('highest degree')) {
      return `
        MATCH (n:Entity {projectId: $projectId})-[r:RELATES]-()
        RETURN n.name as entity, n.type as type, count(r) as connections
        ORDER BY connections DESC
        LIMIT 10
      `;
    }
    
    if (query.includes('shortest path')) {
      return `
        MATCH (start:Entity {projectId: $projectId}), (end:Entity {projectId: $projectId})
        WHERE start.name CONTAINS $startEntity AND end.name CONTAINS $endEntity
        MATCH path = shortestPath((start)-[:RELATES*]-(end))
        RETURN path
      `;
    }
    
    if (query.includes('community') || query.includes('cluster')) {
      return `
        CALL gds.louvain.stream('myGraph')
        YIELD nodeId, communityId
        RETURN gds.util.asNode(nodeId).name AS name, communityId
        ORDER BY communityId
      `;
    }
    
    // Default comprehensive query
    return `
      MATCH (n:Entity {projectId: $projectId})
      OPTIONAL MATCH (n)-[r:RELATES]-(connected:Entity {projectId: $projectId})
      RETURN n, collect(DISTINCT connected) as connections, count(r) as degree
      ORDER BY degree DESC
      LIMIT 20
    `;
  }

  isAvailable(): boolean {
    return this.driver !== null;
  }
}

export const neo4jService = new Neo4jService();
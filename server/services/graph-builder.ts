import { Entity, Relationship, Document } from "@shared/schema";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  size?: number;
  color?: string;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  statistics: {
    nodeCount: number;
    edgeCount: number;
    connectedComponents: number;
    averageDegree: number;
    density: number;
  };
}

export class GraphBuilderService {
  private colorMap = {
    PERSON: '#3498db',
    ORG: '#2ecc71',
    GPE: '#f39c12',
    NORP: '#9b59b6',
    DATE: '#e74c3c',
    TOPIC: '#1abc9c',
    default: '#95a5a6'
  };

  async buildGraph(
    entities: Entity[], 
    relationships: Relationship[],
    documents: Document[]
  ): Promise<GraphData> {
    // Create nodes from entities
    const nodes: GraphNode[] = entities.map(entity => ({
      id: entity.name,
      label: entity.name,
      type: entity.type,
      properties: {
        frequency: entity.frequency || 1,
        documentCount: (entity.documentIds as string[])?.length || 0,
        entityId: entity.id
      },
      size: Math.max(10, Math.min(50, (entity.frequency || 1) * 2)),
      color: this.colorMap[entity.type as keyof typeof this.colorMap] || this.colorMap.default
    }));

    // Create edges from relationships
    const edges: GraphEdge[] = relationships.map((rel, index) => ({
      id: `edge_${index}`,
      from: rel.sourceEntity,
      to: rel.targetEntity,
      label: rel.relationshipType,
      type: rel.relationshipType,
      properties: {
        relationshipId: rel.id,
        documentId: rel.documentId
      }
    }));

    // Calculate statistics
    const statistics = this.calculateGraphStatistics(nodes, edges);

    return {
      nodes,
      edges,
      statistics
    };
  }

  private calculateGraphStatistics(nodes: GraphNode[], edges: GraphEdge[]): GraphData['statistics'] {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    // Calculate degree for each node
    const degrees = new Map<string, number>();
    nodes.forEach(node => degrees.set(node.id, 0));

    edges.forEach(edge => {
      degrees.set(edge.from, (degrees.get(edge.from) || 0) + 1);
      degrees.set(edge.to, (degrees.get(edge.to) || 0) + 1);
    });

    const totalDegree = Array.from(degrees.values()).reduce((sum, degree) => sum + degree, 0);
    const averageDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

    // Calculate density
    const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

    // Calculate connected components (simplified)
    const connectedComponents = this.findConnectedComponents(nodes, edges);

    return {
      nodeCount,
      edgeCount,
      connectedComponents,
      averageDegree: Math.round(averageDegree * 100) / 100,
      density: Math.round(density * 100) / 100
    };
  }

  private findConnectedComponents(nodes: GraphNode[], edges: GraphEdge[]): number {
    const visited = new Set<string>();
    let components = 0;

    const adjacencyList = new Map<string, string[]>();
    nodes.forEach(node => adjacencyList.set(node.id, []));
    
    edges.forEach(edge => {
      adjacencyList.get(edge.from)?.push(edge.to);
      adjacencyList.get(edge.to)?.push(edge.from);
    });

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighbor => dfs(neighbor));
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
        components++;
      }
    });

    return components;
  }

  async filterGraph(
    graphData: GraphData,
    filters: {
      nodeTypes?: string[];
      relationshipTypes?: string[];
      minFrequency?: number;
      searchQuery?: string;
    }
  ): Promise<GraphData> {
    let filteredNodes = graphData.nodes;
    let filteredEdges = graphData.edges;

    // Filter by node types
    if (filters.nodeTypes && filters.nodeTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => 
        filters.nodeTypes!.includes(node.type)
      );
    }

    // Filter by minimum frequency
    if (filters.minFrequency) {
      filteredNodes = filteredNodes.filter(node => 
        (node.properties.frequency || 1) >= filters.minFrequency!
      );
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(node => 
        node.label.toLowerCase().includes(query)
      );
    }

    // Filter edges to only include those between remaining nodes
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    filteredEdges = filteredEdges.filter(edge => 
      nodeIds.has(edge.from) && nodeIds.has(edge.to)
    );

    // Filter by relationship types
    if (filters.relationshipTypes && filters.relationshipTypes.length > 0) {
      filteredEdges = filteredEdges.filter(edge => 
        filters.relationshipTypes!.includes(edge.type)
      );
    }

    // Recalculate statistics
    const statistics = this.calculateGraphStatistics(filteredNodes, filteredEdges);

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      statistics
    };
  }

  async getNodeNeighbors(nodeId: string, graphData: GraphData, depth: number = 1): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
  }> {
    const visited = new Set<string>();
    const resultNodes = new Map<string, GraphNode>();
    const resultEdges = new Map<string, GraphEdge>();

    const traverse = (currentNodeId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentNodeId)) return;
      
      visited.add(currentNodeId);
      
      // Add current node
      const currentNode = graphData.nodes.find(n => n.id === currentNodeId);
      if (currentNode) {
        resultNodes.set(currentNodeId, currentNode);
      }

      // Find connected edges and nodes
      graphData.edges.forEach(edge => {
        if (edge.from === currentNodeId || edge.to === currentNodeId) {
          resultEdges.set(edge.id, edge);
          
          const neighborId = edge.from === currentNodeId ? edge.to : edge.from;
          const neighborNode = graphData.nodes.find(n => n.id === neighborId);
          
          if (neighborNode) {
            resultNodes.set(neighborId, neighborNode);
            
            if (currentDepth < depth) {
              traverse(neighborId, currentDepth + 1);
            }
          }
        }
      });
    };

    traverse(nodeId, 0);

    return {
      nodes: Array.from(resultNodes.values()),
      edges: Array.from(resultEdges.values())
    };
  }

  async generateCypherQuery(
    graphData: GraphData,
    queryType: 'all' | 'entities' | 'relationships' | 'paths'
  ): Promise<string> {
    switch (queryType) {
      case 'entities':
        return this.generateEntitiesCypher(graphData.nodes);
      
      case 'relationships':
        return this.generateRelationshipsCypher(graphData.edges);
      
      case 'paths':
        return this.generatePathsCypher(graphData);
      
      default:
        return this.generateFullGraphCypher(graphData);
    }
  }

  private generateEntitiesCypher(nodes: GraphNode[]): string {
    const queries = nodes.map(node => 
      `MERGE (${this.sanitizeLabel(node.id)}:Entity {` +
      `name: "${node.label}", ` +
      `type: "${node.type}", ` +
      `frequency: ${node.properties.frequency || 1}` +
      `})`
    );
    
    return queries.join(';\n') + ';';
  }

  private generateRelationshipsCypher(edges: GraphEdge[]): string {
    const queries = edges.map(edge => 
      `MATCH (a:Entity {name: "${edge.from}"}), (b:Entity {name: "${edge.to}"}) ` +
      `MERGE (a)-[:${edge.type}]->(b)`
    );
    
    return queries.join(';\n') + ';';
  }

  private generatePathsCypher(graphData: GraphData): string {
    return `
// Find all paths between entities
MATCH path = (a:Entity)-[*1..3]-(b:Entity)
WHERE a.name <> b.name
RETURN path
LIMIT 100;

// Find most connected entities
MATCH (n:Entity)
RETURN n.name, n.type, size((n)--()) as connections
ORDER BY connections DESC
LIMIT 20;

// Find entities by type
MATCH (n:Entity)
WHERE n.type = 'PERSON'
RETURN n.name, n.frequency
ORDER BY n.frequency DESC;
    `;
  }

  private generateFullGraphCypher(graphData: GraphData): string {
    const entitiesCypher = this.generateEntitiesCypher(graphData.nodes);
    const relationshipsCypher = this.generateRelationshipsCypher(graphData.edges);
    
    return `// Create entities\n${entitiesCypher}\n\n// Create relationships\n${relationshipsCypher}`;
  }

  private sanitizeLabel(label: string): string {
    return label.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  async exportToGEXF(graphData: GraphData): Promise<string> {
    const nodes = graphData.nodes.map(node => 
      `<node id="${node.id}" label="${node.label}">\n` +
      `  <attvalues>\n` +
      `    <attvalue for="type" value="${node.type}"/>\n` +
      `    <attvalue for="frequency" value="${node.properties.frequency || 1}"/>\n` +
      `  </attvalues>\n` +
      `</node>`
    ).join('\n');

    const edges = graphData.edges.map(edge => 
      `<edge id="${edge.id}" source="${edge.from}" target="${edge.to}" label="${edge.label}"/>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
  <graph mode="static" defaultedgetype="directed">
    <attributes class="node">
      <attribute id="type" title="Type" type="string"/>
      <attribute id="frequency" title="Frequency" type="integer"/>
    </attributes>
    <nodes>
${nodes}
    </nodes>
    <edges>
${edges}
    </edges>
  </graph>
</gexf>`;
  }
}

export const graphBuilderService = new GraphBuilderService();

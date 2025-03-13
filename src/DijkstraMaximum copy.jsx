import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, MoveIcon, TrashIcon, EditIcon, NetworkIcon, RefreshCwIcon } from 'lucide-react';

export default function DijkstraMaximum() {
  // Static initial data for nodes
  const initialNodes = [
    { id: 1, x: 100, y: 150, label: 'A', maxConnections: 4 },
    { id: 2, x: 250, y: 80, label: 'B', maxConnections: 5 },
    { id: 3, x: 400, y: 150, label: 'C', maxConnections: 3 },
    { id: 4, x: 250, y: 250, label: 'D', maxConnections: 4 },
    { id: 5, x: 550, y: 200, label: 'E', maxConnections: 3 }
  ];
  
  // Static initial data for edges
  const initialEdges = [
    { id: 101, source: 1, target: 2, weight: 4 },
    { id: 102, source: 1, target: 4, weight: 3 },
    { id: 103, source: 2, target: 3, weight: 5 },
    { id: 104, source: 2, target: 4, weight: 2 },
    { id: 105, source: 3, target: 5, weight: 6 },
    { id: 106, source: 4, target: 3, weight: 7 },
    { id: 107, source: 4, target: 5, weight: 8 }
  ];

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [mode, setMode] = useState('view');
  const [sourceNode, setSourceNode] = useState(null);
  const [targetNode, setTargetNode] = useState(null);
  const [weight, setWeight] = useState(1);
  const [results, setResults] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [calculationSteps, setCalculationSteps] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodeCounts, setNodeCounts] = useState({});
  const [editingEdge, setEditingEdge] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const svgRef = useRef(null);

  // Validate and update node max connections
  const updateNodeMaxConnections = (nodeId, maxConnections) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, maxConnections: parseInt(maxConnections) || 1 } : node
    ));
  };

  // Calculate number of connections for each node
  useEffect(() => {
    const counts = {};
    nodes.forEach(node => {
      counts[node.id] = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length;
    });
    setNodeCounts(counts);
  }, [nodes, edges]);

  // Prevent adding edges beyond max connections
  const canAddEdge = (sourceId, targetId) => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    const sourceCurrent = edges.filter(e => e.source === sourceId || e.target === sourceId).length;
    const targetNode = nodes.find(n => n.id === targetId);
    const targetCurrent = edges.filter(e => e.source === targetId || e.target === targetId).length;

    return (
      (!sourceNode.maxConnections || sourceCurrent < sourceNode.maxConnections) &&
      (!targetNode.maxConnections || targetCurrent < targetNode.maxConnections)
    );
  };

  // Reset graph to default values
  const resetToDefault = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setSourceNode(null);
    setTargetNode(null);
    setResults(null);
    setHighlightedPath([]);
    setCalculationSteps([]);
    setMode('view');
    setDraggedNode(null);
  };

  // Add a node at the clicked position
  const handleAddNode = (e) => {
    if (mode !== 'addNode') return;
    
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const svgP = point.matrixTransform(svg.getScreenCTM().inverse());
    
    const newNode = {
      id: Date.now(),
      x: svgP.x,
      y: svgP.y,
      label: String.fromCharCode(65 + nodes.length % 26),
      maxConnections: 3 // Default max connections
    };
    
    setNodes([...nodes, newNode]);
  };

  // Start dragging a node
  const handleNodeDragStart = (e, nodeId) => {
    if (mode !== 'move') return;
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  // Drag a node
  const handleNodeDrag = (e) => {
    if (mode !== 'move' || draggedNode === null) return;
    
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const svgP = point.matrixTransform(svg.getScreenCTM().inverse());
    
    setNodes(nodes.map(node => 
      node.id === draggedNode 
        ? { ...node, x: svgP.x, y: svgP.y } 
        : node
    ));
  };

  // End node dragging
  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  // Update edge weight
  const updateEdgeWeight = (edgeId, newWeight) => {
    setEdges(edges.map(edge => 
      edge.id === edgeId ? { ...edge, weight: parseInt(newWeight) || 1 } : edge
    ));
  };

  // Select a node or edge
  const handleSelectElement = (element, type) => {
    if (mode === 'delete') {
      if (type === 'node') {
        setNodes(nodes.filter(node => node.id !== element.id));
        setEdges(edges.filter(edge => edge.source !== element.id && edge.target !== element.id));
      } else if (type === 'edge') {
        setEdges(edges.filter(edge => edge.id !== element.id));
      }
      return;
    }
    
    if (mode === 'edit') {
      if (type === 'node') {
        setEditingNode(element);
      } else if (type === 'edge') {
        setEditingEdge(element);
      }
      return;
    }
    
    if (mode === 'addEdge') {
      if (type === 'node') {
        if (!sourceNode) {
          setSourceNode(element.id);
        } else if (sourceNode !== element.id) {
          // Check if this edge already exists and connection limits
          const edgeExists = edges.some(edge => 
            (edge.source === sourceNode && edge.target === element.id) ||
            (edge.source === element.id && edge.target === sourceNode)
          );
          
          if (!edgeExists && canAddEdge(sourceNode, element.id)) {
            const newEdge = {
              id: Date.now(),
              source: sourceNode,
              target: element.id,
              weight: weight
            };
            setEdges([...edges, newEdge]);
          } else {
            alert('Limite de connexions atteinte ou chemin existant');
          }
          setSourceNode(null);
        }
      }
      return;
    }
    
    if (type === 'node') {
      setSelectedNode(element.id === selectedNode ? null : element.id);
      setSelectedEdge(null);
      setEditingEdge(null);
    } else if (type === 'edge') {
      setSelectedEdge(element.id === selectedEdge ? null : element.id);
      setEditingEdge(element.id === selectedEdge ? null : element);
      setSelectedNode(null);
    }
  };

  // Find a node by ID
  const findNodeById = (id) => {
    return nodes.find(node => node.id === id);
  };

  // Get node label by ID
  const getNodeLabel = (nodeId) => {
    const node = findNodeById(nodeId);
    return node ? node.label : 'N/A';
  };

  // Check if an edge is in the highlighted path
  const isEdgeInPath = (edge) => {
    if (highlightedPath.length < 2) return false;
    
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      if ((edge.source === highlightedPath[i] && edge.target === highlightedPath[i+1]) ||
          (edge.source === highlightedPath[i+1] && edge.target === highlightedPath[i])) {
        return true;
      }
    }
    return false;
  };

  // Check if a node is in the final path
  const isNodeInPath = (nodeId) => {
    return highlightedPath.includes(nodeId);
  };

  // Implement Dijkstra Maximum Path algorithm
  const runDijkstraMaximum = () => {
    if (!sourceNode || !targetNode) return;
    
    // Create graph from nodes and edges
    const graph = {};
    nodes.forEach(node => {
      graph[node.id] = {};
    });
    
    edges.forEach(edge => {
      graph[edge.source][edge.target] = edge.weight;
      graph[edge.target][edge.source] = edge.weight; // undirected graph
    });
    
    // Initialize distances
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    const steps = [];
    
    nodes.forEach(node => {
      distances[node.id] = -Infinity; // Initialize to negative infinity for maximum path
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    
    distances[sourceNode] = 0;
    
    // Capture initial state
    steps.push({
      iteration: 0,
      current: null,
      distances: { ...distances },
      unvisited: [...unvisited],
      previous: { ...previous }
    });
    
    let iteration = 1;
    
    // Dijkstra Maximum Path algorithm
    while (unvisited.size > 0) {
      // Find the unvisited node with the maximum distance
      let maxDistance = -Infinity;
      let current = null;
      
      unvisited.forEach(nodeId => {
        if (distances[nodeId] > maxDistance) {
          maxDistance = distances[nodeId];
          current = nodeId;
        }
      });
      
      if (current === null || current === targetNode) break;
      
      unvisited.delete(current);
      
      // Update distances for neighbors
      const updates = {};
      
      Object.keys(graph[current]).forEach(neighbor => {
        neighbor = parseInt(neighbor);
        if (unvisited.has(neighbor)) {
          const alt = distances[current] + graph[current][neighbor];
          if (alt > distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
            updates[neighbor] = {
              oldDistance: -Infinity,
              newDistance: alt,
              via: current
            };
          }
        }
      });
      
      // Capture this state for the table
      steps.push({
        iteration,
        current,
        distances: { ...distances },
        unvisited: [...unvisited],
        previous: { ...previous },
        updates
      });
      
      iteration++;
    }
    
    // Reconstruct the path
    const path = [];
    let current = targetNode;
    
    if (previous[current] !== null || current === sourceNode) {
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
    }
    
    setResults({
      distance: distances[targetNode],
      path: path
    });
    
    setHighlightedPath(path);
    setCalculationSteps(steps);
  };

  // Reset results and selections
  const resetResults = () => {
    setResults(null);
    setHighlightedPath([]);
    setCalculationSteps([]);
    setSourceNode(null);
    setTargetNode(null);
  };

 return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <header className="bg-gradient-to-r from-emerald-600 to-green-700 text-white p-4 shadow-lg sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CHO-Dijkstra MAX MAX</h1>
          <p className="text-sm opacity-80">Algorithme de chemin maximal avec limite de connexions</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={resetToDefault} 
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition"
            title="Réinitialiser le graphe"
          >
            <RefreshCwIcon className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4">
        {/* Left Sidebar */}
        <div className="w-full lg:w-72 bg-white shadow-md rounded-lg p-4 flex flex-col space-y-4">
          {/* Mode Selection */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Modes</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: NetworkIcon, mode: 'view', label: 'Vue' },
                { icon: PlusIcon, mode: 'addNode', label: 'Nœud' },
                { icon: PlusIcon, mode: 'addEdge', label: 'Chemin' },
                { icon: MoveIcon, mode: 'move', label: 'Déplacer' },
                { icon: TrashIcon, mode: 'delete', label: 'Suppr' },
                { icon: EditIcon, mode: 'edit', label: 'Éditer' }
              ].map(({ icon: Icon, mode: m, label }) => (
                <button 
                  key={m}
                  className={`px-3 py-2 rounded flex items-center justify-center space-x-1 transition 
                    ${mode === m 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  onClick={() => setMode(m)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Node/Edge Editing */}
          {editingNode && mode === 'edit' && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Modifier Nœud {editingNode.label}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Connexions max</label>
                  <input 
                    type="number" 
                    value={editingNode.maxConnections || 1} 
                    onChange={(e) => updateNodeMaxConnections(editingNode.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Edge Editing */}
          {editingEdge && mode === 'edit' && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Modifier Chemin</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Poids du chemin</label>
                  <input 
                    type="number" 
                    value={editingEdge.weight} 
                    onChange={(e) => updateEdgeWeight(editingEdge.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    min="1"
                  />
                </div>
                <div className="text-sm text-gray-500">
                  De {getNodeLabel(editingEdge.source)} à {getNodeLabel(editingEdge.target)}
                </div>
              </div>
            </div>
          )}

          {/* Algorithm Controls */}
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Algorithme</h2>
            <div className="space-y-3">
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={sourceNode || ''}
                onChange={(e) => setSourceNode(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Nœud de départ</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded"
                value={targetNode || ''}
                onChange={(e) => setTargetNode(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">Nœud d'arrivée</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <button 
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 
                  disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={runDijkstraMaximum}
                disabled={!sourceNode || !targetNode}
              >
                Trouver chemin maximal
              </button>
              <button 
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={resetResults}
              >
                Réinitialiser résultats
              </button>
            </div>
          </div>
        </div>

        {/* Main Graph Area */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white shadow-md rounded h-96 min-h-96 relative overflow-hidden">
            <svg 
              ref={svgRef}
              className="w-full h-full bg-white"
              onClick={handleAddNode}
              onMouseMove={handleNodeDrag}
              onMouseUp={handleNodeDragEnd}
              onMouseLeave={handleNodeDragEnd}
            >
              {/* Edge rendering */}
              {edges.map((edge) => {
                const sourceNode = findNodeById(edge.source);
                const targetNode = findNodeById(edge.target);
                
                if (!sourceNode || !targetNode) return null;
                
                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;
                
                return (
                  <g key={edge.id} onClick={(e) => { e.stopPropagation(); handleSelectElement(edge, 'edge'); }}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={isEdgeInPath(edge) ? "#10B981" : edge.id === selectedEdge ? "#EF4444" : "#9CA3AF"}
                      strokeWidth={isEdgeInPath(edge) ? 4 : 2}
                      strokeLinecap="round"
                      className="cursor-pointer"
                    />
                    <rect
                      x={midX - 12}
                      y={midY - 12}
                      width={24}
                      height={24}
                      rx={12}
                      fill={isEdgeInPath(edge) ? "#10B981" : "white"}
                      stroke={isEdgeInPath(edge) ? "#059669" : "#9CA3AF"}
                      strokeWidth={1}
                      className="cursor-pointer"
                    />
                    <text
                      x={midX}
                      y={midY + 5}
                      textAnchor="middle"
                      fill={isEdgeInPath(edge) ? "white" : "#4B5563"}
                      fontSize="12"
                      fontWeight="bold"
                      className="select-none cursor-pointer"
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}
              
              {/* Node rendering */}
              {nodes.map((node) => (
                <g 
                  key={node.id} 
                  onClick={(e) => { e.stopPropagation(); handleSelectElement(node, 'node'); }}
                  onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                  className={`cursor-${mode === 'move' ? 'move' : 'pointer'}`}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={20}
                    fill={highlightedPath.includes(node.id) ? "#10B981" : node.id === selectedNode ? "#EF4444" : node.id === sourceNode ? "#2563EB" : node.id === targetNode ? "#8B5CF6" : "white"}
                    stroke={highlightedPath.includes(node.id) ? "#059669" : node.id === selectedNode ? "#DC2626" : node.id === sourceNode ? "#1D4ED8" : node.id === targetNode ? "#7C3AED" : "#9CA3AF"}
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y - 3}
                    textAnchor="middle"
                    fill={highlightedPath.includes(node.id) || node.id === selectedNode || node.id === sourceNode || node.id === targetNode ? "white" : "#4B5563"}
                    fontSize="14"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 13}
                    textAnchor="middle"
                    fill={highlightedPath.includes(node.id) || node.id === selectedNode || node.id === sourceNode || node.id === targetNode ? "white" : "#4B5563"}
                    fontSize="10"
                    className="select-none"
                  >
                    {nodeCounts[node.id] || 0} / {node.maxConnections}
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Mode-specific instructions */}
            {mode === 'addNode' && (
              <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-sm text-gray-600">
                Cliquez sur le canevas pour ajouter un nœud
              </div>
            )}
            
            {mode === 'addEdge' && (
              <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-sm text-gray-600">
                Cliquez sur deux nœuds pour créer un chemin entre eux
              </div>
            )}
          </div>
          
          {/* Results and Calculation Steps */}
          {results && (
            <div className="bg-white shadow-md rounded p-4">
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Résultats du Chemin Maximal</h2>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="font-medium text-gray-700">
                  Poids maximal: <span className="text-green-600">{results.distance}</span>
                </p>
                <p className="font-medium text-gray-700">
                  Chemin maximal: <span className="text-green-600">
                    {results.path.map(nodeId => findNodeById(nodeId)?.label).join(' → ')}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
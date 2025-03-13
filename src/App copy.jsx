import React, { useState, useRef } from 'react';

export default function App() {
  // Données statiques initiales pour les nœuds
  const initialNodes = [
    { id: 1, x: 100, y: 150, label: 'A' },
    { id: 2, x: 250, y: 80, label: 'B' },
    { id: 3, x: 400, y: 150, label: 'C' },
    { id: 4, x: 250, y: 250, label: 'D' },
    { id: 5, x: 550, y: 200, label: 'E' }
  ];
  
  // Données statiques initiales pour les chemins
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
  const [mode, setMode] = useState('view'); // 'view', 'addNode', 'addEdge', 'delete'
  const [sourceNode, setSourceNode] = useState(null);
  const [targetNode, setTargetNode] = useState(null);
  const [weight, setWeight] = useState(1);
  const [results, setResults] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);
  const svgRef = useRef(null);

  // Fonction pour réinitialiser le graphe aux valeurs par défaut
  const resetToDefault = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNode(null);
    setSelectedEdge(null);
    setSourceNode(null);
    setTargetNode(null);
    setResults(null);
    setHighlightedPath([]);
    setMode('view');
  };

  // Ajouter un nœud à la position où l'utilisateur clique
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
      label: String.fromCharCode(65 + nodes.length % 26)
    };
    
    setNodes([...nodes, newNode]);
  };

  // Sélectionner un nœud ou une arête
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
    
    if (mode === 'addEdge') {
      if (type === 'node') {
        if (!sourceNode) {
          setSourceNode(element.id);
        } else if (sourceNode !== element.id) {
          // Vérifier si cette arête existe déjà
          const edgeExists = edges.some(edge => 
            (edge.source === sourceNode && edge.target === element.id) ||
            (edge.source === element.id && edge.target === sourceNode)
          );
          
          if (!edgeExists) {
            const newEdge = {
              id: Date.now(),
              source: sourceNode,
              target: element.id,
              weight: weight
            };
            setEdges([...edges, newEdge]);
          }
          setSourceNode(null);
        }
      }
      return;
    }
    
    if (type === 'node') {
      setSelectedNode(element.id === selectedNode ? null : element.id);
      setSelectedEdge(null);
    } else if (type === 'edge') {
      setSelectedEdge(element.id === selectedEdge ? null : element.id);
      setSelectedNode(null);
    }
  };

  // Mettre à jour le poids d'une arête
  const updateEdgeWeight = (edgeId, newWeight) => {
    setEdges(edges.map(edge => 
      edge.id === edgeId ? { ...edge, weight: parseInt(newWeight) || 1 } : edge
    ));
  };

  // Exécuter l'algorithme de Dijkstra
  const runDijkstra = () => {
    if (!sourceNode || !targetNode) return;
    
    // Créer un graphe à partir des nœuds et arêtes
    const graph = {};
    nodes.forEach(node => {
      graph[node.id] = {};
    });
    
    edges.forEach(edge => {
      graph[edge.source][edge.target] = edge.weight;
      graph[edge.target][edge.source] = edge.weight; // graphe non orienté
    });
    
    // Initialiser les distances
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    
    nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
      unvisited.add(node.id);
    });
    
    distances[sourceNode] = 0;
    
    // Algorithme de Dijkstra
    while (unvisited.size > 0) {
      // Trouver le nœud avec la distance minimale
      let minDistance = Infinity;
      let current = null;
      
      unvisited.forEach(nodeId => {
        if (distances[nodeId] < minDistance) {
          minDistance = distances[nodeId];
          current = nodeId;
        }
      });
      
      if (current === null || current === targetNode) break;
      
      unvisited.delete(current);
      
      // Mettre à jour les distances pour les voisins
      Object.keys(graph[current]).forEach(neighbor => {
        if (unvisited.has(parseInt(neighbor))) {
          const alt = distances[current] + graph[current][neighbor];
          if (alt < distances[neighbor]) {
            distances[neighbor] = alt;
            previous[neighbor] = current;
          }
        }
      });
    }
    
    // Reconstruire le chemin
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
  };

  // Réinitialiser les résultats et les sélections
  const resetResults = () => {
    setResults(null);
    setHighlightedPath([]);
    setSourceNode(null);
    setTargetNode(null);
  };

  // Trouver un nœud par ID
  const findNodeById = (id) => {
    return nodes.find(node => node.id === id);
  };

  // Vérifier si une arête est dans le chemin surligné
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md">
        <h1 className="text-3xl font-bold">Algorithme CHO-DIJKSTRA MIN MAX</h1>
        <p className="text-sm opacity-80">Trouvez le chemin le plus court dans un graphe pondéré</p>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white shadow-md p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Mode</h2>
            <div className="grid grid-cols-2 gap-2">
              <button 
                className={`px-3 py-2 text-sm font-medium rounded ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => setMode('view')}
              >
                Afficher
              </button>
              <button 
                className={`px-3 py-2 text-sm font-medium rounded ${mode === 'addNode' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => setMode('addNode')}
              >
                Ajouter Nœud
              </button>
              <button 
                className={`px-3 py-2 text-sm font-medium rounded ${mode === 'addEdge' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => { setMode('addEdge'); setSourceNode(null); }}
              >
                Ajouter Chemin
              </button>
              <button 
                className={`px-3 py-2 text-sm font-medium rounded ${mode === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => setMode('delete')}
              >
                Supprimer
              </button>
            </div>
          </div>
          
          {mode === 'addEdge' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Poids du chemin</h2>
              <input 
                type="number" 
                min="1"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                {sourceNode ? `Premier nœud sélectionné: ${findNodeById(sourceNode)?.label}` : 'Sélectionnez le premier nœud'}
              </p>
            </div>
          )}
          
          {selectedEdge && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Modifier le chemin</h2>
              <div className="flex items-center">
                <label className="mr-2 text-gray-600">Poids:</label>
                <input 
                  type="number"
                  min="1"
                  value={edges.find(e => e.id === selectedEdge)?.weight}
                  onChange={(e) => updateEdgeWeight(selectedEdge, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Algorithme</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nœud de départ</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={sourceNode || ''}
                  onChange={(e) => setSourceNode(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Sélectionner</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>{node.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nœud d'arrivée</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={targetNode || ''}
                  onChange={(e) => setTargetNode(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Sélectionner</option>
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>{node.label}</option>
                  ))}
                </select>
              </div>
              <button 
                className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={runDijkstra}
                disabled={!sourceNode || !targetNode}
              >
                Trouver le chemin le plus court
              </button>
              <button 
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400"
                onClick={resetResults}
              >
                Réinitialiser
              </button>
            </div>
          </div>
          
          <button 
            className="w-full px-4 py-2 mt-4 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600"
            onClick={resetToDefault}
          >
            Réinitialiser le graphe
          </button>
          
          {results && (
            <div className="border-t pt-4 mt-auto">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">Résultats</h2>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="font-medium text-gray-700">
                  Distance: <span className="text-blue-600">{results.distance}</span>
                </p>
                <p className="font-medium text-gray-700">
                  Chemin: <span className="text-blue-600">
                    {results.path.map(nodeId => findNodeById(nodeId)?.label).join(' → ')}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          <svg 
            ref={svgRef}
            className="w-full h-full bg-white"
            onClick={handleAddNode}
          >
            {/* Dessiner les arêtes */}
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
                    stroke={isEdgeInPath(edge) ? "#2563EB" : edge.id === selectedEdge ? "#EF4444" : "#9CA3AF"}
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
                    fill={isEdgeInPath(edge) ? "#2563EB" : "white"}
                    stroke={isEdgeInPath(edge) ? "#1D4ED8" : "#9CA3AF"}
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
            
            {/* Dessiner les nœuds */}
            {nodes.map((node) => (
              <g 
                key={node.id} 
                onClick={(e) => { e.stopPropagation(); handleSelectElement(node, 'node'); }}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={20}
                  fill={highlightedPath.includes(node.id) ? "#2563EB" : node.id === selectedNode ? "#EF4444" : node.id === sourceNode ? "#10B981" : node.id === targetNode ? "#8B5CF6" : "white"}
                  stroke={highlightedPath.includes(node.id) ? "#1D4ED8" : node.id === selectedNode ? "#DC2626" : node.id === sourceNode ? "#059669" : node.id === targetNode ? "#7C3AED" : "#9CA3AF"}
                  strokeWidth={2}
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill={highlightedPath.includes(node.id) || node.id === selectedNode || node.id === sourceNode || node.id === targetNode ? "white" : "#4B5563"}
                  fontSize="14"
                  fontWeight="bold"
                  className="select-none"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
          
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
          
          {mode === 'delete' && (
            <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-sm text-red-600">
              Cliquez sur un élément pour le supprimer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
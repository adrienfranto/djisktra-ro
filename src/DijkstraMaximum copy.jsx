import React, { useState, useRef, useEffect } from 'react';

export default function DijkstraMaximum() {
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
  const [mode, setMode] = useState('view'); // 'view', 'addNode', 'addEdge', 'delete', 'move'
  const [sourceNode, setSourceNode] = useState(null);
  const [targetNode, setTargetNode] = useState(null);
  const [weight, setWeight] = useState(1);
  const [results, setResults] = useState(null);
  const [highlightedPath, setHighlightedPath] = useState([]);
  const [calculationSteps, setCalculationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [allCalculationSteps, setAllCalculationSteps] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [nodeCounts, setNodeCounts] = useState({});
  const [isStepMode, setIsStepMode] = useState(false);
  const svgRef = useRef(null);

  // Calculer le nombre de chemins connectés à chaque nœud
  useEffect(() => {
    const counts = {};
    nodes.forEach(node => {
      counts[node.id] = edges.filter(edge => 
        edge.source === node.id || edge.target === node.id
      ).length;
    });
    setNodeCounts(counts);
  }, [nodes, edges]);

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
    setCalculationSteps([]);
    setAllCalculationSteps([]);
    setCurrentStepIndex(0);
    setIsStepMode(false);
    setMode('view');
    setDraggedNode(null);
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

  // Fonction pour gérer le début du déplacement d'un nœud
  const handleNodeDragStart = (e, nodeId) => {
    if (mode !== 'move') return;
    e.stopPropagation();
    setDraggedNode(nodeId);
  };

  // Fonction pour gérer le déplacement d'un nœud
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

  // Fonction pour gérer la fin du déplacement d'un nœud
  const handleNodeDragEnd = () => {
    setDraggedNode(null);
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

 const prepareDijkstra = () => {
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
  const steps = [];
  
  nodes.forEach(node => {
    distances[node.id] = node.id === sourceNode ? 0 : -Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });
  
  // Capturer l'état initial
  steps.push({
    iteration: 0,
    current: null,
    distances: { ...distances },
    unvisited: [...unvisited],
    previous: { ...previous }
  });
  
  setAllCalculationSteps(steps);
  setCalculationSteps([steps[0]]);
  setCurrentStepIndex(0);
  setIsStepMode(true);
  
  // Réinitialiser les résultats précédents
  setResults(null);
  setHighlightedPath([]);
};

  // Passer à l'étape suivante de l'algorithme
  const nextStep = () => {
    if (currentStepIndex >= allCalculationSteps.length - 1) {
      // Si on est déjà à la dernière étape existante, calculer la prochaine étape
      calculateNextStep();
    } else {
      // Sinon, avancer à l'étape suivante déjà calculée
      setCurrentStepIndex(currentStepIndex + 1);
      setCalculationSteps(allCalculationSteps.slice(0, currentStepIndex + 2));
      
      // Mettre à jour le chemin surligné si on est à la dernière étape
      if (currentStepIndex + 1 === allCalculationSteps.length - 1) {
        updateHighlightedPath();
      }
    }
  };

  // Calculer la prochaine étape de l'algorithme de Dijkstra
 const calculateNextStep = () => {
  // Récupérer l'état actuel
  const previousStep = allCalculationSteps[allCalculationSteps.length - 1];
  const distances = { ...previousStep.distances };
  const previous = { ...previousStep.previous };
  const unvisited = new Set(previousStep.unvisited);
  
  // Récréer le graphe
  const graph = {};
  nodes.forEach(node => {
    graph[node.id] = {};
  });
  
  edges.forEach(edge => {
    graph[edge.source][edge.target] = edge.weight;
    graph[edge.target][edge.source] = edge.weight;
  });
  
  // Trouver le nœud avec la distance maximale
  let maxDistance = -Infinity;
  let current = null;
  
  unvisited.forEach(nodeId => {
    if (distances[nodeId] > maxDistance) {
      maxDistance = distances[nodeId];
      current = nodeId;
    }
  });
  
  // Vérifications de fin
  if (current === null || current === targetNode || unvisited.size === 0) {
    updateHighlightedPath();
    return;
  }
  
  unvisited.delete(current);
  
  // Mettre à jour les distances pour les voisins
  const updates = {};
  
  Object.keys(graph[current]).forEach(neighbor => {
    neighbor = parseInt(neighbor);
    if (unvisited.has(neighbor)) {
      const alt = distances[current] + graph[current][neighbor];
      if (alt > distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
        updates[neighbor] = {
          oldDistance: distances[neighbor],
          newDistance: alt,
          via: current
        };
      }
    }
  });
  
  // Créer la nouvelle étape
  const newStep = {
    iteration: allCalculationSteps.length,
    current,
    distances: { ...distances },
    unvisited: [...unvisited],
    previous: { ...previous },
    updates
  };
  
  // Mettre à jour toutes les étapes
  const newAllSteps = [...allCalculationSteps, newStep];
  setAllCalculationSteps(newAllSteps);
  setCurrentStepIndex(newAllSteps.length - 1);
  setCalculationSteps(newAllSteps);
  
  // Si on a atteint la destination, construire le chemin final
  if (current === targetNode || unvisited.size === 0) {
    updateHighlightedPath();
  }
};

  // Construire et mettre à jour le chemin final
  const updateHighlightedPath = () => {
    const lastStep = allCalculationSteps[allCalculationSteps.length - 1];
    const previous = lastStep.previous;
    
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
      distance: lastStep.distances[targetNode],
      path: path
    });
    
    setHighlightedPath(path);
  };

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
    
    // Initialiser les tableaux pour les étapes de calcul
    const calculationSteps = [];
    const initialDistances = {};
    const initialPrevious = {};
    
    // Initialiser les distances et les chemins précédents
    nodes.forEach(node => {
      initialDistances[node.id] = node.id === sourceNode ? 0 : -Infinity;
      initialPrevious[node.id] = null;
    });
    
    // Ajouter l'étape initiale
    calculationSteps.push({
      iteration: 0,
      current: null,
      distances: { ...initialDistances },
      previous: { ...initialPrevious },
      unvisited: nodes.map(node => node.id),
      updates: {}
    });
    
    // Recherche exhaustive des chemins maximaux
    const findMaxPath = (currentPath, currentWeight, unvisitedNodes) => {
      const lastNode = currentPath[currentPath.length - 1];
      
      // Si on a atteint la destination, retourner ce chemin
      if (lastNode === targetNode) {
        return { path: currentPath, weight: currentWeight };
      }
      
      // Stocker tous les chemins possibles
      const possiblePaths = [];
      
      // Examiner tous les voisins non déjà visités
      Object.keys(graph[lastNode]).forEach(neighborId => {
        const neighbor = parseInt(neighborId);
        
        // Vérifier que le voisin est non visité et fait partie des nœuds non visités
        if (!currentPath.includes(neighbor) && unvisitedNodes.includes(neighbor)) {
          const edgeWeight = graph[lastNode][neighbor];
          const newPath = [...currentPath, neighbor];
          const newWeight = currentWeight + edgeWeight;
          
          // Créer une étape de calcul pour cette exploration
          const stepDistances = { ...initialDistances };
          newPath.forEach((node, index) => {
            stepDistances[node] = currentWeight + (index > 0 ? graph[newPath[index-1]][node] : 0);
          });
          
          calculationSteps.push({
            iteration: calculationSteps.length,
            current: neighbor,
            distances: stepDistances,
            previous: { ...initialPrevious, [neighbor]: lastNode },
            unvisited: unvisitedNodes.filter(n => !newPath.includes(n)),
            updates: {
              [neighbor]: {
                oldDistance: initialDistances[neighbor],
                newDistance: stepDistances[neighbor],
                via: lastNode
              }
            }
          });
          
          // Récursivement explorer ce chemin
          const newUnvisited = unvisitedNodes.filter(n => !newPath.includes(n));
          const result = findMaxPath(newPath, newWeight, newUnvisited);
          
          if (result) {
            possiblePaths.push(result);
          }
        }
      });
      
      // Retourner le chemin avec le poids maximum
      return possiblePaths.length > 0 
        ? possiblePaths.reduce((max, current) => 
            current.weight > max.weight ? current : max
          )
        : null;
    };
    
    // Commencer la recherche à partir du nœud source
    const maxPathResult = findMaxPath([sourceNode], 0, nodes.map(node => node.id).filter(id => id !== sourceNode));
    
    if (maxPathResult) {
      // Ajouter l'étape finale avec le chemin complet
      const finalStep = { ...calculationSteps[calculationSteps.length - 1] };
      finalStep.iteration = calculationSteps.length;
      const finalDistances = { ...finalStep.distances };
      maxPathResult.path.forEach((node, index) => {
        if (index > 0) {
          finalDistances[node] = finalStep.distances[node] || 
            (finalDistances[maxPathResult.path[index-1]] + graph[maxPathResult.path[index-1]][node]);
        }
      });
      finalStep.distances = finalDistances;
      calculationSteps.push(finalStep);
      
      // Définir les résultats
      setResults({
        distance: maxPathResult.weight,
        path: maxPathResult.path
      });
      
      setHighlightedPath(maxPathResult.path);
      setCalculationSteps(calculationSteps);
      setAllCalculationSteps(calculationSteps);
      setCurrentStepIndex(calculationSteps.length - 1);
      setIsStepMode(false);
    } else {
      // Aucun chemin trouvé
      setResults(null);
      setHighlightedPath([]);
      setCalculationSteps([]);
      setAllCalculationSteps([]);
    }
  };
  // Réinitialiser les résultats et les sélections
  const resetResults = () => {
    setResults(null);
    setHighlightedPath([]);
    setCalculationSteps([]);
    setAllCalculationSteps([]);
    setCurrentStepIndex(0);
    setIsStepMode(false);
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

  // Obtenir le label du nœud à partir de son ID
  const getNodeLabel = (nodeId) => {
    const node = findNodeById(nodeId);
    return node ? node.label : 'N/A';
  };

  // Vérifier si un nœud est dans le chemin final
  const isNodeInPath = (nodeId) => {
    return highlightedPath.includes(nodeId);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-auto">
       <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-3xl font-bold">Algorithme CHO-DIJKSTRA MAXIMUM</h1>
        <p className="text-sm opacity-80">Trouvez le chemin le plus long dans un graphe pondéré</p>
      </header>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <p className="text-gray-600 text-lg">Aucun nœud. Commencez par ajouter des nœuds.</p>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4">
        <div className="w-full lg:w-64 bg-white shadow-md p-4 flex flex-col rounded">
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
                className={`px-3 py-2 text-sm font-medium rounded ${mode === 'move' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                onClick={() => setMode('move')}
              >
                Déplacer
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
              <div className="grid grid-cols-1 gap-2">
                <button 
                  className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={runDijkstra}
                  disabled={!sourceNode || !targetNode}
                >
                  Calcul complet
                </button>
                <button 
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={prepareDijkstra}
                  disabled={!sourceNode || !targetNode}
                >
                  Calcul étape par étape
                </button>
                {isStepMode && (
                  <button 
                    className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
                    onClick={nextStep}
                  >
                    Étape suivante
                  </button>
                )}
                <button 
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400"
                  onClick={resetResults}
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full px-4 py-2 mt-4 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600"
            onClick={resetToDefault}
          >
            Réinitialiser le graphe
          </button>
          
          {results && (
            <div className="border-t pt-4 mt-4">
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
                  onMouseDown={(e) => handleNodeDragStart(e, node.id)}
                  className={`cursor-${mode === 'move' ? 'move' : 'pointer'}`}
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
                    {nodeCounts[node.id] || 0}
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
            
            {mode === 'move' && (
              <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-sm text-blue-600">
                Cliquez et faites glisser un nœud pour le déplacer
              </div>
            )}
            
            {mode === 'delete' && (
              <div className="absolute bottom-4 left-4 bg-white p-2 rounded shadow-md text-sm text-red-600">
                Cliquez sur un élément pour le supprimer
              </div>
            )}
          </div>
          
          {/* Tableau des étapes de calcul */}
          {calculationSteps.length > 0 && (
            <div className="bg-white shadow-md rounded p-4 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-3 text-gray-700">Étapes de calcul CHO-DIJKSTRA MIN MAX</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itération</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nœud courant</th>
                      {nodes.map(node => (
                        <th key={node.id} scope="col" className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider
                          ${isNodeInPath(node.id) ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}>
                          {node.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {calculationSteps.map((step, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{step.iteration}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {step.current ? getNodeLabel(step.current) : 'Initial'}
                        </td>
                        {nodes.map(node => {
                          const distance = step.distances[node.id];
                          const isUpdated = step.updates && step.updates[node.id];
                          const isInFinalPath = isNodeInPath(node.id);
                          const isLast = index === calculationSteps.length - 1;
                          
                          // Déterminer la couleur de la cellule
                          let cellClass = '';
                          
                          if (isInFinalPath && isLast) {
                            // Nœud dans le chemin final et dernière itération
                            cellClass = 'bg-blue-500 text-white';
                          } else if (isInFinalPath) {
                            // Nœud dans le chemin final
                            cellClass = 'bg-blue-100';
                          } else if (isUpdated) {
                            // Valeur mise à jour
                            cellClass = 'bg-green-100';
                          } else if (node.id === step.current) {
                            // Nœud courant
                            cellClass = 'bg-yellow-100';
                          }
                          
                          return (
                            <td key={node.id} className={`px-4 py-2 whitespace-nowrap text-sm text-center ${cellClass}`}>
                              {distance === Infinity ? '∞' : distance}
                              {step.previous[node.id] !== null && step.previous[node.id] !== undefined && 
                                <span className={`text-xs ml-1 ${isInFinalPath && isLast ? 'text-white' : 'text-gray-500'}`}>
                                  ( {getNodeLabel(step.previous[node.id])})
                                </span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <h3 className="font-medium mb-2">Légende:</h3>
                <div className="flex flex-wrap items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                    <span>Chemin final</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-100 mr-2"></div>
                    <span>Nœud du chemin final</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-100 mr-2"></div>
                    <span>Nœud courant</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 mr-2"></div>
                    <span>Distance mise à jour</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-white border border-gray-300 mr-2"></div>
                    <span>Valeur inchangée</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
         
        </div>
      </div>
    </div>
  );
}
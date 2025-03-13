import React, { useState, useEffect, useRef } from 'react';

const DijkstraMaximum = () => {
  // Structure initiale du graphe
  const initialGraph = {
    A: { B: 5, C: 9, D: 4 },
    B: { E: 3, F: 2 },
    C: { F: 1 },
    D: { G: 7 },
    E: { I: 9, K: 5 },
    F: { I: 4, G: 3, H: 5 },
    G: { H: 7 },
    H: { K: 2, M: 5 },
    I: { J: 9, L: 5 },
    J: { L: 10, K: 3 },
    K: { N: 5 },
    L: { N: 3, O: 4, P: 2 },
    M: { N: 4, P: 2 },
    N: { O: 1 },
    O: { P: 3 },
    P: {}
  };

  // États React
  const [graph, setGraph] = useState(initialGraph);
  const [distances, setDistances] = useState({});
  const [previous, setPrevious] = useState({});
  const [visited, setVisited] = useState([]);
  const [pathFound, setPathFound] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [nodePositions, setNodePositions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeWeight, setNewEdgeWeight] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const svgRef = useRef(null);

  // Initialiser les positions des nœuds
  useEffect(() => {
    const generateNodePositions = () => {
      const nodes = Object.keys(graph);
      const width = 800;
      const height = 600;
      const positions = {};
      
      // Positions prédéfinies pour le graphe initial
      if (nodes.includes('A') && nodes.includes('P')) {
        positions.A = { x: 50, y: 300 };
        positions.B = { x: 150, y: 200 };
        positions.C = { x: 150, y: 300 };
        positions.D = { x: 150, y: 400 };
        positions.E = { x: 250, y: 150 };
        positions.F = { x: 250, y: 250 };
        positions.G = { x: 250, y: 350 };
        positions.H = { x: 350, y: 400 };
        positions.I = { x: 350, y: 150 };
        positions.J = { x: 450, y: 200 };
        positions.K = { x: 450, y: 300 };
        positions.L = { x: 550, y: 150 };
        positions.M = { x: 450, y: 400 };
        positions.N = { x: 650, y: 250 };
        positions.O = { x: 750, y: 200 };
        positions.P = { x: 750, y: 300 };
      }
      
      // Générer des positions aléatoires pour les nœuds non placés
      nodes.forEach(node => {
        if (!positions[node]) {
          positions[node] = {
            x: Math.random() * (width - 100) + 50,
            y: Math.random() * (height - 100) + 50
          };
        }
      });
      
      return positions;
    };
    
    setNodePositions(generateNodePositions());
  }, [graph]);

  // Initialisation de l'algorithme
  const initializeDijkstra = () => {
    const nodes = Object.keys(graph);
    const distances = {};
    const previous = {};
    
    // Initialisation des distances à -Infinity et des précédents à null
    nodes.forEach(node => {
      distances[node] = node === 'A' ? 0 : -Infinity;
      previous[node] = null;
    });
    
    setDistances(distances);
    setPrevious(previous);
    setVisited(['A']);
    setPathFound(false);
    setCurrentStep(1);
    
    // Premier état du tableau
    setTableData([
      {
        step: 0,
        node: 'A',
        distances: { ...distances },
        visited: ['A'],
        previous: { ...previous }
      }
    ]);
    
    // Exécuter l'algorithme
    runDijkstraStep('A', distances, previous, ['A']);
  };

  // Exécute une étape de l'algorithme de Dijkstra
  const runDijkstraStep = (currentNode, currentDistances, currentPrevious, currentVisited) => {
    const newDistances = { ...currentDistances };
    const newPrevious = { ...currentPrevious };
    let newVisited = [...currentVisited];
    
    // Mise à jour des distances pour les voisins
    Object.entries(graph[currentNode] || {}).forEach(([neighbor, weight]) => {
      const potentialDistance = currentDistances[currentNode] + weight;
      
      if (potentialDistance > newDistances[neighbor]) {
        newDistances[neighbor] = potentialDistance;
        newPrevious[neighbor] = currentNode;
      }
    });
    
    // Trouver le nœud non visité avec la distance maximale
    let maxDistance = -Infinity;
    let nextNode = null;
    
    Object.keys(graph).forEach(node => {
      if (!newVisited.includes(node) && newDistances[node] > maxDistance) {
        maxDistance = newDistances[node];
        nextNode = node;
      }
    });
    
    // Ajouter à la liste des nœuds visités
    if (nextNode) {
      newVisited.push(nextNode);
      
      // Enregistrement de l'état actuel
      const tableRow = {
        step: currentStep,
        node: nextNode,
        distances: { ...newDistances },
        visited: [...newVisited],
        previous: { ...newPrevious }
      };
      
      setTableData(prev => [...prev, tableRow]);
      setDistances(newDistances);
      setPrevious(newPrevious);
      setVisited(newVisited);
      setCurrentStep(prev => prev + 1);
      
      // Continuer avec la prochaine étape
      setTimeout(() => {
        runDijkstraStep(nextNode, newDistances, newPrevious, newVisited);
      }, 0);
    } else {
      // L'algorithme est terminé
      setPathFound(true);
    }
  };

  // Ajouter un nouveau nœud
  const handleAddNode = () => {
    if (!newNodeName || newNodeName.trim() === '' || graph[newNodeName]) {
      alert('Veuillez entrer un nom de nœud valide et unique.');
      return;
    }
    
    const updatedGraph = { ...graph, [newNodeName]: {} };
    setGraph(updatedGraph);
    setNewNodeName('');
  };

  // Supprimer un nœud
  const handleDeleteNode = (node) => {
    if (!node) return;
    
    const updatedGraph = { ...graph };
    
    // Supprimer le nœud
    delete updatedGraph[node];
    
    // Supprimer également toutes les références à ce nœud dans les autres nœuds
    Object.keys(updatedGraph).forEach(source => {
      if (updatedGraph[source][node]) {
        delete updatedGraph[source][node];
      }
    });
    
    setGraph(updatedGraph);
    setSelectedNode(null);
    setPathFound(false);
    setTableData([]);
  };

  // Ajouter ou mettre à jour une arête
  const handleAddEdge = () => {
    if (!newEdgeSource || !newEdgeTarget || !graph[newEdgeSource] || !graph[newEdgeTarget]) {
      alert('Veuillez sélectionner des nœuds source et cible valides.');
      return;
    }
    
    const weight = parseInt(newEdgeWeight);
    if (isNaN(weight) || weight <= 0) {
      alert('Le poids doit être un nombre positif.');
      return;
    }
    
    const updatedGraph = { ...graph };
    updatedGraph[newEdgeSource] = {
      ...updatedGraph[newEdgeSource],
      [newEdgeTarget]: weight
    };
    
    setGraph(updatedGraph);
    setNewEdgeSource('');
    setNewEdgeTarget('');
    setNewEdgeWeight(1);
  };

  // Supprimer une arête
  const handleDeleteEdge = (source, target) => {
    const updatedGraph = { ...graph };
    if (updatedGraph[source] && updatedGraph[source][target]) {
      delete updatedGraph[source][target];
      setGraph(updatedGraph);
    }
  };

  // Démarrer l'algorithme
  const startAlgorithm = () => {
    setTableData([]);
    setPathFound(false);
    setCurrentStep(0);
    initializeDijkstra();
  };

  // Réinitialiser le graphe
  const resetGraph = () => {
    setGraph(initialGraph);
    setPathFound(false);
    setTableData([]);
    setSelectedNode(null);
  };

  // Gérer le glisser-déposer des nœuds
  const handleNodeDragStart = (event, node) => {
    if (!editMode) return;
    
    setSelectedNode(node);
    const startX = event.clientX;
    const startY = event.clientY;
    const startNodeX = nodePositions[node].x;
    const startNodeY = nodePositions[node].y;
    
    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      setNodePositions(prev => ({
        ...prev,
        [node]: {
          x: startNodeX + dx,
          y: startNodeY + dy
        }
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Reconstruire le chemin optimal
  const getPath = () => {
    if (!pathFound) return [];
    
    const path = [];
    let current = 'P';
    
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    return path;
  };

  // Calculer la distance totale du chemin
  const getPathDistance = () => {
    return pathFound ? distances['P'] : 0;
  };

  // Calculer le point médian pour placer le poids de l'arête
  const getEdgeLabelPosition = (sourcePos, targetPos) => {
    return {
      x: (sourcePos.x + targetPos.x) / 2,
      y: (sourcePos.y + targetPos.y) / 2
    };
  };

  // Vérifier si une arête fait partie du chemin optimal
  const isEdgeInPath = (source, target) => {
    if (!pathFound) return false;
    
    const path = getPath();
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] === source && path[i + 1] === target) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Algorithme de Dijkstra (Chemin de valeur maximale)</h1>
      
      {/* Contrôles */}
      <div className="mb-6 flex space-x-4">
        <button 
          onClick={startAlgorithm} 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Démarrer l'algorithme
        </button>
        <button 
          onClick={resetGraph} 
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Réinitialiser le graphe
        </button>
        <button 
          onClick={() => setEditMode(!editMode)} 
          className={`${editMode ? 'bg-green-500 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-700'} text-white font-bold py-2 px-4 rounded`}
        >
          {editMode ? 'Mode édition activé' : 'Activer mode édition'}
        </button>
      </div>
      
      {/* Mode édition */}
      {editMode && (
        <div className="mb-6 p-4 border rounded bg-gray-100">
          <h2 className="text-xl font-bold mb-2">Mode édition</h2>
          
          {/* Ajouter un nœud */}
          <div className="mb-4">
            <h3 className="font-bold">Ajouter un nœud</h3>
            <div className="flex items-center">
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="Nom du nœud"
                className="mr-2 p-2 border rounded"
              />
              <button 
                onClick={handleAddNode}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Ajouter/modifier un chemin */}
          <div className="mb-4">
            <h3 className="font-bold">Ajouter/modifier un chemin</h3>
            <div className="flex items-center">
              <select
                value={newEdgeSource}
                onChange={(e) => setNewEdgeSource(e.target.value)}
                className="mr-2 p-2 border rounded"
              >
                <option value="">Source</option>
                {Object.keys(graph).map(node => (
                  <option key={`source-${node}`} value={node}>{node}</option>
                ))}
              </select>
              <select
                value={newEdgeTarget}
                onChange={(e) => setNewEdgeTarget(e.target.value)}
                className="mr-2 p-2 border rounded"
              >
                <option value="">Cible</option>
                {Object.keys(graph).map(node => (
                  <option key={`target-${node}`} value={node}>{node}</option>
                ))}
              </select>
              <input
                type="number"
                value={newEdgeWeight}
                onChange={(e) => setNewEdgeWeight(e.target.value)}
                min="1"
                className="mr-2 p-2 border rounded w-20"
              />
              <button 
                onClick={handleAddEdge}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Ajouter
              </button>
            </div>
          </div>
          
          {/* Actions sur le nœud sélectionné */}
          {selectedNode && (
            <div>
              <h3 className="font-bold">Nœud sélectionné: {selectedNode}</h3>
              <button 
                onClick={() => handleDeleteNode(selectedNode)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Supprimer ce nœud
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* SVG Graphe */}
      <div className="mb-6 border p-4">
        <h2 className="text-xl font-bold mb-2">Graphe</h2>
        <svg ref={svgRef} width="800" height="600" className="border">
          {/* Arêtes */}
          {Object.entries(graph).flatMap(([source, targets]) => 
            Object.entries(targets).map(([target, weight]) => {
              const sourcePos = nodePositions[source] || { x: 0, y: 0 };
              const targetPos = nodePositions[target] || { x: 0, y: 0 };
              const labelPos = getEdgeLabelPosition(sourcePos, targetPos);
              const pathInOptimal = isEdgeInPath(source, target);
              
              return (
                <g key={`edge-${source}-${target}`}>
                  <line
                    x1={sourcePos.x}
                    y1={sourcePos.y}
                    x2={targetPos.x}
                    y2={targetPos.y}
                    stroke={pathInOptimal ? "#FF0000" : "#999"}
                    strokeWidth={pathInOptimal ? 3 : 1}
                    markerEnd="url(#arrowhead)"
                  />
                  <circle
                    cx={labelPos.x}
                    cy={labelPos.y}
                    r="12"
                    fill="white"
                    stroke="#666"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                  >
                    {weight}
                  </text>
                  {editMode && (
                    <rect
                      x={labelPos.x - 15}
                      y={labelPos.y - 15}
                      width="30"
                      height="30"
                      fill="transparent"
                      onClick={() => handleDeleteEdge(source, target)}
                      style={{ cursor: 'pointer' }}
                    />
                  )}
                </g>
              );
            })
          )}
          
          {/* Nœuds */}
          {Object.keys(graph).map(node => {
            const pos = nodePositions[node] || { x: 0, y: 0 };
            const isStart = node === 'A';
            const isEnd = node === 'P';
            const isInPath = pathFound && getPath().includes(node);
            
            return (
              <g 
                key={`node-${node}`} 
                transform={`translate(${pos.x}, ${pos.y})`}
                onMouseDown={(e) => handleNodeDragStart(e, node)}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: editMode ? 'move' : 'pointer' }}
              >
                <circle
                  r="20"
                  fill={isStart ? "#FFFF00" : isEnd ? "#00FF00" : isInPath ? "#FF9999" : "white"}
                  stroke="#000"
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="16"
                  fontWeight="bold"
                >
                  {node}
                </text>
              </g>
            );
          })}
          
          {/* Définition des flèches */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
            </marker>
          </defs>
        </svg>
      </div>
      
      {/* Résultat de l'algorithme */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Résultat</h2>
        <div className="border p-4">
          {pathFound ? (
            <>
              <p><strong>Chemin optimal:</strong> {getPath().join(' → ')}</p>
              <p><strong>Valeur du chemin:</strong> {getPathDistance()}</p>
            </>
          ) : (
            <p>Aucun calcul effectué ou en cours...</p>
          )}
        </div>
      </div>
      
      {/* Tableau des étapes */}
      <div>
        <h2 className="text-xl font-bold mb-2">Tableau des étapes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Étape</th>
                <th className="border p-2">Nœud</th>
                {Object.keys(graph).map(node => (
                  <th key={`header-${node}`} className="border p-2">{node}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={`row-${index}`} className={index === tableData.length - 1 ? "bg-yellow-100" : ""}>
                  <td className="border p-2">{row.step}</td>
                  <td className="border p-2 font-bold">{row.node}</td>
                  {Object.keys(graph).map(node => (
                    <td key={`cell-${index}-${node}`} className="border p-2">
                      {row.distances[node] === -Infinity ? "∞" : 
                       row.distances[node] === 0 && node === 'A' ? "0" :
                       row.distances[node] > 0 ? 
                       `${row.distances[node]} (${row.previous[node]})` : "∞"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DijkstraMaximum;
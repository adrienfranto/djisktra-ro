import React, { useState, useEffect, useRef } from 'react';

const DijkstraMaximumInteractive = () => {
  const [nodes, setNodes] = useState([
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 250, y: 50 },
    { id: 'C', x: 250, y: 150 },
    { id: 'D', x: 400, y: 50 },
    { id: 'E', x: 400, y: 150 },
    { id: 'F', x: 550, y: 100 },
    { id: 'G', x: 400, y: 250 }
  ]);

  const [edges, setEdges] = useState([
    { source: 'A', target: 'B', weight: 80 },
    { source: 'A', target: 'C', weight: 90 },
    { source: 'B', target: 'D', weight: 85 },
    { source: 'B', target: 'E', weight: 70 },
    { source: 'C', target: 'F', weight: 75 },
    { source: 'D', target: 'G', weight: 65 },
    { source: 'E', target: 'G', weight: 55 },
    { source: 'F', target: 'G', weight: 95 }
  ]);

  const [graph, setGraph] = useState({});
  const [startNode, setStartNode] = useState('A');
  const [endNode, setEndNode] = useState('G');
  const [result, setResult] = useState(null);
  const [algorithm, setAlgorithm] = useState({ steps: [], current: -1 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [editEdge, setEditEdge] = useState(null);
  const [editWeight, setEditWeight] = useState('');
  const [selectedNodes, setSelectedNodes] = useState([]);
  const svgRef = useRef(null);

  // Convertir les nœuds et arêtes en graphe
  useEffect(() => {
    const newGraph = {};
    nodes.forEach(node => {
      newGraph[node.id] = {};
    });

    edges.forEach(edge => {
      newGraph[edge.source][edge.target] = edge.weight;
      newGraph[edge.target][edge.source] = edge.weight; // Rendre le graphe non dirigé
    });

    setGraph(newGraph);
  }, [nodes, edges]);

  // Inverse des poids pour trouver le chemin de poids maximum
  const inverseWeights = (graph) => {
    const invertedGraph = {};
    
    Object.keys(graph).forEach(node => {
      invertedGraph[node] = {};
      
      Object.entries(graph[node]).forEach(([neighbor, weight]) => {
        // Inverser les poids: 100 - poids original
        invertedGraph[node][neighbor] = 100 - weight;
      });
    });
    
    return invertedGraph;
  };

  // Algorithme de Dijkstra avec enregistrement des étapes
  const dijkstra = (graph, startNode, endNode) => {
    const steps = [];
    
    // Inverser les poids pour transformer la recherche de max en recherche de min
    const invertedGraph = inverseWeights(graph);
    
    // Ensemble des nœuds non visités
    const unvisited = new Set(Object.keys(invertedGraph));
    
    // Distances du nœud de départ à chaque nœud
    const distances = {};
    
    // Nœud précédent dans le chemin optimal
    const previous = {};
    
    // Initialiser les distances
    Object.keys(invertedGraph).forEach(node => {
      distances[node] = Infinity;
      previous[node] = null;
    });
    
    // Distance au nœud de départ est 0
    distances[startNode] = 0;
    
    // Enregistrer l'état initial
    steps.push({
      currentNode: null,
      distances: { ...distances },
      previous: { ...previous },
      unvisited: [...unvisited],
      description: "Initialisation des distances. La distance au nœud de départ est 0, toutes les autres sont infinies."
    });
    
    while (unvisited.size > 0) {
      // Trouver le nœud non visité avec la plus petite distance
      let currentNode = null;
      let smallestDistance = Infinity;
      
      unvisited.forEach(node => {
        if (distances[node] < smallestDistance) {
          smallestDistance = distances[node];
          currentNode = node;
        }
      });
      
      // Si nous avons atteint le nœud cible ou s'il n'y a plus de chemin possible
      if (currentNode === null) {
        steps.push({
          currentNode: null,
          distances: { ...distances },
          previous: { ...previous },
          unvisited: [...unvisited],
          description: "Aucun chemin possible vers les nœuds restants."
        });
        break;
      }
      
      if (currentNode === endNode) {
        steps.push({
          currentNode,
          distances: { ...distances },
          previous: { ...previous },
          unvisited: [...unvisited],
          description: `Nœud cible atteint. Fin de l'algorithme.`
        });
        break;
      }
      
      // Supprimer le nœud courant de l'ensemble des nœuds non visités
      unvisited.delete(currentNode);
      
      // Pour chaque voisin du nœud courant
      const updates = [];
      Object.entries(invertedGraph[currentNode]).forEach(([neighbor, weight]) => {
        if (unvisited.has(neighbor)) {
          // Calculer la nouvelle distance
          const distance = distances[currentNode] + weight;
          
          // Si la nouvelle distance est plus petite, mettre à jour
          if (distance < distances[neighbor]) {
            distances[neighbor] = distance;
            previous[neighbor] = currentNode;
            updates.push({ node: neighbor, oldDistance: Infinity, newDistance: distance });
          }
        }
      });
      
      steps.push({
        currentNode,
        distances: { ...distances },
        previous: { ...previous },
        unvisited: [...unvisited],
        updates,
        description: `Examen du nœud ${currentNode}. ${updates.length > 0 ? 
          `Distances mises à jour pour : ${updates.map(u => u.node).join(', ')}.` : 
          "Aucune distance mise à jour."}`
      });
    }
    
    // Reconstituer le chemin
    const path = [];
    let current = endNode;
    
    if (previous[endNode] !== null || endNode === startNode) {
      while (current !== null) {
        path.unshift(current);
        current = previous[current];
      }
      
      // Calculer le poids total du chemin dans le graphe original
      let totalWeight = 0;
      for (let i = 0; i < path.length - 1; i++) {
        totalWeight += graph[path[i]][path[i + 1]];
      }
      
      steps.push({
        result: {
          path,
          invertedDistance: distances[endNode],
          originalDistance: totalWeight
        },
        description: `Chemin trouvé : ${path.join(' → ')}. Poids total : ${totalWeight}.`
      });
      
      return {
        path,
        invertedDistance: distances[endNode],
        originalDistance: totalWeight,
        steps
      };
    } else {
      steps.push({
        result: null,
        description: "Aucun chemin trouvé entre le nœud de départ et le nœud d'arrivée."
      });
      
      return {
        path: [],
        invertedDistance: Infinity,
        originalDistance: 0,
        steps
      };
    }
  };

  // Exécuter l'algorithme lorsque les nœuds ou les arêtes changent
  useEffect(() => {
    if (Object.keys(graph).length > 0 && startNode && endNode && graph[startNode] && graph[endNode]) {
      const result = dijkstra(graph, startNode, endNode);
      setResult(result);
      setAlgorithm({ steps: result.steps, current: 0 });
    }
  }, [graph, startNode, endNode]);

  // Ajouter un nouveau nœud
  const addNode = () => {
    // Générer un nouvel ID (A, B, C, ...)
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const existingIds = nodes.map(n => n.id);
    
    let newId = '';
    for (let i = 0; i < alphabet.length; i++) {
      if (!existingIds.includes(alphabet[i])) {
        newId = alphabet[i];
        break;
      }
    }
    
    // Si tous les caractères simples sont utilisés, utiliser des combinaisons (AA, AB, ...)
    if (!newId) {
      let index = 0;
      do {
        const first = Math.floor(index / 26);
        const second = index % 26;
        newId = (first > 0 ? alphabet[first - 1] : '') + alphabet[second];
        index++;
      } while (existingIds.includes(newId));
    }
    
    // Ajouter le nouveau nœud à une position aléatoire
    setNodes([...nodes, { id: newId, x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 }]);
  };

  // Supprimer un nœud
  const deleteNode = (nodeId) => {
    // Supprimer le nœud
    setNodes(nodes.filter(n => n.id !== nodeId));
    
    // Supprimer toutes les arêtes connectées à ce nœud
    setEdges(edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    
    // Mettre à jour les nœuds de départ et d'arrivée si nécessaire
    if (startNode === nodeId) {
      setStartNode(nodes[0]?.id !== nodeId ? nodes[0]?.id : nodes[1]?.id);
    }
    if (endNode === nodeId) {
      setEndNode(nodes[0]?.id !== nodeId ? nodes[0]?.id : nodes[1]?.id);
    }
    
    // Enlever le nœud des sélectionnés
    setSelectedNodes(selectedNodes.filter(id => id !== nodeId));
  };

  // Commencer à déplacer un nœud
  const startDragNode = (event, nodeId) => {
    const svgRect = svgRef.current.getBoundingClientRect();
    const offsetX = event.clientX - svgRect.left;
    const offsetY = event.clientY - svgRect.top;
    
    setDraggedNode({
      id: nodeId,
      offsetX,
      offsetY
    });
  };

  // Déplacer un nœud
  const moveNode = (event) => {
    if (draggedNode) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - svgRect.left;
      const y = event.clientY - svgRect.top;
      
      setNodes(nodes.map(node => 
        node.id === draggedNode.id 
          ? { ...node, x, y } 
          : node
      ));
    }
  };

  // Terminer le déplacement d'un nœud
  const stopDragNode = () => {
    setDraggedNode(null);
  };

  // Sélectionner un nœud
  const toggleNodeSelection = (nodeId) => {
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter(id => id !== nodeId));
    } else {
      setSelectedNodes([...selectedNodes, nodeId]);
      
      // Si deux nœuds sont sélectionnés, proposer de créer un lien
      if (selectedNodes.length === 1) {
        const otherNodeId = selectedNodes[0];
        const edgeExists = edges.some(edge => 
          (edge.source === nodeId && edge.target === otherNodeId) || 
          (edge.source === otherNodeId && edge.target === nodeId)
        );
        
        if (!edgeExists && nodeId !== otherNodeId) {
          addEdge(otherNodeId, nodeId);
          setSelectedNodes([]);
        } else {
          setSelectedNodes([nodeId]);
        }
      }
    }
  };

  // Modifier le poids d'une arête
  const modifyEdgeWeight = (sourceId, targetId) => {
    const edge = edges.find(e => 
      (e.source === sourceId && e.target === targetId) || 
      (e.source === targetId && e.target === sourceId)
    );
    
    if (edge) {
      setEditEdge(edge);
      setEditWeight(edge.weight.toString());
    }
  };

  // Sauvegarder le nouveau poids d'une arête
  const saveEdgeWeight = () => {
    const weight = parseInt(editWeight, 10);
    if (!isNaN(weight) && weight > 0 && weight <= 100) {
      setEdges(edges.map(edge => 
        (edge.source === editEdge.source && edge.target === editEdge.target) ||
        (edge.source === editEdge.target && edge.target === editEdge.source)
          ? { ...edge, weight }
          : edge
      ));
    }
    setEditEdge(null);
  };

  // Ajouter une nouvelle arête entre deux nœuds
  const addEdge = (sourceId, targetId) => {
    // Vérifier si cette arête existe déjà
    const edgeExists = edges.some(edge => 
      (edge.source === sourceId && edge.target === targetId) || 
      (edge.source === targetId && edge.target === sourceId)
    );
    
    if (!edgeExists && sourceId !== targetId) {
      const newEdge = {
        source: sourceId,
        target: targetId,
        weight: 50 // Poids par défaut
      };
      
      setEdges([...edges, newEdge]);
      setEditEdge(newEdge);
      setEditWeight('50');
    }
  };

  // Supprimer une arête
  const deleteEdge = (sourceId, targetId) => {
    setEdges(edges.filter(edge => 
      !((edge.source === sourceId && edge.target === targetId) || 
        (edge.source === targetId && edge.target === sourceId))
    ));
  };

  // Avancer d'une étape dans l'algorithme
  const nextStep = () => {
    if (algorithm.current < algorithm.steps.length - 1) {
      setAlgorithm({
        ...algorithm,
        current: algorithm.current + 1
      });
    }
  };

  // Reculer d'une étape dans l'algorithme
  const prevStep = () => {
    if (algorithm.current > 0) {
      setAlgorithm({
        ...algorithm,
        current: algorithm.current - 1
      });
    }
  };

  // Trouver un nœud par son ID
  const findNodeById = (id) => {
    return nodes.find(node => node.id === id);
  };

  // Obtenir la couleur d'un nœud en fonction de l'algorithme
  const getNodeColor = (nodeId) => {
    // Si le nœud est sélectionné
    if (selectedNodes.includes(nodeId)) {
      return '#FF9800'; // Orange
    }
    
    if (!algorithm || algorithm.current < 0 || algorithm.steps.length === 0) {
      return nodeId === startNode ? '#4CAF50' : nodeId === endNode ? '#F44336' : '#2196F3';
    }
    
    const step = algorithm.steps[algorithm.current];
    
    if (step.result) {
      return step.result.path.includes(nodeId) 
        ? nodeId === startNode || nodeId === endNode ? '#FFC107' : '#FF9800'
        : '#2196F3';
    }
    
    if (nodeId === startNode) return '#4CAF50';
    if (nodeId === endNode) return '#F44336';
    if (nodeId === step.currentNode) return '#9C27B0';
    if (step.updates?.some(u => u.node === nodeId)) return '#FFC107';
    
    return '#2196F3';
  };

  // Obtenir la couleur d'une arête en fonction de l'algorithme
  const getEdgeColor = (sourceId, targetId) => {
    if (!result || !result.path) return '#666';
    
    for (let i = 0; i < result.path.length - 1; i++) {
      if ((result.path[i] === sourceId && result.path[i + 1] === targetId) ||
          (result.path[i] === targetId && result.path[i + 1] === sourceId)) {
        return '#FF9800';
      }
    }
    
    return '#666';
  };
  
  // Créer un lien entre deux nœuds sélectionnés
  const createLinkBetweenSelected = () => {
    if (selectedNodes.length === 2) {
      addEdge(selectedNodes[0], selectedNodes[1]);
      setSelectedNodes([]);
    }
  };

  // Modifier tous les poids d'une valeur donnée
  const adjustAllWeights = (change) => {
    const newEdges = edges.map(edge => {
      let newWeight = edge.weight + change;
      // Limiter entre 1 et 100
      newWeight = Math.max(1, Math.min(100, newWeight));
      return { ...edge, weight: newWeight };
    });
    setEdges(newEdges);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Algorithme de Dijkstra Maximum Interactif</h1>
      
      <div className="flex flex-wrap gap-4 mb-4">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={addNode}
        >
          Ajouter un nœud
        </button>
        
        <button 
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onClick={createLinkBetweenSelected}
          disabled={selectedNodes.length !== 2}
        >
          Créer lien entre sélectionnés
        </button>
        
        <div className="flex items-center gap-2">
          <span>Modifier poids:</span>
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
            onClick={() => adjustAllWeights(-5)}
          >
            -5
          </button>
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
            onClick={() => adjustAllWeights(-1)}
          >
            -1
          </button>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
            onClick={() => adjustAllWeights(1)}
          >
            +1
          </button>
          <button 
            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
            onClick={() => adjustAllWeights(5)}
          >
            +5
          </button>
        </div>
        
        <div>
          <label className="mr-2">Nœud de départ:</label>
          <select 
            value={startNode} 
            onChange={(e) => setStartNode(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>
                {node.id}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="mr-2">Nœud d'arrivée:</label>
          <select 
            value={endNode} 
            onChange={(e) => setEndNode(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>
                {node.id}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Visualisation du graphe */}
        <div className="w-full md:w-2/3 bg-white p-4 border rounded">
          <div className="bg-gray-100 border rounded relative h-96">
            <svg 
              ref={svgRef}
              width="100%" 
              height="100%" 
              onMouseMove={moveNode} 
              onMouseUp={stopDragNode} 
              onMouseLeave={stopDragNode}
            >
              {/* Arêtes */}
              {edges.map(edge => {
                const sourceNode = findNodeById(edge.source);
                const targetNode = findNodeById(edge.target);
                return (
                  <g key={`${edge.source}-${edge.target}`}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={getEdgeColor(edge.source, edge.target)}
                      strokeWidth="2"
                    />
                    {/* Fond blanc pour le poids pour meilleure lisibilité */}
                    <rect
                      x={(sourceNode.x + targetNode.x) / 2 - 15}
                      y={(sourceNode.y + targetNode.y) / 2 - 20}
                      width="30"
                      height="20"
                      fill="white"
                      rx="5"
                      ry="5"
                    />
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 - 5}
                      textAnchor="middle"
                      fill="#333"
                      onClick={() => modifyEdgeWeight(edge.source, edge.target)}
                      className="cursor-pointer font-bold"
                    >
                      {edge.weight}
                    </text>
                    {/* Bouton supprimer arête */}
                    <circle
                      cx={(sourceNode.x + targetNode.x) / 2}
                      cy={(sourceNode.y + targetNode.y) / 2 + 15}
                      r="10"
                      fill="#FF5252"
                      onClick={() => deleteEdge(edge.source, edge.target)}
                      className="cursor-pointer"
                    />
                    <text
                      x={(sourceNode.x + targetNode.x) / 2}
                      y={(sourceNode.y + targetNode.y) / 2 + 18}
                      textAnchor="middle"
                      fill="white"
                      fontSize="12"
                      onClick={() => deleteEdge(edge.source, edge.target)}
                      className="cursor-pointer font-bold"
                    >
                      -
                    </text>
                  </g>
                );
              })}
              
              {/* Nœuds */}
              {nodes.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill={getNodeColor(node.id)}
                    stroke={selectedNodes.includes(node.id) ? "black" : "none"}
                    strokeWidth="2"
                    onMouseDown={(e) => startDragNode(e, node.id)}
                    onClick={() => toggleNodeSelection(node.id)}
                    className="cursor-pointer"
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    fill="white"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {node.id}
                  </text>
                  
                  {/* Bouton supprimer nœud */}
                  <circle
                    cx={node.x + 20}
                    cy={node.y - 20}
                    r="10"
                    fill="#F44336"
                    onClick={() => deleteNode(node.id)}
                    className="cursor-pointer"
                  />
                  <text
                    x={node.x + 20}
                    y={node.y - 17}
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    onClick={() => deleteNode(node.id)}
                    className="cursor-pointer"
                  >
                    x
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Légende */}
            <div className="absolute bottom-2 right-2 bg-white p-2 border rounded text-sm">
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                <span>Nœud normal</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-green-500 mr-2"></div>
                <span>Nœud de départ</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-red-500 mr-2"></div>
                <span>Nœud d'arrivée</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-purple-500 mr-2"></div>
                <span>Nœud courant</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-4 h-4 bg-orange-500 mr-2"></div>
                <span>Chemin optimal</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-black bg-white mr-2"></div>
                <span>Nœud sélectionné</span>
              </div>
            </div>
          </div>
          
          {/* Contrôles de l'algorithme */}
          <div className="mt-4 flex justify-between items-center">
            <div>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded mr-2"
                onClick={prevStep}
                disabled={algorithm.current <= 0}
              >
                Précédent
              </button>
              <button 
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                onClick={nextStep}
                disabled={algorithm.current >= algorithm.steps.length - 1}
              >
                Suivant
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Étape {algorithm.current + 1} / {algorithm.steps.length}
            </div>
          </div>
          
          {/* Description de l'étape courante */}
          {algorithm.steps.length > 0 && algorithm.current >= 0 && (
            <div className="mt-4 p-3 bg-gray-100 border rounded">
              <h3 className="font-semibold mb-1">Étape {algorithm.current + 1}:</h3>
              <p>{algorithm.steps[algorithm.current].description}</p>
            </div>
          )}
        </div>
        
        {/* Tableaux des étapes */}
        <div className="w-full md:w-1/3">
          {algorithm.steps.length > 0 && algorithm.current >= 0 && (
            <div className="bg-white p-4 border rounded">
              <h2 className="text-lg font-semibold mb-3">Tableau des distances</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1 bg-gray-100">Nœud</th>
                      <th className="border px-2 py-1 bg-gray-100">Distance</th>
                      <th className="border px-2 py-1 bg-gray-100">Précédent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(algorithm.steps[algorithm.current].distances || {}).map(nodeId => {
                      const distance = algorithm.steps[algorithm.current].distances[nodeId];
                      const previous = algorithm.steps[algorithm.current].previous?.[nodeId];
                      const isUpdated = algorithm.steps[algorithm.current].updates?.some(u => u.node === nodeId);
                      
                      return (
                        <tr key={nodeId} className={isUpdated ? "bg-yellow-100" : ""}>
                          <td className="border px-2 py-1">{nodeId}</td>
                          <td className="border px-2 py-1">
                            {distance === Infinity ? "∞" : Math.round(distance * 100) / 100}
                          </td>
                          <td className="border px-2 py-1">{previous || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Nœuds non visités */}
              <h3 className="text-md font-semibold mt-4 mb-2">Nœuds non visités:</h3>
              <div className="flex flex-wrap gap-2">
                {algorithm.steps[algorithm.current].unvisited?.map(nodeId => (
                  <span key={nodeId} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {nodeId}
                  </span>
                ))}
              </div>
              
              {/* Résultat final */}
              {algorithm.steps[algorithm.current].result && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <h3 className="font-semibold text-green-800 mb-2">Résultat final:</h3>
                  <p><strong>Chemin:</strong> {algorithm.steps[algorithm.current].result.path.join(' → ')}</p>
                  <p><strong>Poids total:</strong> {algorithm.steps[algorithm.current].result.originalDistance}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal pour modifier le poids d'une arête */}
      {editEdge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded shadow-lg w-64">
            <h3 className="font-bold mb-3">Modifier le poids</h3>
            <p className="mb-3">
              Arête: {editEdge.source} → {editEdge.target}
            </p>
            <div className="mb-3">
              <label className="block mb-1">Poids (1-100):</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={editWeight} 
                onChange={(e) => setEditWeight(e.target.value)}
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded"
                onClick={() => setEditEdge(null)}
              >
                Annuler
              </button>
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={saveEdgeWeight}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DijkstraMaximumInteractive;
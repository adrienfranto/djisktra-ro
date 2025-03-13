import React, { useState, useEffect } from 'react';

const DijkstraMaximumMety = () => {
  // État initial avec quelques nœuds et arêtes
  const [nodes, setNodes] = useState([
    { id: 'A', x: 100, y: 100 },
    { id: 'B', x: 200, y: 50 },
    { id: 'C', x: 200, y: 150 },
    { id: 'D', x: 300, y: 100 }
  ]);
  
  const [edges, setEdges] = useState([
    { source: 'A', target: 'B', weight: 5 },
    { source: 'A', target: 'C', weight: 3 },
    { source: 'B', target: 'D', weight: 2 },
    { source: 'C', target: 'D', weight: 6 }
  ]);
  
  const [sourceNode, setSourceNode] = useState('A');
  const [targetNode, setTargetNode] = useState('D');
  const [path, setPath] = useState(['A', 'C', 'D']); // Chemin initial correct
  const [maxDistance, setMaxDistance] = useState(9); // Poids total initial correct
  const [draggingNode, setDraggingNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [newWeight, setNewWeight] = useState('');
  
  // Nouvelles variables d'état pour l'ajout d'arêtes
  const [addingEdge, setAddingEdge] = useState(false);
  const [newEdgeSource, setNewEdgeSource] = useState(null);
  const [newEdgeTarget, setNewEdgeTarget] = useState(null);
  const [newEdgeWeight, setNewEdgeWeight] = useState('5');
  const [maxPathsToShow, setMaxPathsToShow] = useState(1);
  const [allFoundPaths, setAllFoundPaths] = useState([]);
  
  // Génération de l'ID suivant en format alphabétique (A, B, C, ...)
  const getNextNodeId = () => {
    if (nodes.length === 0) return 'A';
    
    // Trouver la lettre de l'alphabet la plus élevée utilisée
    const nodeIds = nodes.map(node => node.id);
    let maxCharCode = 'A'.charCodeAt(0) - 1;
    
    for (const id of nodeIds) {
      const charCode = id.charCodeAt(0);
      if (charCode > maxCharCode) {
        maxCharCode = charCode;
      }
    }
    
    return String.fromCharCode(maxCharCode + 1);
  };
  
  // Ajouter un nouveau nœud
  const addNode = () => {
    const newId = getNextNodeId();
    const newNode = {
      id: newId,
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100
    };
    setNodes([...nodes, newNode]);
  };
  
  // Supprimer un nœud et toutes ses arêtes connectées
  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  };
  
  // Mise à jour du poids d'une arête
  const updateEdgeWeight = () => {
    if (selectedEdge && newWeight) {
      setEdges(edges.map(edge => 
        (edge.source === selectedEdge.source && edge.target === selectedEdge.target) 
          ? { ...edge, weight: parseInt(newWeight) } 
          : edge
      ));
      setSelectedEdge(null);
      setNewWeight('');
    }
  };
  
  // Démarrer le mode d'ajout d'arête
  const startAddingEdge = () => {
    setAddingEdge(true);
    setNewEdgeSource(null);
    setNewEdgeTarget(null);
  };
  
  // Annuler l'ajout d'arête
  const cancelAddingEdge = () => {
    setAddingEdge(false);
    setNewEdgeSource(null);
    setNewEdgeTarget(null);
  };
  
  // Gérer le clic sur un nœud en mode d'ajout d'arête
  const handleNodeClickForEdge = (nodeId) => {
    if (!addingEdge) return;
    
    if (!newEdgeSource) {
      setNewEdgeSource(nodeId);
    } else if (nodeId !== newEdgeSource) {
      setNewEdgeTarget(nodeId);
      
      // Vérifier si cette arête existe déjà
      const edgeExists = edges.some(edge => 
        (edge.source === newEdgeSource && edge.target === nodeId) ||
        (edge.source === nodeId && edge.target === newEdgeSource)
      );
      
      if (!edgeExists) {
        const newEdge = {
          source: newEdgeSource,
          target: nodeId,
          weight: parseInt(newEdgeWeight)
        };
        setEdges([...edges, newEdge]);
      }
      
      // Réinitialiser l'état pour ajouter une autre arête
      setNewEdgeSource(null);
      setNewEdgeTarget(null);
    }
  };
  
  // Démarrer le glissement d'un nœud
  const startDragging = (nodeId, e) => {
    if (addingEdge) {
      handleNodeClickForEdge(nodeId);
    } else {
      e.preventDefault();
      setDraggingNode(nodeId);
    }
  };
  
  // Arrêter le glissement
  const stopDragging = () => {
    setDraggingNode(null);
  };
  
  // Mettre à jour la position du nœud lors du glissement
  const onMouseMove = (e) => {
    if (draggingNode) {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;
      
      setNodes(nodes.map(node => 
        node.id === draggingNode ? { ...node, x, y } : node
      ));
    }
  };
  
  // Sélectionner une arête pour modifier son poids
  const selectEdge = (edge) => {
    if (addingEdge) return;
    setSelectedEdge(edge);
    setNewWeight(edge.weight.toString());
  };
  
  // Fonction qui trouve tous les chemins possibles entre deux nœuds
  const findAllPaths = (graph, start, end, visited = new Set(), currentPath = [], allPaths = []) => {
    // Ajouter le nœud actuel au chemin et le marquer comme visité
    currentPath.push(start);
    visited.add(start);
    
    // Si nous avons atteint la destination, ajouter le chemin actuel à la liste des chemins
    if (start === end) {
      allPaths.push([...currentPath]);
    } else {
      // Explorer tous les voisins non visités
      for (const neighbor in graph[start]) {
        if (!visited.has(neighbor)) {
          findAllPaths(graph, neighbor, end, new Set(visited), [...currentPath], allPaths);
        }
      }
    }
    
    return allPaths;
  };
  
  // Calculer le poids total d'un chemin
  const calculatePathWeight = (graph, path) => {
    let weight = 0;
    for (let i = 0; i < path.length - 1; i++) {
      weight += graph[path[i]][path[i+1]];
    }
    return weight;
  };
  
  // Algorithme pour trouver les chemins avec les poids maximums
  const findMaximumPaths = () => {
    if (!sourceNode || !targetNode || sourceNode === targetNode) {
      setPath([]);
      setMaxDistance(0);
      setAllFoundPaths([]);
      return;
    }
    
    // Créer le graphe à partir des arêtes
    const graph = {};
    nodes.forEach(node => {
      graph[node.id] = {};
    });
    
    edges.forEach(edge => {
      graph[edge.source][edge.target] = edge.weight;
      graph[edge.target][edge.source] = edge.weight; // Pour un graphe non dirigé
    });
    
    // Trouver tous les chemins possibles
    const allPaths = findAllPaths(graph, sourceNode, targetNode);
    
    if (allPaths.length === 0) {
      setPath([]);
      setMaxDistance(0);
      setAllFoundPaths([]);
      return;
    }
    
    // Calculer le poids de chaque chemin
    const pathsWithWeights = allPaths.map(path => ({
      path,
      weight: calculatePathWeight(graph, path)
    }));
    
    // Trier les chemins par poids (du plus grand au plus petit)
    pathsWithWeights.sort((a, b) => b.weight - a.weight);
    
    // Limiter le nombre de chemins selon maxPathsToShow
    const topPaths = pathsWithWeights.slice(0, maxPathsToShow);
    
    // Mettre à jour l'état avec le meilleur chemin (pour la compatibilité avec le code existant)
    setPath(topPaths[0].path);
    setMaxDistance(topPaths[0].weight);
    
    // Stocker tous les chemins trouvés (limités par maxPathsToShow)
    setAllFoundPaths(topPaths);
  };
  
  // Effet pour exécuter l'algorithme quand les paramètres changent
  useEffect(() => {
    findMaximumPaths();
  }, [sourceNode, targetNode, edges, nodes, maxPathsToShow]);
  
  // Vérifier si une arête fait partie d'un des chemins trouvés
  const isEdgeInAnyPath = (source, target) => {
    for (const pathData of allFoundPaths) {
      const currentPath = pathData.path;
      for (let i = 0; i < currentPath.length - 1; i++) {
        if ((currentPath[i] === source && currentPath[i + 1] === target) ||
            (currentPath[i] === target && currentPath[i + 1] === source)) {
          return true;
        }
      }
    }
    return false;
  };
  
  // Obtenir la couleur d'une arête en fonction de son chemin
  const getEdgeColor = (source, target) => {
    for (let i = 0; i < allFoundPaths.length; i++) {
      const currentPath = allFoundPaths[i].path;
      for (let j = 0; j < currentPath.length - 1; j++) {
        if ((currentPath[j] === source && currentPath[j + 1] === target) ||
            (currentPath[j] === target && currentPath[j + 1] === source)) {
          // Utiliser différentes teintes de vert pour différents chemins
          const colors = ['#008000', '#00A000', '#00C000', '#00E000', '#00FF00'];
          return colors[Math.min(i, colors.length - 1)];
        }
      }
    }
    return 'gray';
  };
  
  // Obtenir la couleur d'un nœud
  const getNodeColor = (nodeId) => {
    if (nodeId === sourceNode) return "blue";
    if (nodeId === targetNode) return "red";
    
    for (const pathData of allFoundPaths) {
      if (pathData.path.includes(nodeId)) {
        return "green";
      }
    }
    
    return "gray";
  };
  
  return (
    <div className="p-4 w-full">
      <h2 className="text-2xl font-bold mb-4">Algorithme du Chemin Maximum</h2>
      
      <div className="flex mb-4 space-x-4 flex-wrap">
        <button 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={addNode}
        >
          Ajouter Nœud
        </button>
        
        {!addingEdge ? (
          <button 
            className="bg-purple-500 text-white px-4 py-2 rounded"
            onClick={startAddingEdge}
          >
            Ajouter Lien
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <span>
              {newEdgeSource ? `De ${newEdgeSource} vers...` : 'Cliquez sur un nœud de départ'}
            </span>
            <input 
              type="number" 
              value={newEdgeWeight} 
              onChange={(e) => setNewEdgeWeight(e.target.value)}
              className="border p-1 w-16"
              placeholder="Poids"
            />
            <button 
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={cancelAddingEdge}
            >
              Annuler
            </button>
          </div>
        )}
        
        <div>
          <label className="mr-2">Nœud de départ:</label>
          <select 
            value={sourceNode} 
            onChange={(e) => setSourceNode(e.target.value)}
            className="border p-2 rounded"
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{node.id}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="mr-2">Nœud d'arrivée:</label>
          <select 
            value={targetNode} 
            onChange={(e) => setTargetNode(e.target.value)}
            className="border p-2 rounded"
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{node.id}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="mr-2">Nombre de chemins à afficher:</label>
          <input 
            type="number" 
            value={maxPathsToShow} 
            onChange={(e) => setMaxPathsToShow(Math.max(1, parseInt(e.target.value) || 1))}
            className="border p-2 rounded w-16"
            min="1"
          />
        </div>
      </div>
      
      {selectedEdge && (
        <div className="mb-4 p-2 border rounded bg-gray-100">
          <p>Modifier le poids: {selectedEdge.source} → {selectedEdge.target}</p>
          <input 
            type="number" 
            value={newWeight} 
            onChange={(e) => setNewWeight(e.target.value)}
            className="border p-1 mr-2"
          />
          <button 
            onClick={updateEdgeWeight}
            className="bg-green-500 text-white px-2 py-1 rounded"
          >
            Mettre à jour
          </button>
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-semibold">
          Chemins maximums trouvés:
        </p>
        {allFoundPaths.length > 0 ? (
          <ul className="list-disc ml-6">
            {allFoundPaths.map((pathData, index) => (
              <li key={index}>
                {pathData.path.join(' → ')} (Poids total: {pathData.weight})
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun chemin trouvé</p>
        )}
      </div>
      
      <div className="border p-2 bg-gray-50">
        <svg 
          width="600" 
          height="400" 
          viewBox="0 0 600 400"
          onMouseMove={onMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className="bg-white"
        >
          {/* Dessiner les arêtes */}
          {edges.map((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;
            
            const isInPath = isEdgeInAnyPath(edge.source, edge.target);
            const edgeColor = getEdgeColor(edge.source, edge.target);
            
            return (
              <g key={`edge-${index}`}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edgeColor}
                  strokeWidth={isInPath ? 3 : 1}
                  onClick={() => selectEdge(edge)}
                  className="cursor-pointer"
                />
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 10}
                  textAnchor="middle"
                  fill={isInPath ? edgeColor : "black"}
                  fontSize="12"
                  fontWeight={isInPath ? "bold" : "normal"}
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}
          
          {/* Si en train d'ajouter une arête et qu'un nœud de départ est sélectionné, dessiner une ligne de ce nœud vers la souris */}
          {addingEdge && newEdgeSource && (
            <line
              x1={nodes.find(n => n.id === newEdgeSource)?.x || 0}
              y1={nodes.find(n => n.id === newEdgeSource)?.y || 0}
              x2={draggingNode ? nodes.find(n => n.id === draggingNode)?.x || 0 : 0}
              y2={draggingNode ? nodes.find(n => n.id === draggingNode)?.y || 0 : 0}
              stroke="blue"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}
          
          {/* Dessiner les nœuds */}
          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={20}
                fill={getNodeColor(node.id)}
                onMouseDown={(e) => startDragging(node.id, e)}
                className={addingEdge ? "cursor-pointer" : "cursor-move"}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
              >
                {node.id}
              </text>
              <circle
                cx={node.x + 15}
                cy={node.y - 15}
                r={8}
                fill="red"
                onClick={() => deleteNode(node.id)}
                className="cursor-pointer"
              />
              <text
                x={node.x + 15}
                y={node.y - 15}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                X
              </text>
            </g>
          ))}
        </svg>
      </div>
      
      <div className="mt-4">
        <h3 className="font-bold">Instructions:</h3>
        <ul className="list-disc ml-6">
          <li>Cliquez sur "Ajouter Nœud" pour ajouter un nouveau nœud</li>
          <li>Cliquez sur "Ajouter Lien" pour créer une arête entre deux nœuds</li>
          <li>Glissez les nœuds pour les déplacer</li>
          <li>Cliquez sur "X" pour supprimer un nœud</li>
          <li>Cliquez sur une arête pour modifier son poids</li>
          <li>Sélectionnez les nœuds de départ et d'arrivée pour calculer le chemin maximum</li>
          <li>Modifiez le nombre de chemins à afficher pour voir plusieurs alternatives</li>
        </ul>
      </div>
    </div>
  );
};

export default DijkstraMaximumMety;
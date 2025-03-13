import React, { useState, useEffect } from 'react';

export default function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1500);
  
  // Graphe d'exemple
  const initialGraph = {
    A: { B: 5, C: 2 },
    B: { A: 5, C: 1, D: 3 },
    C: { A: 2, B: 1, D: 6 },
    D: { B: 3, C: 6, E: 2 },
    E: { D: 2 }
  };
  
  // Positions des nœuds pour la visualisation
  const nodePositions = {
    A: { x: 100, y: 100 },
    B: { x: 300, y: 100 },
    C: { x: 200, y: 250 },
    D: { x: 400, y: 250 },
    E: { x: 550, y: 150 }
  };
  
  // Étapes de l'algorithme
  const steps = [
    {
      description: "Initialisation : Définir le coût maximal à 0 pour le nœud de départ (A) et à l'infini pour tous les autres nœuds",
      costs: { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity },
      previous: { A: null, B: null, C: null, D: null, E: null },
      visitedNodes: [],
      currentNode: null,
      highlightEdges: []
    },
    {
      description: "Sélectionner le nœud avec le coût minimal (A) et le marquer comme visité",
      costs: { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity },
      previous: { A: null, B: null, C: null, D: null, E: null },
      visitedNodes: ['A'],
      currentNode: 'A',
      highlightEdges: []
    },
    {
      description: "Mise à jour des voisins de A - calculer max(0, poids) pour chaque arête",
      costs: { A: 0, B: 5, C: 2, D: Infinity, E: Infinity },
      previous: { A: null, B: 'A', C: 'A', D: null, E: null },
      visitedNodes: ['A'],
      currentNode: 'A',
      highlightEdges: ['A-B', 'A-C']
    },
    {
      description: "Sélectionner le nœud avec le coût minimal (C) et le marquer comme visité",
      costs: { A: 0, B: 5, C: 2, D: Infinity, E: Infinity },
      previous: { A: null, B: 'A', C: 'A', D: null, E: null },
      visitedNodes: ['A', 'C'],
      currentNode: 'C',
      highlightEdges: []
    },
    {
      description: "Mise à jour des voisins de C - calculer max(2, poids) pour chaque arête",
      costs: { A: 0, B: 2, C: 2, D: 6, E: Infinity },
      previous: { A: null, B: 'C', C: 'A', D: 'C', E: null },
      visitedNodes: ['A', 'C'],
      currentNode: 'C',
      highlightEdges: ['C-B', 'C-D']
    },
    {
      description: "Sélectionner le nœud avec le coût minimal (B) et le marquer comme visité",
      costs: { A: 0, B: 2, C: 2, D: 6, E: Infinity },
      previous: { A: null, B: 'C', C: 'A', D: 'C', E: null },
      visitedNodes: ['A', 'C', 'B'],
      currentNode: 'B',
      highlightEdges: []
    },
    {
      description: "Mise à jour des voisins de B - calculer max(2, poids) pour chaque arête",
      costs: { A: 0, B: 2, C: 2, D: 3, E: Infinity },
      previous: { A: null, B: 'C', C: 'A', D: 'B', E: null },
      visitedNodes: ['A', 'C', 'B'],
      currentNode: 'B',
      highlightEdges: ['B-D']
    },
    {
      description: "Sélectionner le nœud avec le coût minimal (D) et le marquer comme visité",
      costs: { A: 0, B: 2, C: 2, D: 3, E: Infinity },
      previous: { A: null, B: 'C', C: 'A', D: 'B', E: null },
      visitedNodes: ['A', 'C', 'B', 'D'],
      currentNode: 'D',
      highlightEdges: []
    },
    {
      description: "Mise à jour des voisins de D - calculer max(3, poids) pour chaque arête",
      costs: { A: 0, B: 2, C: 2, D: 3, E: 3 },
      previous: { A: null, B: 'C', C: 'A', D: 'B', E: 'D' },
      visitedNodes: ['A', 'C', 'B', 'D'],
      currentNode: 'D',
      highlightEdges: ['D-E']
    },
    {
      description: "Sélectionner le nœud avec le coût minimal (E) et le marquer comme visité",
      costs: { A: 0, B: 2, C: 2, D: 3, E: 3 },
      previous: { A: null, B: 'C', C: 'A', D: 'B', E: 'D' },
      visitedNodes: ['A', 'C', 'B', 'D', 'E'],
      currentNode: 'E',
      highlightEdges: []
    },
    {
      description: "Algorithme terminé - chemin trouvé : A → C → B → D → E avec valeur Min-Max de 3",
      costs: { A: 0, B: 2, C: 2, D: 3, E: 3 },
      previous: { A: null, B: 'C', C: 'A', D: 'B', E: 'D' },
      visitedNodes: ['A', 'C', 'B', 'D', 'E'],
      currentNode: 'E',
      highlightEdges: ['A-C', 'C-B', 'B-D', 'D-E'],
      showFinalPath: true
    }
  ];
  
  // Extraire tous les arêtes du graphe
  const extractEdges = () => {
    const edges = [];
    Object.entries(initialGraph).forEach(([node, neighbors]) => {
      Object.entries(neighbors).forEach(([neighbor, weight]) => {
        // Ajouter l'arête seulement si elle n'existe pas déjà (pour éviter les doublons)
        const edgeId = [node, neighbor].sort().join('-');
        if (!edges.some(edge => edge.id === edgeId)) {
          edges.push({
            id: edgeId,
            source: node,
            target: neighbor,
            weight
          });
        }
      });
    });
    return edges;
  };
  
  const edges = extractEdges();
  
  // Effet pour l'auto-play
  useEffect(() => {
    let interval;
    if (autoPlay && currentStep < steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          const nextStep = prev + 1;
          if (nextStep >= steps.length) {
            setAutoPlay(false);
            return prev;
          }
          return nextStep;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [autoPlay, currentStep, steps.length, speed]);
  
  // Fonction pour dessiner une arête
  const renderEdge = (edge, isHighlighted, isPartOfPath) => {
    const sourcePos = nodePositions[edge.source];
    const targetPos = nodePositions[edge.target];
    
    // Calculer le point milieu pour placer le poids
    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;
    
    // Décaler un peu le poids pour qu'il ne soit pas directement sur la ligne
    const offsetX = (targetPos.y - sourcePos.y) * 0.1;
    const offsetY = (sourcePos.x - targetPos.x) * 0.1;
    
    let strokeColor = "#888";
    let strokeWidth = 2;
    
    if (isHighlighted) {
      strokeColor = "#ff9800";
      strokeWidth = 3;
    }
    
    if (isPartOfPath) {
      strokeColor = "#4caf50";
      strokeWidth = 4;
    }
    
    return (
      <g key={edge.id}>
        <line
          x1={sourcePos.x}
          y1={sourcePos.y}
          x2={targetPos.x}
          y2={targetPos.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={midX + offsetX}
          cy={midY + offsetY}
          r={12}
          fill="white"
          stroke={strokeColor}
        />
        <text
          x={midX + offsetX}
          y={midY + offsetY}
          dy=".3em"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
        >
          {edge.weight}
        </text>
      </g>
    );
  };
  
  // Fonction pour dessiner un nœud
  const renderNode = (nodeId, position) => {
    const currentStepData = steps[currentStep];
    const isVisited = currentStepData.visitedNodes.includes(nodeId);
    const isCurrent = currentStepData.currentNode === nodeId;
    const cost = currentStepData.costs[nodeId];
    
    let fillColor = "#2196f3"; // Couleur par défaut
    
    if (nodeId === 'A') {
      fillColor = "#4caf50"; // Nœud de départ
    } else if (nodeId === 'E') {
      fillColor = "#f44336"; // Nœud d'arrivée
    } else if (isCurrent) {
      fillColor = "#ff9800"; // Nœud actuel
    } else if (isVisited) {
      fillColor = "#9c27b0"; // Nœud visité
    }
    
    return (
      <g key={nodeId}>
        <circle
          cx={position.x}
          cy={position.y}
          r={25}
          fill={fillColor}
          stroke="#333"
          strokeWidth={2}
        />
        <text
          x={position.x}
          y={position.y}
          dy=".3em"
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          {nodeId}
        </text>
        <circle
          cx={position.x + 20}
          cy={position.y - 20}
          r={15}
          fill="white"
          stroke="#333"
        />
        <text
          x={position.x + 20}
          y={position.y - 20}
          dy=".3em"
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
        >
          {cost === Infinity ? "∞" : cost}
        </text>
      </g>
    );
  };
  
  // Fonction pour obtenir le chemin final
  const getFinalPath = () => {
    const path = [];
    let current = 'E';
    
    while (current !== null) {
      path.unshift(current);
      current = steps[steps.length - 1].previous[current];
    }
    
    return path;
  };
  
  // Fonction pour obtenir les arêtes du chemin final
  const getFinalPathEdges = () => {
    const path = getFinalPath();
    const pathEdges = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      pathEdges.push([path[i], path[i + 1]].sort().join('-'));
    }
    
    return pathEdges;
  };
  
  // Obtenir les arêtes du chemin final pour le dernier état
  const finalPathEdges = steps[currentStep].showFinalPath ? getFinalPathEdges() : [];
  
  return (
    <div className="p-4 max-w-full mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">Algorithme CHO-DIJKSTRA MIN MAX</h1>
      <p className="text-xl text-center mb-6">Recherche du chemin minimisant la valeur maximale</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Visualisation du Graphe</h2>
          <div className="relative border rounded-lg bg-white" style={{ height: '400px' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 300">
              {/* Dessiner les arêtes */}
              {edges.map(edge => {
                const isHighlighted = steps[currentStep].highlightEdges.includes(edge.id);
                const isPartOfPath = finalPathEdges.includes(edge.id);
                return renderEdge(edge, isHighlighted, isPartOfPath);
              })}
              
              {/* Dessiner les nœuds */}
              {Object.entries(nodePositions).map(([nodeId, position]) => 
                renderNode(nodeId, position)
              )}
            </svg>
          </div>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">État de l'Algorithme</h2>
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Étape {currentStep}</h3>
            <p className="mb-4">{steps[currentStep].description}</p>
            
            <h3 className="font-bold mb-2">Coûts Actuels:</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(steps[currentStep].costs).map(([node, cost]) => (
                <div key={node} className="bg-gray-100 p-2 rounded text-center">
                  <div className="font-bold">{node}</div>
                  <div>{cost === Infinity ? "∞" : cost}</div>
                </div>
              ))}
            </div>
            
            <h3 className="font-bold mb-2">Nœuds Visités:</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {steps[currentStep].visitedNodes.map(node => (
                <span key={node} className="bg-purple-200 px-3 py-1 rounded">{node}</span>
              ))}
            </div>
            
            {steps[currentStep].showFinalPath && (
              <div className="mt-4 p-2 bg-green-100 rounded">
                <h3 className="font-bold mb-2">Chemin Final:</h3>
                <div className="text-center text-lg">
                  {getFinalPath().join(' → ')}
                </div>
                <div className="text-center mt-2">
                  Valeur Min-Max: {steps[currentStep].costs['E']}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-bold mb-4">Contrôles de la Simulation</h2>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Étape Précédente
          </button>
          
          <button 
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Étape Suivante
          </button>
          
          <button 
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-4 py-2 rounded ${autoPlay ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          >
            {autoPlay ? 'Pause' : 'Auto-Play'}
          </button>
          
          <div className="flex items-center">
            <span className="mr-2">Vitesse:</span>
            <input 
              type="range" 
              min="500" 
              max="3000" 
              step="100" 
              value={speed} 
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="ml-2">{speed}ms</span>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Principe de l'Algorithme</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Objectif:</strong> Trouver un chemin entre deux nœuds qui minimise la valeur maximale rencontrée sur ce chemin.
          </li>
          <li>
            <strong>Différence avec Dijkstra standard:</strong> Au lieu de minimiser la somme des poids, on minimise le maximum.
          </li>
          <li>
            <strong>Calcul de relaxation:</strong> Pour chaque arête (u,v), on calcule max(coût[u], poids(u,v)).
          </li>
          <li>
            <strong>Application:</strong> Utile dans les réseaux où l'on cherche à maximiser la bande passante ou minimiser les goulots d'étranglement.
          </li>
        </ul>
      </div>
    </div>
  );
}
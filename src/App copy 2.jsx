import React, { useState, useRef, useEffect } from 'react';
import './index.css';

const App = () => {
  const [nodes, setNodes] = useState([
    { id: 'A', x: 100, y: 175, color: 'red' },
    { id: 'B', x: 175, y: 100, color: 'yellow' },
    { id: 'C', x: 250, y: 175, color: 'red' },
    { id: 'D', x: 175, y: 250, color: 'red' },
    { id: 'E', x: 325, y: 100, color: 'yellow' },
    { id: 'F', x: 325, y: 250, color: 'red' },
    { id: 'G', x: 400, y: 175, color: 'red' }
  ]);

  const [edges, setEdges] = useState([
    { source: 'A', target: 'B', weight: 2 },
    { id: 'A', target: 'C', weight: 1 },
    { source: 'A', target: 'D', weight: 4 },
    { source: 'B', target: 'C', weight: 2 },
    { source: 'B', target: 'E', weight: 4 },
    { source: 'C', target: 'D', weight: 3 },
    { source: 'C', target: 'E', weight: 3 },
    { source: 'D', target: 'F', weight: 1 },
    { source: 'E', target: 'F', weight: 6 },
    { source: 'E', target: 'G', weight: 5 },
    { source: 'F', target: 'G', weight: 2 }
  ]);

  const [nodeForm, setNodeForm] = useState({ id: '', x: 0, y: 0, color: 'blue' });
  const [edgeForm, setEdgeForm] = useState({ source: '', target: '', weight: 0 });
  const [sourceNode, setSourceNode] = useState('A');
  const [targetNode, setTargetNode] = useState('G');
  const [shortestPath, setShortestPath] = useState([]);
  const [distances, setDistances] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [formMode, setFormMode] = useState('add'); // 'add', 'edit'
  const svgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState(null);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    runDijkstra();
  }, [nodes, edges, sourceNode, targetNode]);

  const runDijkstra = () => {
    // Initialize distances
    const dist = {};
    const prev = {};
    const unvisited = new Set();

    nodes.forEach(node => {
      dist[node.id] = node.id === sourceNode ? 0 : Infinity;
      prev[node.id] = null;
      unvisited.add(node.id);
    });

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let current = null;
      let minDist = Infinity;
      
      for (const nodeId of unvisited) {
        if (dist[nodeId] < minDist) {
          minDist = dist[nodeId];
          current = nodeId;
        }
      }

      // No path exists or we've reached the target
      if (current === null || current === targetNode) break;
      
      unvisited.delete(current);

      // Update distances to neighbors
      edges.forEach(edge => {
        if (edge.source === current && unvisited.has(edge.target)) {
          const alt = dist[current] + edge.weight;
          if (alt < dist[edge.target]) {
            dist[edge.target] = alt;
            prev[edge.target] = current;
          }
        }
      });
    }

    // Reconstruct path
    const path = [];
    let current = targetNode;
    
    while (current !== null) {
      path.unshift(current);
      current = prev[current];
    }

    // Only consider it a valid path if it starts from the source
    if (path.length > 0 && path[0] === sourceNode) {
      setShortestPath(path);
    } else {
      setShortestPath([]);
    }
    
    setDistances(dist);

    // Generate table data for visualization
    const tableRows = [];
    let currentRow = {};
    let visitedNodes = [sourceNode];
    
    // Initial row
    currentRow = { A: 0 };
    nodes.forEach(node => {
      if (node.id !== sourceNode) {
        currentRow[node.id] = "∞";
      }
    });
    tableRows.push({...currentRow});
    
    // Process each step
    while (visitedNodes.length < nodes.length) {
      const nodeToProcess = Object.keys(dist)
        .filter(nodeId => !visitedNodes.includes(nodeId))
        .reduce((min, nodeId) => 
          (dist[nodeId] < dist[min] || dist[min] === undefined) ? nodeId : min, 
          Object.keys(dist).find(nodeId => !visitedNodes.includes(nodeId))
        );
      
      if (!nodeToProcess || dist[nodeToProcess] === Infinity) break;
      
      visitedNodes.push(nodeToProcess);
      const newRow = {...currentRow};
      
      // Update distances based on the newly visited node
      edges.forEach(edge => {
        if (edge.source === nodeToProcess && !visitedNodes.includes(edge.target)) {
          const newDist = dist[nodeToProcess] + edge.weight;
          if (newDist < (currentRow[edge.target] === "∞" ? Infinity : currentRow[edge.target])) {
            newRow[edge.target] = newDist;
          }
        }
      });
      
      currentRow = newRow;
      tableRows.push({...currentRow});
    }
    
    setTableData(tableRows);
  };

  const handleNodeFormChange = (e) => {
    const { name, value } = e.target;
    setNodeForm({
      ...nodeForm,
      [name]: name === 'x' || name === 'y' ? parseInt(value, 10) : value,
    });
  };

  const handleEdgeFormChange = (e) => {
    const { name, value } = e.target;
    setEdgeForm({
      ...edgeForm,
      [name]: name === 'weight' ? parseInt(value, 10) : value,
    });
  };

  const addNode = (e) => {
    e.preventDefault();
    if (!nodeForm.id) return;
    
    const newNode = { ...nodeForm };
    setNodes([...nodes, newNode]);
    setNodeForm({ id: '', x: 0, y: 0, color: 'blue' });
  };

  const updateNode = (e) => {
    e.preventDefault();
    if (!selectedNode) return;
    
    setNodes(nodes.map(node => 
      node.id === selectedNode ? { ...nodeForm } : node
    ));
    
    setSelectedNode(null);
    setNodeForm({ id: '', x: 0, y: 0, color: 'blue' });
    setFormMode('add');
  };

  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  };

  const selectNodeForEdit = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setNodeForm({ ...node });
      setFormMode('edit');
    }
  };

  const addEdge = (e) => {
    e.preventDefault();
    if (!edgeForm.source || !edgeForm.target || edgeForm.weight <= 0) return;
    
    // Check if edge already exists
    const edgeExists = edges.some(
      edge => edge.source === edgeForm.source && edge.target === edgeForm.target
    );
    
    if (!edgeExists) {
      setEdges([...edges, { ...edgeForm }]);
    }
    
    setEdgeForm({ source: '', target: '', weight: 0 });
  };

  const updateEdge = (e) => {
    e.preventDefault();
    if (!selectedEdge) return;
    
    setEdges(edges.map(edge => 
      (edge.source === selectedEdge.source && edge.target === selectedEdge.target) 
        ? { ...edgeForm } 
        : edge
    ));
    
    setSelectedEdge(null);
    setEdgeForm({ source: '', target: '', weight: 0 });
    setFormMode('add');
  };

  const deleteEdge = (source, target) => {
    setEdges(edges.filter(edge => 
      !(edge.source === source && edge.target === target)
    ));
  };

  const selectEdgeForEdit = (source, target) => {
    const edge = edges.find(e => e.source === source && e.target === target);
    if (edge) {
      setSelectedEdge(edge);
      setEdgeForm({ ...edge });
      setFormMode('edit');
    }
  };

  const handleNodeMouseDown = (nodeId, e) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragNode) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - svgRect.left;
    const y = e.clientY - svgRect.top;
    
    setNodes(nodes.map(node => 
      node.id === dragNode ? { ...node, x, y } : node
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNode(null);
  };

  const isEdgeInPath = (source, target) => {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      if (
        (shortestPath[i] === source && shortestPath[i + 1] === target) ||
        (shortestPath[i] === target && shortestPath[i + 1] === source)
      ) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">
          <span className="text-green-600">RECHERCHE OPERATIONNELLE</span>
          <span className="mx-4 text-red-600">Algorithme de DJIKSTRA</span>
          <span className="text-green-600">Chemin de valeur optimale</span>
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between mb-4">
              <div>
                <label className="mr-2">Source:</label>
                <select 
                  value={sourceNode} 
                  onChange={(e) => setSourceNode(e.target.value)}
                  className="border p-1 rounded"
                >
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mr-2">Target:</label>
                <select 
                  value={targetNode} 
                  onChange={(e) => setTargetNode(e.target.value)}
                  className="border p-1 rounded"
                >
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.id}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-300 p-2 rounded-lg">
              <svg 
                ref={svgRef}
                width="600" 
                height="400" 
                className="bg-white w-full"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Draw edges */}
                {edges.map((edge) => {
                  const source = nodes.find(node => node.id === edge.source);
                  const target = nodes.find(node => node.id === edge.target);
                  
                  if (!source || !target) return null;
                  
                  const isInPath = isEdgeInPath(edge.source, edge.target);
                  
                  return (
                    <g key={`${edge.source}-${edge.target}`}>
                      <line
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke={isInPath ? "red" : "black"}
                        strokeWidth={isInPath ? "2" : "1"}
                        onClick={() => selectEdgeForEdit(edge.source, edge.target)}
                        className="cursor-pointer"
                      />
                      <text
                        x={(source.x + target.x) / 2}
                        y={(source.y + target.y) / 2 - 10}
                        textAnchor="middle"
                        fill="black"
                        fontSize="12"
                      >
                        {edge.weight}
                      </text>
                    </g>
                  );
                })}
                
                {/* Draw nodes */}
                {nodes.map((node) => (
                  <g 
                    key={node.id} 
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    onClick={() => selectNodeForEdit(node.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="20"
                      fill={node.color}
                      stroke={shortestPath.includes(node.id) ? "blue" : "black"}
                      strokeWidth={shortestPath.includes(node.id) ? "3" : "1"}
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fill="black"
                      fontWeight="bold"
                    >
                      {node.id}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold mb-2">Shortest Path Results:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Path:</strong> {shortestPath.join(' → ')}</p>
                  <p><strong>Distance:</strong> {distances[targetNode] === Infinity ? 'No path found' : distances[targetNode]}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Distances from {sourceNode}:</h4>
                  <ul>
                    {Object.entries(distances).map(([node, dist]) => (
                      <li key={node}>
                        {node}: {dist === Infinity ? '∞' : dist}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Dijkstra Table */}
            <div className="mt-6 overflow-x-auto">
              <h3 className="font-bold mb-2">Dijkstra Algorithm Steps:</h3>
              <table className="border-collapse border w-full">
                <thead>
                  <tr className="bg-gray-200">
                    {nodes.map(node => (
                      <th key={node.id} className="border p-2">{node.id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-yellow-100" : "bg-gray-100"}>
                      {nodes.map(node => (
                        <td key={node.id} className="border p-2 text-center">
                          {row[node.id] !== undefined ? row[node.id] : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            {/* Node Form */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">
                {formMode === 'add' ? 'Add New Node' : 'Edit Node'}
              </h3>
              <form onSubmit={formMode === 'add' ? addNode : updateNode}>
                <div className="mb-2">
                  <label className="block mb-1">ID:</label>
                  <input
                    type="text"
                    name="id"
                    value={nodeForm.id}
                    onChange={handleNodeFormChange}
                    className="border p-2 w-full rounded"
                    disabled={formMode === 'edit'}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">X Position:</label>
                  <input
                    type="number"
                    name="x"
                    value={nodeForm.x}
                    onChange={handleNodeFormChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Y Position:</label>
                  <input
                    type="number"
                    name="y"
                    value={nodeForm.y}
                    onChange={handleNodeFormChange}
                    className="border p-2 w-full rounded"
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Color:</label>
                  <select
                    name="color"
                    value={nodeForm.color}
                    onChange={handleNodeFormChange}
                    className="border p-2 w-full rounded"
                  >
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="yellow">Yellow</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {formMode === 'add' ? 'Add Node' : 'Update Node'}
                  </button>
                  {formMode === 'edit' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedNode) deleteNode(selectedNode);
                        setSelectedNode(null);
                        setNodeForm({ id: '', x: 0, y: 0, color: 'blue' });
                        setFormMode('add');
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* Edge Form */}
            <div className="mb-6">
              <h3 className="font-bold mb-2">
                {selectedEdge ? 'Edit Edge' : 'Add New Edge'}
              </h3>
              <form onSubmit={selectedEdge ? updateEdge : addEdge}>
                <div className="mb-2">
                  <label className="block mb-1">Source Node:</label>
                  <select
                    name="source"
                    value={edgeForm.source}
                    onChange={handleEdgeFormChange}
                    className="border p-2 w-full rounded"
                    required
                    disabled={!!selectedEdge}
                  >
                    <option value="">Select source</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>{node.id}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Target Node:</label>
                  <select
                    name="target"
                    value={edgeForm.target}
                    onChange={handleEdgeFormChange}
                    className="border p-2 w-full rounded"
                    required
                    disabled={!!selectedEdge}
                  >
                    <option value="">Select target</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>{node.id}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block mb-1">Weight:</label>
                  <input
                    type="number"
                    name="weight"
                    value={edgeForm.weight}
                    onChange={handleEdgeFormChange}
                    className="border p-2 w-full rounded"
                    min="1"
                    required
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {selectedEdge ? 'Update Edge' : 'Add Edge'}
                  </button>
                  {selectedEdge && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedEdge) deleteEdge(selectedEdge.source, selectedEdge.target);
                        setSelectedEdge(null);
                        setEdgeForm({ source: '', target: '', weight: 0 });
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* Node List */}
            <div>
              <h3 className="font-bold mb-2">Nodes List</h3>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">ID</th>
                      <th className="text-center">Position</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nodes.map(node => (
                      <tr key={node.id} className="border-b">
                        <td>{node.id}</td>
                        <td className="text-center">({node.x}, {node.y})</td>
                        <td className="text-right">
                          <button
                            onClick={() => selectNodeForEdit(node.id)}
                            className="text-blue-500 mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteNode(node.id)}
                            className="text-red-500"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
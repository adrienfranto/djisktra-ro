import React, { useState, useEffect } from 'react';

const OrdonnancementTableau = () => {
  // Initial state with values similar to those in Image 1
  const [tasks, setTasks] = useState([
    { id: 'a', duration: 7, predecessors: ['-'] },
    { id: 'b', duration: 7, predecessors: ['a'] },
    { id: 'c', duration: 15, predecessors: ['b'] },
    { id: 'd', duration: 30, predecessors: ['c'] },
    { id: 'e', duration: 45, predecessors: ['d'] },
    { id: 'f', duration: 15, predecessors: ['e'] },
    { id: 'g', duration: 45, predecessors: ['d'] },
    { id: 'h', duration: 60, predecessors: ['d'] },
    { id: 'i', duration: 20, predecessors: ['h'] },
    { id: 'j', duration: 30, predecessors: ['i'] },
    { id: 'k', duration: 30, predecessors: ['f'] },
    { id: 'l', duration: 15, predecessors: ['k'] },
    { id: 'm', duration: 30, predecessors: ['g', 'j', 'l'] },
    { id: 'n', duration: 15, predecessors: ['m'] },
    { id: 'o', duration: 30, predecessors: ['n'] },
    { id: 'p', duration: 15, predecessors: ['m'] },
    { id: 'q', duration: 15, predecessors: ['o'] },
    { id: 'r', duration: 15, predecessors: ['q'] },
    { id: 's', duration: 30, predecessors: ['q'] },
    { id: 't', duration: 7, predecessors: ['p'] },
    { id: 'u', duration: 4, predecessors: ['r', 't'] },
    { id: 'v', duration: 2, predecessors: ['s'] },
    { id: 'w', duration: 7, predecessors: ['r', 's'] },
  ]);

  const [successors, setSuccessors] = useState({});
  const [earliestDates, setEarliestDates] = useState({});
  const [latestDates, setLatestDates] = useState({});
  const [margins, setMargins] = useState({});
  const [criticalPath, setCriticalPath] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);

  // Function to generate successors from predecessors
  const generateSuccessors = () => {
    const successorsMap = {};
    
    // Initialize empty arrays for all tasks
    tasks.forEach(task => {
      successorsMap[task.id] = [];
    });
    
    // Fill in successors based on predecessors
    tasks.forEach(task => {
      task.predecessors.forEach(pred => {
        if (pred !== '-') {
          successorsMap[pred].push(task.id);
        }
      });
    });
    
    setSuccessors(successorsMap);
    return successorsMap;
  };

  // Function to calculate earliest start dates (forward pass)
  const calculateEarliestDates = (successorsMap) => {
    const earliest = {};
    const visited = new Set();
    const queue = [];
    
    // Find tasks with no predecessors (starting tasks)
    tasks.forEach(task => {
      if (task.predecessors.length === 1 && task.predecessors[0] === '-') {
        earliest[task.id] = 0;
        queue.push(task.id);
      }
    });
    
    // Process tasks in topological order
    while (queue.length > 0) {
      const currentId = queue.shift();
      visited.add(currentId);
      
      const currentTask = tasks.find(t => t.id === currentId);
      const currentEnd = earliest[currentId] + currentTask.duration;
      
      // Update earliest dates for successors
      successorsMap[currentId].forEach(succId => {
        const successor = tasks.find(t => t.id === succId);
        
        // Check if all predecessors have been processed
        const allPredsProcessed = successor.predecessors.every(
          p => visited.has(p) || p === '-'
        );
        
        if (allPredsProcessed) {
          // Calculate the earliest start time based on all predecessors
          let earliestStart = 0;
          successor.predecessors.forEach(predId => {
            if (predId !== '-') {
              const pred = tasks.find(t => t.id === predId);
              const predEnd = earliest[predId] + pred.duration;
              earliestStart = Math.max(earliestStart, predEnd);
            }
          });
          
          earliest[succId] = earliestStart;
          
          // Add to queue if not already in queue or visited
          if (!queue.includes(succId) && !visited.has(succId)) {
            queue.push(succId);
          }
        }
      });
    }
    
    setEarliestDates(earliest);
    
    // Find the total duration (project end)
    let maxEnd = 0;
    Object.entries(earliest).forEach(([id, start]) => {
      const task = tasks.find(t => t.id === id);
      const end = start + task.duration;
      if (end > maxEnd) maxEnd = end;
    });
    
    setTotalDuration(maxEnd);
    return { earliest, totalDuration: maxEnd };
  };

  // Function to calculate latest start dates (backward pass)
  const calculateLatestDates = (successorsMap, { earliest, totalDuration }) => {
    const latest = {};
    
    // Initialize all tasks with infinity
    tasks.forEach(task => {
      latest[task.id] = Infinity;
    });
    
    // Find tasks with no successors (ending tasks)
    const endingTasks = [];
    Object.entries(successorsMap).forEach(([id, succs]) => {
      if (succs.length === 0) {
        endingTasks.push(id);
        const task = tasks.find(t => t.id === id);
        latest[id] = totalDuration - task.duration;
      }
    });
    
    // If no ending tasks were found, use the task(s) with the latest early finish time
    if (endingTasks.length === 0) {
      let maxEndDate = 0;
      let latestTasks = [];
      
      tasks.forEach(task => {
        const earlyFinish = earliest[task.id] + task.duration;
        if (earlyFinish > maxEndDate) {
          maxEndDate = earlyFinish;
          latestTasks = [task.id];
        } else if (earlyFinish === maxEndDate) {
          latestTasks.push(task.id);
        }
      });
      
      latestTasks.forEach(id => {
        latest[id] = totalDuration - tasks.find(t => t.id === id).duration;
      });
    }
    
    // Process all tasks multiple times until no changes (Bellman-Ford approach)
    let changed = true;
    while (changed) {
      changed = false;
      
      tasks.forEach(task => {
        const taskId = task.id;
        const successorIds = successorsMap[taskId] || [];
        
        if (successorIds.length > 0) {
          // Get the minimum late start time from all successors
          let minLateStartFromSuccessors = Infinity;
          
          successorIds.forEach(succId => {
            if (latest[succId] !== Infinity) {
              minLateStartFromSuccessors = Math.min(
                minLateStartFromSuccessors,
                latest[succId]
              );
            }
          });
          
          // Update the late finish time of the current task
          if (minLateStartFromSuccessors !== Infinity) {
            const newLatestStart = minLateStartFromSuccessors - task.duration;
            if (newLatestStart < latest[taskId]) {
              latest[taskId] = newLatestStart;
              changed = true;
            }
          }
        }
      });
    }
    
    setLatestDates(latest);
    return latest;
  };

  // Calculate margins between earliest and latest dates
  const calculateMargins = (earliest, latest) => {
    const margins = {};
    
    tasks.forEach(task => {
      margins[task.id] = latest[task.id] - earliest[task.id];
    });
    
    setMargins(margins);
    return margins;
  };

  // Function to determine critical path
  const determineCriticalPath = (margins) => {
    // Tasks with zero margin are on the critical path
    const criticalTasks = tasks
      .filter(task => margins[task.id] === 0)
      .map(task => task.id);
    
    // Create a subgraph with only critical tasks
    const criticalGraph = {};
    criticalTasks.forEach(id => {
      criticalGraph[id] = [];
    });
    
    // Fill in the graph with direct successors that are also critical
    criticalTasks.forEach(id => {
      const taskSuccessors = successors[id] || [];
      taskSuccessors.forEach(succId => {
        if (criticalTasks.includes(succId)) {
          criticalGraph[id].push(succId);
        }
      });
    });
    
    // Find starting tasks in the critical path (no critical predecessors)
    const startingTasks = criticalTasks.filter(id => {
      const task = tasks.find(t => t.id === id);
      return !task.predecessors.some(p => criticalTasks.includes(p) && p !== '-');
    });
    
    // Find all paths from each starting task
    let allPaths = [];
    startingTasks.forEach(startId => {
      const paths = findAllPaths(startId, criticalGraph, criticalTasks);
      allPaths = [...allPaths, ...paths];
    });
    
    // Select the longest path
    let longestPath = [];
    let maxLength = 0;
    
    allPaths.forEach(path => {
      const pathDuration = path.reduce((sum, id) => {
        const task = tasks.find(t => t.id === id);
        return sum + task.duration;
      }, 0);
      
      if (pathDuration > maxLength) {
        maxLength = pathDuration;
        longestPath = path;
      }
    });
    
    setCriticalPath(longestPath);
    return longestPath;
  };
  
  // Helper function to find all paths from a starting node
  const findAllPaths = (startId, graph, criticalTasks, visited = new Set(), currentPath = []) => {
    // Add current node to path and mark as visited
    currentPath.push(startId);
    visited.add(startId);
    
    // If we reached a node with no successors, we found a complete path
    const successors = graph[startId] || [];
    if (successors.length === 0) {
      // Return this path
      const result = [currentPath];
      // Remove the current node from visited to allow exploration of other paths
      visited.delete(startId);
      return result;
    }
    
    // Collect all paths from successors
    let allPaths = [];
    successors.forEach(succId => {
      if (!visited.has(succId)) {
        const newPaths = findAllPaths(
          succId,
          graph,
          criticalTasks,
          new Set(visited),
          [...currentPath]
        );
        allPaths = [...allPaths, ...newPaths];
      }
    });
    
    // If no valid paths were found, return this path as is
    if (allPaths.length === 0 && currentPath.length > 0) {
      allPaths = [currentPath];
    }
    
    return allPaths;
  };

  // Update all calculations when tasks change
  useEffect(() => {
    const successorsMap = generateSuccessors();
    const { earliest, totalDuration } = calculateEarliestDates(successorsMap);
    const latest = calculateLatestDates(successorsMap, { earliest, totalDuration });
    const taskMargins = calculateMargins(earliest, latest);
    determineCriticalPath(taskMargins);
  }, [tasks]);

  // IMPROVED: Better task update function for predecessors with automatic comma handling
  const handleTaskUpdate = (index, field, value) => {
    const updatedTasks = [...tasks];
    
    if (field === 'predecessors') {
      // Handle user input for predecessors field
      let predecessorsArray;
      
      // Remove any trailing comma if present and trim whitespace
      const trimmedValue = value.trim().replace(/,\s*$/, '');
      
      if (trimmedValue === '') {
        // Empty input should be treated as no predecessors
        predecessorsArray = ['-'];
      } else {
        // Split by comma and clean up each entry
        predecessorsArray = trimmedValue
          .split(',')
          .map(p => p.trim())
          .filter(p => p !== '');
          
        // Filter out invalid entries but keep valid task IDs
        predecessorsArray = predecessorsArray.filter(pred => {
          if (pred === '-') return true;
          // Allow letters followed by optional numbers (like a, b, c, a1, b2)
          return /^[a-zA-Z]+\d*$/.test(pred);
        });
        
        // If all entries were invalid, default to no predecessors
        if (predecessorsArray.length === 0) {
          predecessorsArray = ['-'];
        }
      }
      
      updatedTasks[index][field] = predecessorsArray;
    } else if (field === 'duration') {
      // Ensure duration is a valid number
      const duration = parseInt(value, 10);
      updatedTasks[index][field] = isNaN(duration) ? 0 : duration;
    } else {
      updatedTasks[index][field] = value;
    }
    
    setTasks(updatedTasks);
  };

  // Enhanced predecessor input handler with auto-formatting
  const handlePredecessorInput = (index, value) => {
    // Current task's predecessors
    const currentPredecessors = tasks[index].predecessors;
    
    // Auto-format: Add a comma if the user is entering a new task ID
    let formattedValue = value;
    
    // If the last character typed is a letter or number and there's no trailing comma
    const lastCharIsValidChar = /[a-zA-Z0-9]$/.test(value);
    const hasTrailingComma = /,\s*$/.test(value);
    
    // Convert the formatted value to an array of predecessors
    handleTaskUpdate(index, 'predecessors', formattedValue);
    
    return formattedValue;
  };

  // Helper function to format predecessors for display in the input field
  const formatPredecessors = (predecessors) => {
    if (predecessors.length === 1 && predecessors[0] === '-') {
      return '-';
    }
    return predecessors.join(', ');
  };

  // Generate a new task ID
  const generateNewTaskId = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    let newId;
    
    // If we've used up all letters, start adding numbers
    if (tasks.length >= alphabet.length) {
      const baseChar = alphabet[tasks.length % alphabet.length];
      const suffix = Math.floor(tasks.length / alphabet.length);
      newId = `${baseChar}${suffix}`;
    } else {
      newId = alphabet[tasks.length];
    }
    
    return newId;
  };

  // Add new task
  const addTask = () => {
    const newId = generateNewTaskId();
    setTasks([...tasks, { id: newId, duration: 0, predecessors: ['-'] }]);
  };

  // Remove task
  const removeTask = (index) => {
    if (tasks.length <= 1) return; // Prevent removing all tasks
    
    const taskToRemove = tasks[index];
    
    // Create updated tasks array
    const updatedTasks = [...tasks];
    updatedTasks.splice(index, 1);
    
    // Remove the task from all predecessors lists
    const finalTasks = updatedTasks.map(task => {
      if (task.predecessors.includes(taskToRemove.id)) {
        // Filter out the removed task from predecessors
        const newPreds = task.predecessors.filter(p => p !== taskToRemove.id);
        // If no predecessors left, add '-'
        return {
          ...task,
          predecessors: newPreds.length > 0 ? newPreds : ['-']
        };
      }
      return task;
    });
    
    setTasks(finalTasks);
  };

  // Render SVG of critical path
  const renderCriticalPathSVG = () => {
    if (criticalPath.length === 0) return <div>Aucun chemin critique trouvé</div>;
    
    const nodeRadius = 20;
    const horizontalGap = 100;
    const verticalGap = 80;
    const startX = 50;
    const startY = 50;
    
    // Position nodes along a line
    const nodes = criticalPath.map((id, index) => {
      const task = tasks.find(t => t.id === id);
      return {
        id,
        x: startX + index * horizontalGap,
        y: startY,
        duration: task.duration
      };
    });
    
    // Create edges between nodes
    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        from: i,
        to: i + 1,
        duration: nodes[i].duration
      });
    }
    
    // Calculate SVG dimensions
    const svgWidth = (nodes.length * horizontalGap) + 100;
    const svgHeight = 150;
    
    return (
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        {/* Draw nodes */}
        {nodes.map((node, index) => (
          <g key={`node-${node.id}`}>
            <circle 
              cx={node.x} 
              cy={node.y} 
              r={nodeRadius} 
              stroke="black" 
              strokeWidth="1" 
              fill="#ffcccc"
            />
            <text 
              x={node.x} 
              y={node.y} 
              textAnchor="middle" 
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="bold"
            >
              {node.id}
            </text>
            
            {/* Add duration below node */}
            <text 
              x={node.x} 
              y={node.y + nodeRadius + 15} 
              textAnchor="middle" 
              fontSize="10"
            >
              d={node.duration}
            </text>
          </g>
        ))}
        
        {/* Draw edges */}
        {edges.map((edge, index) => {
          const fromNode = nodes[edge.from];
          const toNode = nodes[edge.to];
          
          // Calculate arrow points
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          // Normalize
          const nx = dx / length;
          const ny = dy / length;
          
          // Start and end points
          const startX = fromNode.x + (nx * nodeRadius);
          const startY = fromNode.y + (ny * nodeRadius);
          const endX = toNode.x - (nx * nodeRadius);
          const endY = toNode.y - (ny * nodeRadius);
          
          // Midpoint for duration label
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2 - 10; // Offset above the line
          
          return (
            <g key={`edge-${index}`}>
              {/* Draw line */}
              <line 
                x1={startX} 
                y1={startY} 
                x2={endX} 
                y2={endY} 
                stroke="red" 
                strokeWidth="2" 
              />
              
              {/* Draw arrowhead */}
              <polygon 
                points={`${endX},${endY} ${endX - 10*nx + 5*ny},${endY - 10*ny - 5*nx} ${endX - 10*nx - 5*ny},${endY - 10*ny + 5*nx}`} 
                fill="red" 
              />
              
              {/* Display duration */}
              <text 
                x={midX} 
                y={midY} 
                textAnchor="middle" 
                fontSize="12" 
                fill="red"
                fontWeight="bold"
              >
                {fromNode.duration}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="ordonnancement-container" style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', textAlign: 'center', width: '200px' }}>
          RECHERCHE OPERATIONNELLE
        </div>
        <div style={{ color: 'red', fontWeight: 'bold', padding: '10px', textAlign: 'center' }}>
          Ordonnancement des tâches
        </div>
        <div style={{ backgroundColor: '#4CAF50', color: 'white', padding: '10px', textAlign: 'center', width: '200px' }}>
          Ordonnancement des tâches
        </div>
      </div>
      
      <h2>Saisir les données</h2>
      
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
          <thead>
            <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Tâche</th>
              {tasks.map((task) => (
                <th key={task.id} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  {task.id}
                  <button 
                    onClick={() => removeTask(tasks.findIndex(t => t.id === task.id))} 
                    style={{ marginLeft: '5px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                    title="Supprimer cette tâche"
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>Durée</td>
              {tasks.map((task, index) => (
                <td key={`dur-${task.id}`} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="number"
                    value={task.duration}
                    onChange={(e) => handleTaskUpdate(index, 'duration', e.target.value)}
                    style={{ width: '40px' }}
                    min="0"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: 'bold' }}>T.ant.</td>
              {tasks.map((task, index) => (
                <td key={`pred-${task.id}`} style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <input
                    type="text"
                    value={formatPredecessors(task.predecessors)}
                    onChange={(e) => handlePredecessorInput(index, e.target.value)}
                    onBlur={(e) => {
                      // On blur, ensure proper formatting with commas between items
                      const formattedValue = task.predecessors.join(', ');
                      e.target.value = formattedValue;
                    }}
                    onKeyDown={(e) => {
                      // Auto-add comma after typing a valid character if not already followed by a comma
                      if (/[a-zA-Z0-9]/.test(e.key)) {
                        const cursorPos = e.target.selectionStart;
                        const value = e.target.value;
                        const textBeforeCursor = value.substring(0, cursorPos);
                        const textAfterCursor = value.substring(cursorPos);
                        
                        // Check if we need to auto-add a comma
                        if (textBeforeCursor.length > 0 && 
                            /[a-zA-Z0-9]$/.test(textBeforeCursor) && 
                            !textBeforeCursor.endsWith(', ') && 
                            !textBeforeCursor.endsWith(',') && 
                            textBeforeCursor !== '-') {
                          // Add the comma after the current character is added
                          setTimeout(() => {
                            const newValue = e.target.value.substring(0, cursorPos + 1) + ', ' + e.target.value.substring(cursorPos + 1);
                            e.target.value = newValue;
                            e.target.selectionStart = cursorPos + 3; // Position cursor after the comma and space
                            e.target.selectionEnd = cursorPos + 3;
                            handlePredecessorInput(index, newValue);
                          }, 0);
                        }
                      }
                    }}
                    style={{ width: '60px' }}
                    title="Entrez les tâches antérieures séparées par des virgules (ex: a, b, c) ou '-' pour aucune"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={addTask} 
          style={{ 
            marginRight: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Ajouter tâche
        </button>
      </div>
      
      <h2 style={{ color: 'red', textAlign: 'center' }}>Dates au plus tôt</h2>
      
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
          <tbody>
            {Object.entries(earliestDates).length > 0 && (
              <>
                <tr>
                  {tasks.map((task) => (
                    <td key={`early-${task.id}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{task.id}</div>
                      <div style={{ color: criticalPath.includes(task.id) ? 'red' : 'black' }}>
                        {earliestDates[task.id]}
                      </div>
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      
      <h2 style={{ color: 'red', textAlign: 'center' }}>Chemin critique</h2>
      
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#007bff', color: 'white', padding: '10px', textAlign: 'center', marginBottom: '10px' }}>
          Chemin critique: {criticalPath.length > 0 ? criticalPath.join(' → ') : "Aucun chemin critique trouvé"}
        </div>
        
        {renderCriticalPathSVG()}
        
      
      </div>
      
      <h2 style={{ color: 'red', textAlign: 'center' }}>Dates au plus tard</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
          <tbody>
            {Object.entries(latestDates).length > 0 && (
              <>
                <tr>
                  {tasks.map((task) => (
                    <td key={`late-${task.id}`} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{task.id}</div>
                      <div style={{ color: criticalPath.includes(task.id) ? 'red' : 'blue' }}>
                        {latestDates[task.id]}
                      </div>
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', backgroundColor: '#f2f2f2', padding: '10px', borderRadius: '5px' }}>
        <p>Durée totale du projet: <span style={{ color: 'red' }}>{totalDuration}</span></p>
      </div>
    </div>
  );
};

export default OrdonnancementTableau;
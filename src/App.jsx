import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import DijkstraMinimum from './DijkstraMinimum';
import DijkstraMaximum from './DijkstraMaximum';
import OrdonnancementTableau from './OrdonnancementTableau';
import DijkstraMaximumMety from './DijkstraMaximumMety';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
        <header className="bg-blue-600 text-white py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Visualisateur d'Algorithme de Dijkstra</h1>
          <nav className="flex space-x-4">
            <Link 
              to="/dijkstra-minimum" 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Chemin Minimum
            </Link>
            <Link 
              to="/dijkstra-maximum" 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 transition-colors"
            >
              Chemin Maximum
            </Link>
          </nav>
        </header>

        <main className="flex-grow overflow-auto bg-gray-100 p-6">
          <Routes>
            <Route 
              path="/dijkstra-minimum" 
              element={<DijkstraMinimum />} 
            />
            <Route 
              path="/dijkstra-maximum" 
              element={<DijkstraMaximum />} 
            />
            <Route 
              path="/" 
              element={
                <div className="flex items-center justify-center h-full text-gray-500 text-xl">
                  Sélectionnez une visualisation d'algorithme
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
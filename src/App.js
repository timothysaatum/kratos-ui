import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/admin';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Kratos Management System
              </h1>
              <p className="text-gray-600 mb-8">
                Welcome to the Election Management System
              </p>
              <a 
                href="/admin" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Go to Admin Panel
              </a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
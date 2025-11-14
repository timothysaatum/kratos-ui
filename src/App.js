import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/admin';
import VotingPage from './pages/voting';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* ---------- VOTER UI ---------- */}
        <Route path="/vote" element={<VotingPage />} />

        {/* ---------- ADMIN ---------- */}
        <Route path="/admin" element={<Admin />} />

        {/* ---------- HOME ---------- */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Kratos System
                </h1>
                <p className="text-gray-600 mb-8">
                  Welcome to the Election Management System
                </p>

                {/* Two entry points – voters go to /vote, admins to /admin */}
                <div className="space-x-4">
                  <a
                    href="/vote"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Vote Now
                  </a>

                  <a
                    href="/admin"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Admin Panel
                  </a>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
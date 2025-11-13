import React, { useState, useEffect, useCallback } from 'react';
import { LogOut, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AlertModal } from '../components/Modal';
import { useModal } from '../hooks/useModal';
import { Login } from '../components/Login';
import { Dashboard } from '../components/Dashboard';
import { PortfolioManager } from '../components/PortfolioManager';
import { CandidateManager } from '../components/CandidateManager';
import { ElectorateManager } from '../components/ElectorateManager';
import { ResultsView } from '../components/ResultsView';
import { TokenGenerator } from '../components/TokenGenerator';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState(null);
  const [portfolios, setPortfolios] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [electorates, setElectorates] = useState([]);
  const [results, setResults] = useState([]);

  // Modal hook
  const alertModal = useModal();

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const data = await api.verify();
        setAdminData(data);
        setIsAuthenticated(true);
        await loadData();
      } catch (err) {
        // Try to refresh token
        try {
          await api.refreshToken();
          const data = await api.verify();
          setAdminData(data);
          setIsAuthenticated(true);
          await loadData();
        } catch (refreshErr) {
          localStorage.removeItem('admin_token');
          setIsAuthenticated(false);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadData = async () => {
    try {
      const [statsData, portfoliosData, candidatesData, electoratesData, resultsData] = await Promise.all([
        api.getStatistics(),
        api.getPortfolios(),
        api.getCandidates(),
        api.getElectorates(),
        api.getResults(),
      ]);
      setStats(statsData);
      setPortfolios(portfoliosData);
      setCandidates(candidatesData);
      setElectorates(electoratesData);
      setResults(resultsData);
    } catch (err) {
      await alertModal.showAlert({
        title: 'Error',
        message: 'Failed to load data: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleLogin = async (data) => {
    setAdminData(data);
    setIsAuthenticated(true);
    await loadData();
    await alertModal.showAlert({
      title: 'Success!',
      message: 'Login successful!',
      type: 'success'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setAdminData(null);
    setActiveTab('dashboard');
  };

  const refreshData = async () => {
    try {
      await loadData();
      await alertModal.showAlert({
        title: 'Success!',
        message: 'Data refreshed successfully!',
        type: 'success'
      });
    } catch (err) {
      await alertModal.showAlert({
        title: 'Error',
        message: 'Failed to refresh data: ' + err.message,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AlertModal {...alertModal} onClose={alertModal.handleClose} {...alertModal.modalProps} />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AlertModal {...alertModal} onClose={alertModal.handleClose} {...alertModal.modalProps} />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Election Admin</h1>
              <p className="text-sm text-gray-600">Welcome, {adminData?.username}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshData}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {['dashboard', 'portfolios', 'candidates', 'voters', 'tokens', 'results'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard stats={stats} onRefresh={refreshData} />}
        {activeTab === 'portfolios' && <PortfolioManager portfolios={portfolios} onUpdate={refreshData} />}
        {activeTab === 'candidates' && <CandidateManager candidates={candidates} portfolios={portfolios} onUpdate={refreshData} />}
        {activeTab === 'voters' && <ElectorateManager electorates={electorates} onUpdate={refreshData} />}
        {activeTab === 'tokens' && <TokenGenerator electorates={electorates} onUpdate={refreshData} />}
        {activeTab === 'results' && <ResultsView results={results} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Election Management System © 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Admin;
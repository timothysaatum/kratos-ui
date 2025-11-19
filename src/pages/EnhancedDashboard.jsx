import { useState } from "react";
import {
  Users,
  BarChart3,
  FileText,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from "lucide-react";

export const EnhancedDashboard = ({ stats, electorates = [], onRefresh }) => {
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState({});
  const [copiedToken, setCopiedToken] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleTokenVisibility = (id) => {
    setVisibleTokens((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToken = (token, id) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredElectorates = electorates.filter(
    (e) =>
      e.voting_token &&
      (e.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.program?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const electoratesWithTokens = electorates.filter((e) => e.voting_token);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Voters</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.voting?.total_electorates || 0}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.voting?.voted_electorates || 0} have voted
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Votes</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.voting?.total_votes || 0}
              </p>
            </div>
            <BarChart3 className="h-12 w-12 text-green-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.voting?.voting_percentage?.toFixed(1) || 0}% turnout
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Portfolios</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.portfolios?.active_portfolios || 0}
              </p>
            </div>
            <FileText className="h-12 w-12 text-purple-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.portfolios?.total_portfolios || 0} total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Candidates</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.candidates?.active_candidates || 0}
              </p>
            </div>
            <UserCheck className="h-12 w-12 text-orange-500" />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats?.candidates?.total_candidates || 0} total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">
                Voting Turnout
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {stats?.voting?.voting_percentage?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">
                Total Valid Votes
              </p>
              <p className="text-3xl font-bold text-green-900">
                {stats?.voting?.valid_votes || 0}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">
                Active Tokens
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {stats?.tokens?.active_tokens || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Token Management
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">
                Generated Tokens
              </p>
              <p className="text-3xl font-bold text-indigo-900">
                {electoratesWithTokens.length}
              </p>
            </div>
            <button
              onClick={() => setShowTokensModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
              <Eye className="h-5 w-5" />
              View All Generated Tokens
            </button>
          </div>
        </div>
      </div>

      {/* Token View Modal */}
      {showTokensModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Generated Tokens
                </h2>
                <button
                  onClick={() => setShowTokensModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by Student ID, Name, or Program..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {filteredElectorates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No tokens generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredElectorates.map((electorate) => (
                    <div
                      key={electorate.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Student ID</p>
                            <p className="font-medium text-gray-900">
                              {electorate.student_id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Name</p>
                            <p className="font-medium text-gray-900">
                              {electorate.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Program</p>
                            <p className="font-medium text-gray-900">
                              {electorate.program || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Token</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">
                                {visibleTokens[electorate.id]
                                  ? electorate.voting_token
                                  : "••••••••"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleTokenVisibility(electorate.id)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title={
                              visibleTokens[electorate.id]
                                ? "Hide Token"
                                : "Show Token"
                            }
                          >
                            {visibleTokens[electorate.id] ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>

                          {visibleTokens[electorate.id] && (
                            <button
                              onClick={() =>
                                copyToken(
                                  electorate.voting_token,
                                  electorate.id
                                )
                              }
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors relative"
                              title="Copy Token"
                            >
                              {copiedToken === electorate.id ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span>Phone: {electorate.phone_number || "N/A"}</span>
                        <span>Email: {electorate.email || "N/A"}</span>
                        {electorate.has_voted && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                            ✓ Voted
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredElectorates.length} of{" "}
                  {electoratesWithTokens.length} tokens
                </p>
                <button
                  onClick={() => setShowTokensModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

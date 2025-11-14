// src/components/voting/VotingBallot.jsx
import { useState, useEffect, useMemo } from "react";
import { votingApi } from "../services/votingApi";
import LoadingSpinner from "./shared/LoadingSpinner";

const API_BASE_URL = "http://localhost:8000/api";

const VotingBallot = ({ voterData, onVoteComplete, sessionTime }) => {
  const [candidates, setCandidates] = useState([]);
  const [selectedVotes, setSelectedVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loadBallot = async () => {
      try {
        setLoading(true);
        const data = await votingApi.getBallot();
        setCandidates(data);
      } catch (err) {
        setError(err.message || "Failed to load ballot");
      } finally {
        setLoading(false);
      }
    };
    loadBallot();
  }, []);

  const portfolios = useMemo(() => {
    const map = new Map();
    candidates.forEach((cand) => {
      const port = cand.portfolio;
      if (!port) return;
      const key = port.id;
      if (!map.has(key)) {
        map.set(key, { ...port, candidates: [] });
      }
      map.get(key).candidates.push(cand);
    });

    return Array.from(map.values())
      .sort((a, b) => a.voting_order - b.voting_order)
      .map((port) => ({
        ...port,
        candidates: port.candidates.sort(
          (a, b) => a.display_order - b.display_order
        ),
      }));
  }, [candidates]);

  const handleCandidateSelect = (portfolioId, candidateId) => {
    setSelectedVotes((prev) => {
      const current = prev[portfolioId];
      // Toggle selection - if same candidate clicked, deselect
      if (current === candidateId) {
        const newVotes = { ...prev };
        delete newVotes[portfolioId];
        return newVotes;
      }
      return {
        ...prev,
        [portfolioId]: candidateId,
      };
    });
  };

  const handleEndorseOrRefuse = (portfolioId, action) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [portfolioId]: action, // 'endorse' or 'refuse'
    }));
  };

  const handleSubmitVotes = () => {
    setError("");
    if (Object.keys(selectedVotes).length === 0) {
      setError("Please make at least one selection");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    const votes = Object.entries(selectedVotes)
      .filter(([_, value]) => value !== "refuse") // Only submit endorsements
      .map(([portfolio_id, candidate_id]) => ({
        portfolio_id,
        candidate_id,
      }));

    setSubmitting(true);
    setError("");
    setShowConfirmModal(false);

    try {
      const result = await votingApi.castVote(votes);
      onVoteComplete(result);
    } catch (err) {
      setError(err.message || "Failed to cast votes");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const selectedCount = Object.keys(selectedVotes).length;
  const isSessionExpiring = sessionTime < 5 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full">
          <LoadingSpinner message="Loading your ballot..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fixed Header - Reduced height */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            {" "}
            {/* Reduced padding */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              {" "}
              {/* Reduced gap */}
              {/* Left: Voter Info */}
              <div className="flex items-center gap-3">
                {" "}
                {/* Reduced gap */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {" "}
                  {/* Smaller avatar */}
                  {voterData.name?.charAt(0) || "V"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {" "}
                    {/* Smaller text */}
                    {voterData.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    {" "}
                    {/* Smaller text */}
                    {voterData.electoral_area && (
                      <>
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{voterData.electoral_area}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Center: Progress - Reduced height */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-1">
                  {" "}
                  {/* Reduced margin */}
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {selectedCount} / {portfolios.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  {" "}
                  {/* Reduced height */}
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out rounded-full"
                    style={{
                      width: `${
                        portfolios.length > 0
                          ? (selectedCount / portfolios.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              {/* Right: Session Timer */}
              <div className="flex items-center gap-3">
                {" "}
                {/* Reduced gap */}
                <div className="text-right">
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${
                      isSessionExpiring ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    Time Left
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isSessionExpiring ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {formatTime(sessionTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {" "}
        {/* Adjusted padding */}
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}
        {/* Portfolios */}
        <div className="space-y-8">
          {portfolios.map((portfolio, idx) => (
            <div
              key={portfolio.id}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {idx + 1}. {portfolio.name}
                  </h2>
                  {portfolio.description && (
                    <p className="text-gray-600 text-base mt-2">
                      {portfolio.description}
                    </p>
                  )}
                </div>
                {selectedVotes[portfolio.id] && (
                  <span className="bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolio.candidates.map((candidate) => {
                  const isSelected =
                    selectedVotes[portfolio.id] === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      onClick={() =>
                        handleCandidateSelect(portfolio.id, candidate.id)
                      }
                      className={`group relative flex flex-col items-center p-6 rounded-xl border text-center transition-all duration-300 hover:scale-105 ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-xl"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-lg"
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-4 right-4">
                        <div
                          className={`
                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300 group-hover:border-blue-400"
                            }
                          `}
                        >
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Larger Photo */}
                      {candidate.picture_url ? (
                        <img
                          src={`${API_BASE_URL.replace("/api", "")}${
                            candidate.picture_url
                          }`}
                          alt={candidate.name}
                          className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 shadow-md mb-4" // Larger image
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/128?text=Photo";
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-200 border-2 border-dashed rounded-full flex items-center justify-center text-gray-400 text-base mb-4">
                          No Photo
                        </div>
                      )}

                      {/* Info */}
                      <div className="w-full">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {candidate.name}
                        </h3>
                        {candidate.bio && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                            {candidate.bio}
                          </p>
                        )}
                        {candidate.manifesto && (
                          <p className="text-gray-500 text-sm italic line-clamp-2">
                            Manifesto: {candidate.manifesto}
                          </p>
                        )}
                        {candidate.party && (
                          <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                            {candidate.party}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {/* Submit Section */}
        <div className="mt-10 sticky bottom-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <button
              onClick={handleSubmitVotes}
              disabled={submitting || selectedCount === 0}
              className={`w-full py-4 px-8 rounded-xl font-bold text-lg uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                submitting || selectedCount === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-2xl"
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Submitting Your Ballot...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Cast{" "}
                  {selectedCount > 0 &&
                    `(${selectedCount}) `} 
                  Ballots
                </>
              )}
            </button>

            {selectedCount === 0 && (
              <p className="text-center text-sm text-gray-600 font-medium mt-4">
                Make your selections above to continue
              </p>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-bold text-gray-700">Kratos Election System</p>
          </div>
          <p className="text-gray-500">
            All votes are encrypted, confidential, and final upon submission
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Confirm Your Ballot
              </h3>
              <p className="text-gray-600">
                You are about to submit your ballot with{" "}
                <span className="font-bold text-gray-900">
                  {selectedCount} selection{selectedCount > 1 ? "s" : ""}
                </span>
                . This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Review Again
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingBallot;
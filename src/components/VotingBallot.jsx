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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full">
          <LoadingSpinner message="Loading your ballot..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left: Voter Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {voterData.name?.charAt(0) || "V"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {voterData.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {voterData.electoral_area && (
                      <>
                        <svg
                          className="w-4 h-4"
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

              {/* Center: Progress */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedCount} / {portfolios.length}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
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
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <svg
                  className={`w-5 h-5 ${
                    isSessionExpiring ? "text-red-500" : "text-slate-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs text-slate-500 font-medium">
                    Time Remaining
                  </p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      isSessionExpiring ? "text-red-600" : "text-slate-900"
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-md animate-shake">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-red-900">Error</h3>
                <p className="text-sm text-red-800 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolios */}
        <div className="space-y-8">
          {portfolios.map((portfolio, idx) => {
            const isSingleCandidate = portfolio.candidates.length === 1;
            const currentSelection = selectedVotes[portfolio.id];

            return (
              <div
                key={portfolio.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 transition-all duration-300 hover:shadow-2xl"
              >
                {/* Portfolio Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold border border-white/20">
                        {idx + 1}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {portfolio.name}
                        </h2>
                        {portfolio.description && (
                          <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {currentSelection && currentSelection !== "refuse" && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                        <svg
                          className="w-4 h-4 mr-1.5"
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
                    {currentSelection === "refuse" && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-slate-500 text-white text-xs font-bold uppercase tracking-wide shadow-lg">
                        Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidates Section */}
                <div className="p-6">
                  {isSingleCandidate ? (
                    // Single Candidate Layout - Endorse/Refuse
                    <div className="space-y-6">
                      {portfolio.candidates.map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex flex-col lg:flex-row items-center gap-8 p-6 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          {/* Candidate Info */}
                          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
                            <div className="relative group">
                              {candidate.picture_url ? (
                                <img
                                  src={`${API_BASE_URL.replace("/api", "")}${
                                    candidate.picture_url
                                  }`}
                                  alt={candidate.name}
                                  className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-xl group-hover:shadow-2xl transition-shadow duration-300"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/128?text=Photo";
                                  }}
                                />
                              ) : (
                                <div className="w-32 h-32 bg-gradient-to-br from-slate-200 to-slate-300 border-4 border-white rounded-2xl flex items-center justify-center shadow-xl">
                                  <svg
                                    className="w-16 h-16 text-slate-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="text-center sm:text-left">
                              <h3 className="text-2xl font-bold text-slate-900">
                                {candidate.name}
                              </h3>
                              <p className="text-slate-600 mt-1">
                                Candidate for {portfolio.name}
                              </p>
                            </div>
                          </div>

                          {/* Endorse/Refuse Buttons */}
                          <div className="flex flex-col gap-3 w-full lg:w-auto">
                            <button
                              onClick={() =>
                                handleEndorseOrRefuse(
                                  portfolio.id,
                                  candidate.id
                                )
                              }
                              className={`px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                                currentSelection === candidate.id
                                  ? "bg-green-500 text-white ring-4 ring-green-200"
                                  : "bg-white text-green-600 border-2 border-green-500 hover:bg-green-50"
                              }`}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {currentSelection === candidate.id
                                ? "Endorsed"
                                : "Endorse"}
                            </button>
                            <button
                              onClick={() =>
                                handleEndorseOrRefuse(portfolio.id, "refuse")
                              }
                              className={`px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${
                                currentSelection === "refuse"
                                  ? "bg-slate-600 text-white ring-4 ring-slate-200"
                                  : "bg-white text-slate-600 border-2 border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              <svg
                                className="w-5 h-5"
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
                              {currentSelection === "refuse"
                                ? "Declined"
                                : "Decline to Vote"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Multiple Candidates Layout
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {portfolio.candidates.map((candidate) => {
                        const isSelected = currentSelection === candidate.id;
                        return (
                          <button
                            key={candidate.id}
                            onClick={() =>
                              handleCandidateSelect(portfolio.id, candidate.id)
                            }
                            className={`group relative flex flex-col items-center p-6 rounded-2xl text-center transition-all duration-300 ${
                              isSelected
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl scale-105 ring-4 ring-blue-200"
                                : "bg-white border-2 border-slate-200 hover:border-blue-400 hover:shadow-xl hover:scale-102"
                            }`}
                          >
                            {/* Selection Checkmark */}
                            <div className="absolute top-4 right-4">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-white"
                                    : "bg-slate-100 group-hover:bg-blue-50"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    className="w-5 h-5 text-blue-600"
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

                            {/* Candidate Photo */}
                            <div className="mb-5 relative">
                              {candidate.picture_url ? (
                                <img
                                  src={`${API_BASE_URL.replace("/api", "")}${
                                    candidate.picture_url
                                  }`}
                                  alt={candidate.name}
                                  className={`w-32 h-32 rounded-2xl object-cover shadow-xl transition-all duration-300 ${
                                    isSelected
                                      ? "border-4 border-white"
                                      : "border-4 border-slate-200 group-hover:border-blue-300"
                                  }`}
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/128?text=Photo";
                                  }}
                                />
                              ) : (
                                <div
                                  className={`w-32 h-32 rounded-2xl flex items-center justify-center shadow-xl transition-all ${
                                    isSelected
                                      ? "bg-white/20 border-4 border-white"
                                      : "bg-slate-100 border-4 border-slate-200 group-hover:border-blue-300"
                                  }`}
                                >
                                  <svg
                                    className={`w-16 h-16 ${
                                      isSelected
                                        ? "text-white"
                                        : "text-slate-400"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Candidate Name */}
                            <h3
                              className={`text-lg font-bold leading-tight ${
                                isSelected ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {candidate.name}
                            </h3>

                            {isSelected && (
                              <p className="text-sm text-white/80 mt-2 font-medium">
                                Click again to deselect
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Section */}
        <div className="mt-10 sticky bottom-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
            <button
              onClick={handleSubmitVotes}
              disabled={submitting || selectedCount === 0}
              className={`w-full py-5 px-8 rounded-xl font-bold text-lg uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                submitting || selectedCount === 0
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl hover:scale-102"
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                  Submitting Your Ballot...
                </>
              ) : (
                <>
                  <svg
                    className="w-7 h-7"
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
                  Submit Ballot{" "}
                  {selectedCount > 0 &&
                    `(${selectedCount} Selection${
                      selectedCount > 1 ? "s" : ""
                    })`}
                </>
              )}
            </button>

            {selectedCount === 0 && (
              <p className="text-center text-sm text-slate-600 font-medium mt-4">
                Make your selections above to continue
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 pb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-bold text-slate-700">Kratos Election System</p>
          </div>
          <p className="text-slate-500">
            All votes are encrypted, confidential, and final upon submission
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
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
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Confirm Your Ballot
              </h3>
              <p className="text-slate-600">
                You are about to submit your ballot with{" "}
                <span className="font-bold text-slate-900">
                  {selectedCount} selection{selectedCount > 1 ? "s" : ""}
                </span>
                . This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Review Again
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
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

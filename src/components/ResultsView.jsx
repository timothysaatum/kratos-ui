import { Trophy, TrendingUp, Target, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

export const ResultsView = ({ results }) => {
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

  // Helper function to get full image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:8000${cleanUrl}`;
  };

  const stats = useMemo(() => {
    const totalVotes = results.reduce((sum, r) => sum + r.total_votes, 0);
    const totalPortfolios = results.length;
    const winnerData = results.map(r => r.winner).filter(Boolean);
    return {
      totalVotes,
      totalPortfolios,
      winners: winnerData.length,
      avgVotesPerPortfolio: totalPortfolios ? Math.round(totalVotes / totalPortfolios) : 0,
    };
  }, [results]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Election Results</h2>
          <p className="text-sm text-gray-600 mt-1">{stats.totalVotes} votes • {stats.totalPortfolios} portfolios • {stats.winners} winners</p>
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-600 font-medium">Total Votes</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.totalVotes}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium">Portfolios</p>
            <p className="text-2xl font-bold text-blue-900">{stats.totalPortfolios}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 font-medium">Determined Winners</p>
            <p className="text-2xl font-bold text-green-900">{stats.winners}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 font-medium">Avg Votes/Portfolio</p>
            <p className="text-2xl font-bold text-purple-900">{stats.avgVotesPerPortfolio}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {results.map((result) => (
          <div key={result.portfolio_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            onClick={() => setSelectedPortfolio(selectedPortfolio === result.portfolio_id ? null : result.portfolio_id)}>
            {/* Portfolio Header */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{result.portfolio_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>{result.total_votes} Total Votes</span>
              </div>
            </div>

            {/* Winner Section */}
            {
              result.winner && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-lg p-4 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <Trophy className="h-16 w-16 text-yellow-400 opacity-20" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-1 mb-2">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Winner</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.winner.picture_url && (
                        <img
                          src={getImageUrl(result.winner.picture_url)}
                          alt={result.winner.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-yellow-400"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{result.winner.name}</p>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">{result.winner.vote_count}</span> votes
                          <span className="text-gray-500 ml-2">
                            ({result.total_votes > 0 ? ((result.winner.vote_count / result.total_votes) * 100).toFixed(1) : 0}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {/* All Candidates */}
            < div className="space-y-2" >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All Candidates</p>
              {
                result.candidates.map((candidate, index) => {
                  const isWinner = result.winner && candidate.id === result.winner.id;
                  const percentage = result.total_votes > 0 ? ((candidate.vote_count / result.total_votes) * 100).toFixed(1) : 0;

                  return (
                    <div
                      key={candidate.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isWinner ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-sm font-bold flex-shrink-0 ${isWinner ? 'text-yellow-600' : 'text-gray-400'
                          }`}>
                          #{index + 1}
                        </span>
                        {candidate.picture_url && (
                          <img
                            src={getImageUrl(candidate.picture_url)}
                            alt={candidate.name}
                            className={`h-8 w-8 rounded-full object-cover flex-shrink-0 ${isWinner ? 'ring-2 ring-yellow-400' : ''
                              }`}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span className={`font-medium truncate ${isWinner ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                          {candidate.name}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-base font-bold ${isWinner ? 'text-yellow-700' : 'text-gray-900'
                          }`}>
                          {candidate.vote_count}
                        </p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* Progress Bar */}
            {result.total_votes > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Vote Distribution</p>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                  {result.candidates.map((candidate, index) => {
                    const percentage = (candidate.vote_count / result.total_votes) * 100;
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-purple-500',
                      'bg-orange-500',
                      'bg-pink-500',
                      'bg-indigo-500',
                    ];
                    return (
                      <div
                        key={candidate.id}
                        className={colors[index % colors.length]}
                        style={{ width: `${percentage}%` }}
                        title={`${candidate.name}: ${percentage.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))
        }
      </div >

      {
        results.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No results available yet</p>
            <p className="text-gray-400 text-sm mt-2">Results will appear here once voting has started</p>
          </div>
        )
      }
    </div >
  );
};
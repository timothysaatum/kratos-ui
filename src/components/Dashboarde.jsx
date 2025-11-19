import { Users, BarChart3, FileText, UserCheck } from 'lucide-react';

export const Dashboard = ({ stats, onRefresh }) => (
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

    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-600 font-medium">Voting Turnout</p>
          <p className="text-3xl font-bold text-blue-900">
            {stats?.voting?.voting_percentage?.toFixed(1) || 0}%
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Total Valid Votes</p>
          <p className="text-3xl font-bold text-green-900">
            {stats?.voting?.valid_votes || 0}
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-600 font-medium">Active Tokens</p>
          <p className="text-3xl font-bold text-purple-900">
            {stats?.tokens?.active_tokens || 0}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <p className="text-sm text-orange-600 font-medium">Portfolios with Candidates</p>
          <p className="text-3xl font-bold text-orange-900">
            {stats?.portfolios?.portfolios_with_candidates || 0}
          </p>
        </div>
      </div>
    </div>
  </div>
);

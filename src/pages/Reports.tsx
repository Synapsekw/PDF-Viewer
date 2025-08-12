import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Eye, Calendar, Users, Clock, FileText, Search, Bot } from 'lucide-react';
import AIUsageDashboard from '../features/analytics/AIUsageDashboard';

const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'ai'>('reports');

  useEffect(() => {
    // Simulate loading reports
    setTimeout(() => {
      setReports([]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Reports</h1>
            <p className="text-slate-400">
              View analytics for shared PDF documents and AI usage
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'reports'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Document Analytics
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'ai'
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <Bot className="w-4 h-4" />
            AI Usage Analytics
          </button>
        </div>

        {activeTab === 'reports' ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">{reports.length}</div>
                    <div className="text-slate-400 text-sm">Total Reports</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
                <div className="flex items-center gap-3">
                  <Eye className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-slate-400 text-sm">Total Views</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">0</div>
                    <div className="text-slate-400 text-sm">Total Sessions</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-orange-400" />
                  <div>
                    <div className="text-2xl font-bold text-white">0m</div>
                    <div className="text-slate-400 text-sm">Avg Duration</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
                />
              </div>
            </div>

            {/* Empty State */}
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                No reports yet
              </h3>
              <p className="text-slate-500">
                Share some PDFs and their analytics will appear here
              </p>
            </div>
          </>
        ) : (
          <AIUsageDashboard />
        )}
      </div>
  );
};

export default Reports;
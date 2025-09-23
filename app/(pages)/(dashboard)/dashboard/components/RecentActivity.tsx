'use client';

import { useState, useEffect } from 'react';
import { Activity, Clock, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface Log {
  _id: string;
  username: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  success: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface RecentActivityProps {
  userRole?: string;
}

export default function RecentActivity({ userRole }: RecentActivityProps) {
  const { isDarkMode } = useDarkMode();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole === 'superadmin') {
      fetchRecentLogs();
    }
  }, [userRole]);

  const fetchRecentLogs = async () => {
    try {
      const response = await fetch('/api/logs?limit=10');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('login')) return <User className="w-4 h-4" />;
    if (action.includes('create')) return <CheckCircle className="w-4 h-4" />;
    if (action.includes('update')) return <Activity className="w-4 h-4" />;
    if (action.includes('delete')) return <XCircle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (action.includes('create')) return isDarkMode ? 'text-green-400' : 'text-green-600';
    if (action.includes('update')) return isDarkMode ? 'text-blue-400' : 'text-blue-600';
    if (action.includes('login')) return isDarkMode ? 'text-purple-400' : 'text-purple-600';
    return isDarkMode ? 'text-gray-400' : 'text-gray-600';
  };

  const getSeverityColor = (severity: string) => {
    if (isDarkMode) {
      switch (severity) {
        case 'critical': return 'bg-red-900/50 text-red-300 border border-red-800';
        case 'error': return 'bg-orange-900/50 text-orange-300 border border-orange-800';
        case 'warning': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-800';
        default: return 'bg-green-900/50 text-green-300 border border-green-800';
      }
    } else {
      switch (severity) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'error': return 'bg-orange-100 text-orange-800';
        case 'warning': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-green-100 text-green-800';
      }
    }
  };

  const formatAction = (action: string) => {
    return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (userRole !== 'superadmin') {
    return null;
  }

  return (
    <div className={`rounded-xl border shadow-lg transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Activity className={`w-5 h-5 transition-colors duration-300 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Recent Activity</h3>
        </div>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Latest system activities and user actions
        </p>
      </div>
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className={`animate-spin rounded-full h-6 w-6 border-b-2 transition-colors duration-300 ${
              isDarkMode ? 'border-white' : 'border-gray-900'
            }`}></div>
            <span className={`ml-2 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Loading...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className={`text-center py-8 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Activity className={`w-8 h-8 mx-auto mb-2 opacity-50 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className="text-sm">No recent activity</p>
            <p className={`text-xs mt-1 transition-colors duration-300 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              System activities will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log._id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors duration-300 ${
                isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}>
                <div className={`mt-1 ${getActionColor(log.action)}`}>
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{log.username}</span>
                    <span className={`px-2 py-1 text-xs rounded transition-colors duration-300 ${
                      isDarkMode ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.userRole}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </span>
                  </div>
                  <p className={`text-sm mb-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {formatAction(log.action)} {log.resource}
                    {log.resourceId && (
                      <span className={`font-mono transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {' '}({log.resourceId.substring(0, 8)}...)
                      </span>
                    )}
                  </p>
                  <div className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {log.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <button 
                className={`w-full px-4 py-2 text-sm border rounded-md transition-all duration-300 ${
                  isDarkMode 
                    ? 'border-slate-600 bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white' 
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => window.location.href = '/dashboard/logs'}
              >
                View All Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
